# db/init.py

from .connection import get_db


AUTH_TABLE = """
CREATE TABLE IF NOT EXISTS auth (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    jwt_token TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
"""


USAGE_TABLE = """
CREATE TABLE  IF NOT EXISTS usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    synced_at INTEGER NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
"""


def init_tables():
    conn = get_db()

    try:
        conn.execute(AUTH_TABLE)
        conn.execute(USAGE_TABLE)
        conn.commit()
    finally:
        conn.close()


def init_db():
    init_tables()