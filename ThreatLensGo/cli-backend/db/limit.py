from db import get_db
from service.system_service import get_global_limit


def get_limit():
    db = get_db()

    cursor = db.execute(
        """
        SELECT
            prompt_tokens,
            completion_tokens,
            total_tokens,
            updated_at
        FROM usage
        WHERE id = 2
        """
    )

    return cursor.fetchone()


def set_limit(
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int,
):
    db = get_db()

    db.execute(
        """
        UPDATE usage
        SET
            prompt_tokens = ?,
            completion_tokens = ?,
            total_tokens = ?,
            updated_at = unixepoch()
        WHERE id = 2
        """,
        (
            prompt_tokens,
            completion_tokens,
            total_tokens,
        ),
    )

    db.commit()


def sync_limit():
    data = get_global_limit()

    set_limit(
        prompt_tokens=data["prompt_tokens"],
        completion_tokens=data["completion_tokens"],
        total_tokens=data["total_tokens"],
    )