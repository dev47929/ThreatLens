from connect import auth
from fastapi import APIRouter, Depends, Query
from typing import Literal
from SITE_MODULE.service.chat_service import (
    save_chat_history,
    get_chat_history,
    create_chat,
    delete_chat,
    get_chats,
)

from SITE_MODULE.schema.chat import (
    SaveChatHistoryRequest,
    SaveChatHistoryResponse,
    CreateChatRequest,
    DeleteChatResponse,
)


router = APIRouter(
    prefix="/chats",
    tags=["Chats"],
)


@router.post(
    "/history",
    response_model=SaveChatHistoryResponse,
)
def save_history(
    body: SaveChatHistoryRequest,
):
    history = save_chat_history(
        messages=[
            message.model_dump(exclude_none=True)
            for message in body.messages
        ],
        chat_id=body.chat_id,
    )

    return {
        "chat_id": body.chat_id,
        "saved": len(history),
    }


@router.get(
    "/{chat_id}/history",
)
def get_history(
    chat_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    format: Literal["default", "message", "table"] = Query("default"),
):
    history = get_chat_history(
        chat_id=chat_id,
        page=page,
        limit=limit,
    )

    if format == "message":
        return [item["message"] for item in history]

    if format == "table":
        history

    return {
        "page": page,
        "limit": limit,
        "data": history,
    }

# data will be list of dicts with keys: role, content, tool_calls, tool_call_id
# class ChatMessage(BaseModel):
#     role: str
#     content: Any = None
#     tool_calls: list[dict] | None = None
#     tool_call_id: str | None = None


@router.post(
    "",
)
def create_new_chat(
    body: CreateChatRequest,
    account: int = Depends(auth.deps.get_current),
):
    chat = create_chat(
        account_id=account["account"]["id"],
        title=body.title,
        model=body.model,
    )

    return chat


@router.get("")
def get_all_chats(
    account: int = Depends(auth.deps.get_current),
):
    return get_chats(
        account_id=account["account"]["id"],
    )


@router.delete(
    "/{chat_id}",
    response_model=DeleteChatResponse,
)
def remove_chat(
    chat_id: int,
    account: int = Depends(auth.deps.get_current),
):
    deleted = delete_chat(
        account_id=account["account"]["id"],
        chat_id=chat_id,
    )

    return {
        "success": deleted,
    }