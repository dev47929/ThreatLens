import httpx
from config import config


def _request(
    method: str,
    path: str,
    *,
    params: dict | None = None,
    json: dict | None = None,
):
    response = httpx.request(
        method=method,
        url=f"{config.BASE_URL}{path}",
        params=params,
        json=json,
    )

    response.raise_for_status()

    return response.json()


def get_latest_chat_message(
    chat_id: int,
) -> dict | None:

    result = _request(
        "GET",
        f"/chats/{chat_id}/history",
        params={
            "page": 1,
            "limit": 1,
        },
    )

    data = result.get("data", [])

    return data[0] if data else None


def build_chat_history(
    latest_message: dict | None,
    messages: list[dict],
) -> list[dict]:

    if latest_message is None:
        return messages

    latest = latest_message["message"]

    for index in range(len(messages) - 1, -1, -1):
        message = messages[index]

        if (
            message.get("role") == latest.get("role")
            and message.get("content") == latest.get("content")
        ):
            return messages[index + 1:]

    return messages


def insert_chat_history(
    chat_id: int,
    messages: list[dict],
):
    return _request(
        "POST",
        "/chats/history",
        json={
            "chat_id": chat_id,
            "messages": messages,
        },
    )


def save_chat_history(
    chat_id: int,
    messages: list[dict],
):
    latest_message = get_latest_chat_message(
        chat_id=chat_id,
    )

    new_messages = build_chat_history(
        latest_message=latest_message,
        messages=messages,
    )

    if not new_messages:
        return {
            "chat_id": chat_id,
            "saved": 0,
        }

    return insert_chat_history(
        chat_id=chat_id,
        messages=new_messages,
    )


def get_history(
    chat_id: int,
    page: int = 1,
    limit: int = 10,
    format: str = "default",
):
    return _request(
        "GET",
        f"/chats/{chat_id}/history",
        params={
            "page": page,
            "limit": limit,
            "format": format,
        },
    )