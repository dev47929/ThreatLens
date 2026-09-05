from fastapi import APIRouter, Query
from typing import Literal

from db.usage import sync_usage
from schema.llm_chat import (
    CreateChatRequest,
    ChatHistoryRequest,
)

from service.chat_session_service import (
    create_chat,
    get_chats,
    delete_chat,
)

from service.llm_chat_service import (
    save_chat_history,
    get_history,
)


router = APIRouter(
    prefix="/chats",
    tags=["Chats"],
)


@router.post("")
def create_new_chat(
    data: CreateChatRequest,
):
    return create_chat(
        title=data.title,
        model=data.model,
    )


@router.get("")
def get_all_chats():
    return get_chats()


@router.delete("/{chat_id}")
def remove_chat(
    chat_id: int,
):
    return delete_chat(chat_id)


@router.post("/history")
def save_history(
    data: ChatHistoryRequest,
):
    try :
        sync_usage()
    except :
        pass
    return save_chat_history(
        chat_id=data.chat_id,
        messages=data.messages,
    )


@router.get("/{chat_id}/history")
def get_chat_history(
    chat_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    format: Literal["default", "message", "table"] = Query("default"),
):
    return get_history(
        chat_id=chat_id,
        page=page,
        limit=limit,
        format=format,
    )