from fastapi import FastAPI, Form
from fastapi.responses import HTMLResponse
import sqlite3


app = FastAPI(
    title="ThreadLens XSS Test Backend"
)

DB = "xss_test.db"


# ------------------------------------------------------------
# Database
# ------------------------------------------------------------

def get_db():
    return sqlite3.connect(DB)


def init_db():

    db = get_db()

    db.execute("""
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            comment TEXT NOT NULL
        )
    """)

    db.commit()
    db.close()


init_db()


# ------------------------------------------------------------
# Reflected XSS
# ------------------------------------------------------------

@app.get(
    "/xss/reflected",
    response_class=HTMLResponse,
)
async def reflected_xss(
    q: str = "",
):

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Reflected XSS Test</title>
    </head>

    <body>

        <h1>Search</h1>

        <form method="get">
            <input
                name="q"
                value="{q}"
            />

            <button type="submit">
                Search
            </button>
        </form>

        <hr>

        <h2>Results</h2>

        <div>
            Search results for:
            {q}
        </div>

    </body>
    </html>
    """


# ------------------------------------------------------------
# Stored XSS
# ------------------------------------------------------------

@app.get(
    "/xss/stored",
    response_class=HTMLResponse,
)
async def stored_xss_page():

    db = get_db()

    comments = db.execute("""
        SELECT username, comment
        FROM comments
        ORDER BY id DESC
    """).fetchall()

    db.close()

    rendered_comments = ""

    for username, comment in comments:

        rendered_comments += f"""
        <div class="comment">

            <strong>
                {username}
            </strong>

            <p>
                {comment}
            </p>

        </div>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Stored XSS Test</title>
    </head>

    <body>

        <h1>Comments</h1>

        <form method="post" action="/xss/stored">

            <input
                name="username"
                placeholder="Username"
            />

            <br><br>

            <textarea
                name="comment"
                placeholder="Comment"
            ></textarea>

            <br><br>

            <button type="submit">
                Submit
            </button>

        </form>

        <hr>

        <h2>Comments</h2>

        {rendered_comments}

    </body>
    </html>
    """


@app.post(
    "/xss/stored",
    response_class=HTMLResponse,
)
async def create_comment(
    username: str = Form(...),
    comment: str = Form(...),
):

    db = get_db()

    db.execute(
        """
        INSERT INTO comments (
            username,
            comment
        )
        VALUES (?, ?)
        """,
        (
            username,
            comment,
        ),
    )

    db.commit()
    db.close()

    return await stored_xss_page()


# ------------------------------------------------------------
# Health Check
# ------------------------------------------------------------

@app.get("/")
async def root():

    return {
        "name": "ThreadLens XSS Test Backend",
        "status": "running",
        "endpoints": {
            "reflected": "/xss/reflected?q=hello",
            "stored": "/xss/stored",
        },
    }


# ------------------------------------------------------------
# Run
# ------------------------------------------------------------

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
    )