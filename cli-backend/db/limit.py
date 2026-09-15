from .connection import get_db
from service.system_service import get_global_limit


def get_limit():
    conn = get_db()
    try:
        cursor = conn.execute(
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
        row = cursor.fetchone()
        if row is None:
            return None
        return {
            "prompt_tokens": row[0],
            "completion_tokens": row[1],
            "total_tokens": row[2],
            "updated_at": row[3],
        }
    finally:
        conn.close()


def set_limit(
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int,
):
    conn = get_db()
    try:
        conn.execute(
            """
            INSERT INTO usage (id, prompt_tokens, completion_tokens, total_tokens, updated_at)
            VALUES (2, ?, ?, ?, unixepoch())
            ON CONFLICT(id) DO UPDATE SET
                prompt_tokens = excluded.prompt_tokens,
                completion_tokens = excluded.completion_tokens,
                total_tokens = excluded.total_tokens,
                updated_at = unixepoch()
            """,
            (
                prompt_tokens,
                completion_tokens,
                total_tokens,
            ),
        )
        conn.commit()
    finally:
        conn.close()


def sync_limit():
    data = get_global_limit()

    set_limit(
        prompt_tokens=data["prompt_tokens"],
        completion_tokens=data["completion_tokens"],
        total_tokens=data["total_tokens"],
    )
    return get_limit()