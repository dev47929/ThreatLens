import httpx
from config import config
from db import get_jwt


jwt = get_jwt()

headers = {
    "Authorization": f"Bearer {jwt}",
}


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
        headers=headers,
    )

    response.raise_for_status()

    return response.json()


def get_chats():
    response = httpx.get(
        f"{config.BASE_URL}/chats",
        headers=headers,
    )

    response.raise_for_status()

    return response.json()


def delete_chat(chat_id: int):
    response = httpx.delete(
        f"{config.BASE_URL}/chats/{chat_id}",
        headers=headers,
    )

    response.raise_for_status()

    return response.json()