import json
import httpx

from config import config, PROVIDERS
from fastapi import HTTPException
from db.usage import patch_usage
from fastapi.responses import StreamingResponse


def _normalize_url(url: str) -> str:
    cleaned = (url or "").strip().rstrip("/")
    if cleaned.endswith("/chat/completions"):
        cleaned = cleaned[:-len("/chat/completions")].rstrip("/")
    return cleaned


def _get_provider_chain():
    """Returns an ordered list of available providers (primary first, then configured fallbacks)."""
    chain = []
    # Primary
    if config.LLM_PROVIDER_BASE_URL:
        chain.append({
            "name": "primary",
            "url": _normalize_url(config.LLM_PROVIDER_BASE_URL),
            "api_key": config.LLM_PROVIDER_API_KEY or "",
            "default_model": config.DEFAULT_MODEL,
        })

    # Add other configured providers as fallback
    for name, p in PROVIDERS.items():
        prov_url = _normalize_url(p.get("url") or "")
        if prov_url and prov_url != _normalize_url(config.LLM_PROVIDER_BASE_URL or ""):
            if p.get("api_key") or name == "custom":
                chain.append({
                    "name": name,
                    "url": prov_url,
                    "api_key": p.get("api_key") or "",
                    "default_model": p.get("default_model") or "llama3",
                })
    return chain


async def chat_completion(body):
    upstream_payload = body.model_dump(exclude_none=True)
    if body.tools is None:
        upstream_payload.pop("tools", None)

    providers = _get_provider_chain()
    if not providers:
        # No configured provider found
        err_msg = "No LLM provider configured on backend. Please configure custom LLM, OPENROUTER_API_KEY, or GROQ_API_KEY."
        if body.stream:
            async def err_stream():
                yield f"data: {json.dumps({'error': err_msg})}\n\n"
                yield "data: [DONE]\n\n"
            return StreamingResponse(
                err_stream(),
                media_type="text/event-stream",
                headers={"Cache-Control": "no-cache"},
            )
        raise HTTPException(status_code=401, detail=err_msg)

    if body.stream:
        return await _stream_completion(
            upstream_payload=upstream_payload,
            requested_model=body.model,
            providers=providers,
        )

    return await _normal_completion(
        upstream_payload=upstream_payload,
        requested_model=body.model,
        providers=providers,
    )


async def _normal_completion(
    upstream_payload: dict,
    requested_model: str | None,
    providers: list,
):
    last_error = None

    for prov in providers:
        payload = dict(upstream_payload)
        payload["model"] = requested_model or prov["default_model"] or config.DEFAULT_MODEL

        headers = {
            "Content-Type": "application/json",
            "HTTP-Referer": "https://threatlens.io",
            "X-Title": "ThreatLensGo Security Agent",
        }
        if prov.get("api_key"):
            headers["Authorization"] = f"Bearer {prov['api_key']}"

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{prov['url']}/chat/completions",
                    headers=headers,
                    json=payload,
                )

            if response.status_code == 200:
                data = response.json()
                usage = data.get("usage")
                if usage:
                    patch_usage(
                        prompt_tokens=usage.get("prompt_tokens", 0),
                        completion_tokens=usage.get("completion_tokens", 0),
                        total_tokens=usage.get("total_tokens", 0),
                    )
                return data

            last_error = f"Upstream Error ({response.status_code}): {response.text}"
            # If 401 or 429, try next provider in fallback chain
            if response.status_code in (401, 429, 502, 503):
                continue
            raise HTTPException(status_code=response.status_code, detail=response.text)

        except HTTPException:
            raise
        except httpx.RequestError as exc:
            last_error = f"LLM provider ({prov['name']}) request failed: {str(exc)}"
            continue

    raise HTTPException(status_code=502, detail=last_error or "All upstream LLM providers failed")


async def _stream_completion(
    upstream_payload: dict,
    requested_model: str | None,
    providers: list,
):
    async def stream_generator():
        last_error = None
        succeeded = False

        for prov_idx, prov in enumerate(providers):
            payload = dict(upstream_payload)
            payload["model"] = requested_model or prov["default_model"] or config.DEFAULT_MODEL

            headers = {
                "Content-Type": "application/json",
                "HTTP-Referer": "https://threatlens.io",
                "X-Title": "ThreatLensGo Security Agent",
            }
            if prov.get("api_key"):
                headers["Authorization"] = f"Bearer {prov['api_key']}"

            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    async with client.stream(
                        "POST",
                        f"{prov['url']}/chat/completions",
                        headers=headers,
                        json=payload,
                    ) as response:
                        if response.status_code != 200:
                            error_body = await response.aread()
                            last_error = (
                                f"Upstream Error ({response.status_code}): "
                                f"{error_body.decode()}"
                            )
                            # If we have another fallback provider and this one failed with 401/429/5xx, try next
                            if prov_idx < len(providers) - 1 and response.status_code in (401, 429, 502, 503):
                                continue

                            yield f"data: {json.dumps({'error': last_error})}\n\n"
                            yield "data: [DONE]\n\n"
                            return

                        succeeded = True
                        async for line in response.aiter_lines():
                            if not line:
                                yield "\n"
                                continue

                            yield f"{line}\n"

                            if line.startswith("data: "):
                                data = line[6:]
                                if data == "[DONE]":
                                    continue

                                try:
                                    chunk = json.loads(data)
                                except json.JSONDecodeError:
                                    continue

                                usage = chunk.get("usage")
                                if usage:
                                    patch_usage(
                                        prompt_tokens=usage.get("prompt_tokens", 0),
                                        completion_tokens=usage.get("completion_tokens", 0),
                                        total_tokens=usage.get("total_tokens", 0),
                                    )

                        # If stream finished normally, exit loop
                        return

            except httpx.RequestError as exc:
                last_error = f"LLM provider ({prov['name']}) request failed: {str(exc)}"
                if prov_idx < len(providers) - 1:
                    continue

        if not succeeded:
            error = {"error": last_error or "All upstream LLM providers failed"}
            yield f"data: {json.dumps(error)}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        stream_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )