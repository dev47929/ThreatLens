from schema.llm_chat import ChatRequest, PatchUsageRequest, CustomProviderRequest, TestConnectionRequest
from config import config, PROVIDERS
from typing import Literal
from fastapi import APIRouter, Query, HTTPException
from service.llm_gateway_service import chat_completion
from pathlib import Path
import json
import httpx
from db.usage import (
    get_usage,
    patch_usage,
    sync_usage
)

from db.limit import (
    get_limit,
    sync_limit
)


router = APIRouter(
    prefix="/llm",
    tags=["LLM Gateway"],
)


def _save_llm_persistence(provider: str, base_url: str, api_key: str, default_model: str):
    try:
        cfg_dir = Path.home() / ".threatlensgo"
        cfg_dir.mkdir(parents=True, exist_ok=True)
        cfg_file = cfg_dir / "config.json"
        existing = {}
        if cfg_file.exists():
            with open(cfg_file, "r", encoding="utf-8") as f:
                existing = json.load(f)
        existing["llm"] = {
            "provider": provider,
            "custom_base_url": base_url,
            "custom_api_key": api_key,
            "custom_model": default_model,
        }
        with open(cfg_file, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2)
    except Exception:
        pass


@router.get("/provider")
def get_provider():
    current_provider = None

    for name, provider in PROVIDERS.items():
        if (
            config.LLM_PROVIDER_BASE_URL == provider["url"]
            and (
                config.LLM_PROVIDER_API_KEY == provider["api_key"]
                or (name == "custom" and (not provider["api_key"] or config.LLM_PROVIDER_API_KEY == provider["api_key"]))
            )
        ):
            current_provider = name
            break

    if not current_provider and config.LLM_PROVIDER_BASE_URL == PROVIDERS["custom"]["url"]:
        current_provider = "custom"

    return {
        "current": {
            "provider": current_provider,
            "base_url": config.LLM_PROVIDER_BASE_URL,
            "default_model": config.DEFAULT_MODEL,
        },
        "available": {
            name: {
                "base_url": provider["url"],
                "default_model": provider["default_model"],
                "configured": bool(provider["api_key"]) or name == "custom",
            }
            for name, provider in PROVIDERS.items()
        },
    }


@router.patch("/provider")
def set_provider(
    provider: Literal["openrouter", "groq", "custom"] = Query("openrouter"),
):
    provider = provider.lower()

    if provider not in PROVIDERS:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Unsupported provider",
                "available": list(PROVIDERS.keys()),
            },
        )

    selected = PROVIDERS[provider]

    if provider != "custom" and not selected["api_key"]:
        raise HTTPException(
            status_code=400,
            detail=f"{provider} API key is not configured",
        )

    config.LLM_PROVIDER_BASE_URL = selected["url"]
    config.LLM_PROVIDER_API_KEY = selected["api_key"]
    config.DEFAULT_MODEL = selected["default_model"]

    _save_llm_persistence(
        provider=provider,
        base_url=selected["url"],
        api_key=selected["api_key"] or "",
        default_model=selected["default_model"],
    )

    return {
        "provider": provider,
        "base_url": config.LLM_PROVIDER_BASE_URL,
        "default_model": config.DEFAULT_MODEL,
    }


@router.post("/provider/custom")
def set_custom_provider(body: CustomProviderRequest):
    # Normalize URL: strip trailing slashes, remove accidental /chat/completions suffix
    url = body.base_url.strip().rstrip("/")
    if url.endswith("/chat/completions"):
        url = url[:-len("/chat/completions")].rstrip("/")

    api_key = (body.api_key or "").strip()
    model = body.default_model.strip()

    if not url:
        raise HTTPException(status_code=400, detail="Base URL cannot be empty")
    if not model:
        raise HTTPException(status_code=400, detail="Default model cannot be empty")

    config.CUSTOM_URL = url
    config.CUSTOM_API_KEY = api_key
    config.CUSTOM_DEFAULT_MODEL = model

    config.LLM_PROVIDER_BASE_URL = url
    config.LLM_PROVIDER_API_KEY = api_key
    config.DEFAULT_MODEL = model

    PROVIDERS["custom"] = {
        "url": url,
        "api_key": api_key,
        "default_model": model,
    }

    _save_llm_persistence(
        provider="custom",
        base_url=url,
        api_key=api_key,
        default_model=model,
    )

    return {
        "provider": "custom",
        "base_url": config.LLM_PROVIDER_BASE_URL,
        "default_model": config.DEFAULT_MODEL,
        "api_key_configured": bool(api_key),
    }


@router.post("/provider/test")
async def test_llm_provider(body: TestConnectionRequest):
    url = body.base_url.strip().rstrip("/")
    if url.endswith("/chat/completions"):
        url = url[:-len("/chat/completions")].rstrip("/")

    headers = {"Content-Type": "application/json"}
    if body.api_key:
        headers["Authorization"] = f"Bearer {body.api_key.strip()}"

    # Try pinging models endpoint first (standard for Ollama, vLLM, OpenAI-compatible servers)
    test_endpoints = [
        f"{url}/models",
        f"{url}/v1/models" if not url.endswith("/v1") else f"{url}/models",
        url,
    ]

    last_err = None
    async with httpx.AsyncClient(timeout=4.0) as client:
        for ep in test_endpoints:
            try:
                res = await client.get(ep, headers=headers)
                if res.status_code in (200, 401, 403):
                    # 200 is healthy, 401/403 means reachable host but auth needed
                    msg = "Connection successful"
                    if res.status_code == 401:
                        msg = "Host reached, but API key authentication is required"
                    return {
                        "success": res.status_code == 200,
                        "status_code": res.status_code,
                        "message": msg,
                        "endpoint": ep,
                    }
            except Exception as e:
                last_err = str(e)

    return {
        "success": False,
        "status_code": None,
        "message": f"Connection failed: {last_err or 'Host unreachable'}",
    }


@router.post("/chat")
async def chat_completion_gateway(
    body: ChatRequest,
):
    return await chat_completion(body)



@router.get("/usage")
def get_usage_route():
    return get_usage()



@router.patch("/usage")
def patch_usage_route(body:PatchUsageRequest):
    return patch_usage(
        prompt_tokens=body.prompt_tokens,
        completion_tokens=body.completion_tokens
    )



@router.get("/usage/sync")
def sync_global_usage():
    return sync_usage()


@router.get("/limit")
def get_llm_lmits():
    return get_limit()