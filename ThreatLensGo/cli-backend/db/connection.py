# db/connection.py

import sqlite3
from config import config


def get_db():
    conn = sqlite3.connect(
        config.DB_PATH,
        timeout=config.SQLITE_TIMEOUT,
    )

    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    conn.execute("PRAGMA busy_timeout=30000;")

    return conn