from datetime import datetime

from utils.get_helper import to_dict, to_list_dict

from SITE_MODULE.db.models import ChatHistory, Chat
from connect import session_factory


def save_chat_history(
    messages: list[dict],
    chat_id: int,
):
    db = session_factory()

    try:
        history = [
            ChatHistory(
                message=message,
                chat_id=chat_id,
            )
            for message in messages
        ]

        db.add_all(history)
        db.commit()

        return {
            "chat_id": chat_id,
            "saved": len(history),
        }

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


def get_chat_history(
    chat_id: int,
    page: int = 1,
    limit: int = 10,
):
    db = session_factory()

    try:
        offset = (page - 1) * limit

        history = (
            db.query(ChatHistory)
            .filter(
                ChatHistory.chat_id == chat_id,
            )
            .order_by(
                ChatHistory.id.desc()
            )
            .offset(offset)
            .limit(limit)
            .all()
        )

        return to_list_dict(history)

    finally:
        db.close()


def create_chat(
    account_id: int,
    title: str | None = None,
    model: str | None = None,
):
    db = session_factory()

    try:
        now = datetime.utcnow()

        chat = Chat(
            account_id=account_id,
            title=title,
            model=model,
            created_at=now,
            updated_at=now,
        )

        db.add(chat)
        db.commit()
        db.refresh(chat)

        return to_dict(chat)

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


def delete_chat(
    account_id: int,
    chat_id: int,
):
    db = session_factory()

    try:
        chat = (
            db.query(Chat)
            .filter(
                Chat.account_id == account_id,
                Chat.id == chat_id,
            )
            .first()
        )

        if not chat:
            return False

        db.query(ChatHistory).filter(
            ChatHistory.chat_id == chat_id,
        ).delete(
            synchronize_session=False
        )

        db.delete(chat)
        db.commit()

        return True

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


def get_chats(
    account_id: int,
):
    db = session_factory()

    try:
        return to_list_dict(
            db.query(Chat)
            .filter(
                Chat.account_id == account_id,
            )
            .order_by(
                Chat.id.desc()
            )
            .all()
        )

    finally:
        db.close()