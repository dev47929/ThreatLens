import httpx
from config import config
from db import get_jwt


def get_headers() -> dict:
    jwt = get_jwt()
    if jwt:
        return {"Authorization": f"Bearer {jwt}"}
    return {}


def create_chat(
    title: str | None = None,
    model: str | None = None,
):
    payload = {}

    if title is not None:
        payload["title"] = title

    if model is not None:
        payload["model"] = model

    response = httpx.post(
        f"{config.BASE_URL}/chats",
        json=payload,
        headers=get_headers(),
    )

    response.raise_for_status()

    return response.json()


def get_chats():
    response = httpx.get(
        f"{config.BASE_URL}/chats",
        headers=get_headers(),
    )

    response.raise_for_status()

    return response.json()


def delete_chat(chat_id: int):
    response = httpx.delete(
        f"{config.BASE_URL}/chats/{chat_id}",
        headers=get_headers(),
    )

    response.raise_for_status()

    return response.json()