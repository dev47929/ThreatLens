from .connection import get_db

def save_jwt(token: str):
    conn = get_db()

    try:
        conn.execute("""
            INSERT INTO auth (id, jwt_token)
            VALUES (1, ?)
            ON CONFLICT(id) DO UPDATE SET
                jwt_token = excluded.jwt_token,
                updated_at = unixepoch()
        """, (token,))

        conn.commit()
    finally:
        conn.close()


def get_jwt():
    conn = get_db()

    try:
        row = conn.execute(
            "SELECT jwt_token FROM auth LIMIT 1"
        ).fetchone()

        # return row[0] if row else None
        return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhaWQiOjEsInNpZCI6OTAsInRva2VuIjoiMDh6S3pnNk1oWFF4d3BJc25ZYzFlRlRQYkdvY2t2VzVaNTJaZnBUSk9kRWRZTDI4a1NoZWh6SzVkaGFRNVBUUiIsInR5cGUiOiJhY2Nlc3MiLCJleHAiOjE3OTAwNjI0Nzh9.PJoYVbK3YKeNXPGJuXARY1hHxeA1lUnNA_YF3TwRIsg"
    finally:
        conn.close()


def delete_jwt():
    conn = get_db()

    try:
        conn.execute("DELETE FROM auth")
        conn.commit()
    finally:
        conn.close()