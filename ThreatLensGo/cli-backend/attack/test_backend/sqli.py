from fastapi import FastAPI
from pydantic import BaseModel
import sqlite3

app = FastAPI(title="SQLi Vulnerable Test API")

DB_NAME = "test.db"


# -----------------------------
# Database
# -----------------------------

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    """)

    # Reset demo data every startup
    conn.execute("DELETE FROM users")

    conn.execute("""
        INSERT INTO users (username, password, role)
        VALUES ('admin', 'supersecret123', 'admin')
    """)

    conn.execute("""
        INSERT INTO users (username, password, role)
        VALUES ('user', 'password123', 'user')
    """)

    conn.commit()
    conn.close()


@app.on_event("startup")
def startup():
    init_db()


# -----------------------------
# Request schema
# -----------------------------

class LoginRequest(BaseModel):
    username: str
    password: str


# -----------------------------
# VULNERABLE LOGIN
# -----------------------------

@app.post("/login")
def login(data: LoginRequest):

    conn = get_db()

    username = data.username
    password = data.password

    # ⚠️ INTENTIONALLY VULNERABLE TO SQL INJECTION
    query = f"""
        SELECT id, username, role
        FROM users
        WHERE username = '{username}'
        AND password = '{password}'
    """

    print("\n[SQL QUERY]")
    print(query)

    try:
        user = conn.execute(query).fetchone()
    except sqlite3.Error as e:
        conn.close()

        return {
            "success": False,
            "error": str(e)
        }

    conn.close()

    if user:
        return {
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "role": user["role"]
            }
        }

    return {
        "success": False,
        "message": "Invalid username or password"
    }