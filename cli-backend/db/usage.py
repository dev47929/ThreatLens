import httpx
from db import get_db
from service.system_service import global_sync_usage

db = get_db()

def set_usage(
    prompt_tokens: int,
    completion_tokens: int,
):
    
    total_tokens = prompt_tokens + completion_tokens 

    db.execute(
        """
        UPDATE usage
        SET
            prompt_tokens = ?,
            completion_tokens = ?,
            total_tokens = ?,
            updated_at = unixepoch()
        WHERE id = 1
        """,
        (
            prompt_tokens,
            completion_tokens,
            total_tokens,
        ),
    )

    db.commit()


def get_usage():
    cursor = db.execute(
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
    if row is None :
        return None
    return {
        "prompt_tokens":row[0],
        "completion_tokens":row[1],
        "total_tokens":row[2],
        "synced_at":row[3],
        "updated_at":row[4]
    }


def patch_usage(
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int = 0
):

    total_tokens = prompt_tokens + completion_tokens 
    db.execute(
        """
        UPDATE usage
        SET
            prompt_tokens = prompt_tokens + ?,
            completion_tokens = completion_tokens + ?,
            total_tokens = total_tokens + ?,
            updated_at = unixepoch()
        WHERE id = 1
        """,
        (
            prompt_tokens,
            completion_tokens,
            total_tokens,
        ),
    )

    db.commit()


def sync_usage():
    usage = get_usage()

    if usage is None:
        return {
            "status": "unable to sync usage"
        }

    body = {
        "prompt_tokens": usage["prompt_tokens"],
        "completion_tokens": usage["completion_tokens"]
    }

    try:
        response = global_sync_usage(body=body)

        db.execute(
            """
            UPDATE usage
            SET synced_at = unixepoch()
            WHERE id = 1
            """
        )

        db.commit()

        return {
            "status": "usage synced",
            "response": response
        }

    except httpx.HTTPError as e:
        return {
            "status": "unable to sync usage",
            "error": str(e)
        }


def reset_usage():
    row = db.execute(
        """
        SELECT updated_at
        FROM usage
        WHERE id = 1
        """
    ).fetchone()

    if row is None:
        return

    updated_at = row[0]

    if updated_at is not None:
        if db.execute(
            "SELECT unixepoch() - ?",
            (updated_at,)
        ).fetchone()[0] < 86400:
            return

    db.execute(
        """
        UPDATE usage
        SET
            prompt_tokens = 0,
            completion_tokens = 0,
            total_tokens = 0,
            synced_at = unixepoch(),
            updated_at = unixepoch()
        WHERE id = 1
        """
    )

    db.commit()