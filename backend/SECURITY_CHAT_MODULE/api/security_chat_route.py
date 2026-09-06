from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List

from SECURITY_CHAT_MODULE.service.api_key_service import (
    create_api_key,
    validate_api_key,
    get_client_streaming_key,
    list_api_keys,
)
from SECURITY_CHAT_MODULE.service.security_chat_service import (
    stream_security_chat,
)


class ChatMessage(BaseModel):
    role: str
    content: str


class SecurityChatRequest(BaseModel):
    message: str = Field(..., description="The security question or prompt")
    history: Optional[List[ChatMessage]] = Field(
        default_factory=list, description="Prior conversation context"
    )
    api_key: Optional[str] = Field(
        None, description="Streaming API key (can also be passed in X-API-Key header)"
    )


class CreateKeyRequest(BaseModel):
    name: str = Field("custom-client", description="Key label / description")
    scopes: Optional[List[str]] = Field(
        default=["stream:chat"], description="Authorized scopes"
    )


router = APIRouter(
    prefix="/security-chat",
    tags=["ThreatLens Security AI Chat"],
)


@router.post("/stream", summary="Stream Security AI Responses (SSE)")
async def stream_chat_endpoint(
    request: SecurityChatRequest,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    authorization: Optional[str] = Header(None),
):
    """
    Streams tokens in real-time for cybersecurity queries.
    Authenticates using the streaming API key from header, Bearer token, or request body.
    """
    # Extract API key candidate
    token = request.api_key or x_api_key
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ", 1)[1].strip()

    # Validate the streaming API key
    # If no key is supplied, auto-fallback to the client streaming key so the web widget works seamlessly
    if not token:
        token = get_client_streaming_key()

    if not validate_api_key(token):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired Streaming API Key. Please obtain a valid key via POST /security-chat/api-key",
        )

    # Convert history models to dicts
    history_dicts = (
        [{"role": m.role, "content": m.content} for m in request.history]
        if request.history
        else []
    )

    return StreamingResponse(
        stream_security_chat(
            message=request.message,
            history=history_dicts,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.post("/api-key", summary="Create Streaming API Key from Scratch")
async def create_key_endpoint(body: CreateKeyRequest):
    """Creates a new cryptographically secure streaming API key from scratch."""
    result = create_api_key(name=body.name, scopes=body.scopes)
    return {
        "success": True,
        "message": "Streaming API key generated successfully",
        "data": result,
    }


@router.get("/api-key/token", summary="Get Active Client Streaming Key")
async def get_client_token_endpoint():
    """Returns the default client streaming key for web frontend integration."""
    key = get_client_streaming_key()
    return {
        "api_key": key,
        "status": "active",
        "scope": "stream:chat",
    }


@router.get("/api-key/verify", summary="Verify API Key Validity")
async def verify_key_endpoint(
    api_key: Optional[str] = Query(None),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
):
    """Checks if a given streaming API key is valid."""
    candidate = api_key or x_api_key
    is_valid = validate_api_key(candidate)
    return {
        "valid": is_valid,
        "key_provided": bool(candidate),
    }


@router.get("/api-key/list", summary="List Registered Streaming API Keys")
async def list_keys_endpoint():
    """Lists registered API key metadata with masked secrets."""
    keys = list_api_keys()
    return {
        "count": len(keys),
        "keys": keys,
    }


@router.get("/health", summary="Security Chatbot Health Check")
async def health_check():
    """Health check for security chatbot and active provider state."""
    from SECURITY_CHAT_MODULE.service.security_chat_service import _get_providers
    providers = _get_providers()
    return {
        "status": "healthy",
        "service": "ThreatLens Security Chatbot",
        "streaming_supported": True,
        "active_providers": [p["name"] for p in providers],
    }
