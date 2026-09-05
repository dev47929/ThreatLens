from schema.llm_chat import ChatRequest , PatchUsageRequest
from config import config, PROVIDERS
from typing import Literal
from fastapi import APIRouter, Query, HTTPException
from service.llm_gateway_service import chat_completion 
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


@router.get("/provider")
def get_provider():
    current_provider = None

    for name, provider in PROVIDERS.items():
        if (
            config.LLM_PROVIDER_BASE_URL == provider["url"]
            and config.LLM_PROVIDER_API_KEY == provider["api_key"]
        ):
            current_provider = name
            break

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
                "configured": bool(provider["api_key"]),
            }
            for name, provider in PROVIDERS.items()
        },
    }


@router.patch("/provider")
def set_provider(
    provider: Literal["openrouter", "groq"] = Query("openrouter"),
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

    if not selected["api_key"]:
        raise HTTPException(
            status_code=400,
            detail=f"{provider} API key is not configured",
        )

    config.LLM_PROVIDER_BASE_URL = selected["url"]
    config.LLM_PROVIDER_API_KEY = selected["api_key"]
    config.DEFAULT_MODEL = selected["default_model"]

    return {
        "provider": provider,
        "base_url": config.LLM_PROVIDER_BASE_URL,
        "default_model": config.DEFAULT_MODEL,
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