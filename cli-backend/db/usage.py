import httpx
from .connection import get_db
from service.system_service import global_sync_usage


def set_usage(
    prompt_tokens: int,
    completion_tokens: int,
):
    total_tokens = prompt_tokens + completion_tokens
    conn = get_db()
    try:
        conn.execute(
            """
            INSERT INTO usage (id, prompt_tokens, completion_tokens, total_tokens, updated_at)
            VALUES (1, ?, ?, ?, unixepoch())
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


def get_usage():
    conn = get_db()
    try:
        cursor = conn.execute(
            """
            SELECT
                prompt_tokens,
                completion_tokens,
                total_tokens,
                synced_at,
                updated_at
            FROM usage
            WHERE id = 1
            """
        )
        row = cursor.fetchone()
        if row is None:
            return {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0,
                "synced_at": None,
                "updated_at": None,
            }
        return {
            "prompt_tokens": row[0] or 0,
            "completion_tokens": row[1] or 0,
            "total_tokens": row[2] or 0,
            "synced_at": row[3],
            "updated_at": row[4],
        }
    finally:
        conn.close()


def patch_usage(
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int = 0,
):
    added_total = total_tokens if total_tokens > 0 else (prompt_tokens + completion_tokens)
    conn = get_db()
    try:
        conn.execute(
            """
            INSERT INTO usage (id, prompt_tokens, completion_tokens, total_tokens, updated_at)
            VALUES (1, ?, ?, ?, unixepoch())
            ON CONFLICT(id) DO UPDATE SET
                prompt_tokens = usage.prompt_tokens + excluded.prompt_tokens,
                completion_tokens = usage.completion_tokens + excluded.completion_tokens,
                total_tokens = usage.total_tokens + excluded.total_tokens,
                updated_at = unixepoch()
            """,
            (
                prompt_tokens,
                completion_tokens,
                added_total,
            ),
        )
        conn.commit()
    finally:
        conn.close()

    return get_usage()


def sync_usage():
    usage = get_usage()

    if usage is None:
        return {
            "status": "unable to sync usage",
            "error": "No usage record found",
        }

    body = {
        "prompt_tokens": usage["prompt_tokens"],
        "completion_tokens": usage["completion_tokens"],
    }

    try:
        response = global_sync_usage(body=body)

        conn = get_db()
        try:
            conn.execute(
                """
                UPDATE usage
                SET synced_at = unixepoch()
                WHERE id = 1
                """
            )
            conn.commit()
        finally:
            conn.close()

        return {
            "status": "usage synced",
            "response": response,
        }

    except httpx.HTTPError as e:
        return {
            "status": "unable to sync usage",
            "error": str(e),
        }
    except Exception as e:
        return {
            "status": "unable to sync usage",
            "error": str(e),
        }


def reset_usage():
    conn = get_db()
    try:
        row = conn.execute(
            """
            SELECT updated_at
            FROM usage
            WHERE id = 1
            """
        ).fetchone()

        if row is not None and row[0] is not None:
            time_diff = conn.execute(
                "SELECT unixepoch() - ?",
                (row[0],)
            ).fetchone()[0]
            if time_diff < 86400:
                return

        conn.execute(
            """
            INSERT INTO usage (id, prompt_tokens, completion_tokens, total_tokens, synced_at, updated_at)
            VALUES (1, 0, 0, 0, unixepoch(), unixepoch())
            ON CONFLICT(id) DO UPDATE SET
                prompt_tokens = 0,
                completion_tokens = 0,
                total_tokens = 0,
                synced_at = unixepoch(),
                updated_at = unixepoch()
            """
        )
        conn.commit()
    finally:
        conn.close()