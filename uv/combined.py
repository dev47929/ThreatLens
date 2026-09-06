"""
==============================================================================
ThreadLens - Unified Attack Test Backend Server
==============================================================================
Consolidates vulnerable & mock test targets for ALL attacks present in
cli-backend/attack/:
  1. Origin & Proxy Interception (proxy)      -> /test
  2. SQL Injection (sqli)                     -> /login, /tc-auth/login/password, /api/auth/login
  3. Cross-Site Scripting (xss)               -> /xss/reflected, /xss/stored, /api/feed/search
  4. Distributed Denial of Service (ddos)     -> /tc-auth/config/pulse, /pulse, /health
  5. Data Burning & Resource Drain (data_burn)-> /tc-auth/login/password, /data-burning/burn

Reference implementations:
  - proxy.py: CORS middleware, proxy headers extraction, request reflection
  - sqli.py: SQLite DB, users table, raw string query interpolation
  - xss.py: SQLite DB, comments table, unescaped HTML reflections
==============================================================================
"""

import os
import sys
import time
import sqlite3
from contextlib import asynccontextmanager
from typing import Any, Optional

from fastapi import FastAPI, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, ConfigDict, Field
import uvicorn

DB_NAME = os.getenv("TEST_DB_NAME", "combined_test.db")


# ============================================================================
# Database Setup & Initialization (combining sqli.py and xss.py)
# ============================================================================

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()

    # Users table for SQL Injection testing (from sqli.py)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    """)

    # Comments table for Stored XSS testing (from xss.py)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            comment TEXT NOT NULL
        )
    """)

    # Reset demo users table on startup
    conn.execute("DELETE FROM users")
    conn.execute("""
        INSERT INTO users (username, password, role)
        VALUES ('admin', 'supersecret123', 'admin')
    """)
    conn.execute("""
        INSERT INTO users (username, password, role)
        VALUES ('user', 'password123', 'user')
    """)

    # Seed comments if empty
    existing = conn.execute("SELECT count(*) as cnt FROM comments").fetchone()
    if existing["cnt"] == 0:
        conn.execute("""
            INSERT INTO comments (username, comment)
            VALUES ('admin', 'Welcome to ThreatLens Test Backend!')
        """)

    conn.commit()
    conn.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


# ============================================================================
# Application Initialization & CORS Configuration
# ============================================================================

app = FastAPI(
    title="ThreadLens Combined Attack Test Backend",
    description="Unified vulnerable test server for proxy, sqli, xss, ddos, and data_burning attacks",
    version="1.0.0",
    lifespan=lifespan,
)

# Intentionally permissive CORS configuration (from proxy.py)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "X-Request-ID",
        "X-Forwarded-For",
        "X-Forwarded-Host",
        "X-Forwarded-Proto",
        "X-Forwarded-Prefix",
        "X-Forwarded-Port",
        "X-Real-IP",
        "Via",
        "X-Client-IP",
        "True-Client-IP",
    ],
)


# ============================================================================
# Telemetry Middleware / Tracker
# ============================================================================

request_stats = {
    "total_requests": 0,
    "started_at": time.time(),
    "by_method": {},
    "by_endpoint": {},
    "by_attack_type": {
        "proxy": 0,
        "sqli": 0,
        "xss": 0,
        "ddos": 0,
        "data_burning": 0,
        "other": 0,
    },
}


@app.middleware("http")
async def track_telemetry(request: Request, call_next):
    request_stats["total_requests"] += 1

    method = request.method
    request_stats["by_method"][method] = request_stats["by_method"].get(method, 0) + 1

    path = request.url.path
    request_stats["by_endpoint"][path] = request_stats["by_endpoint"].get(path, 0) + 1

    if path.startswith("/test"):
        request_stats["by_attack_type"]["proxy"] += 1
    elif path in ("/login", "/api/auth/login"):
        request_stats["by_attack_type"]["sqli"] += 1
    elif path.startswith("/xss") or path.startswith("/api/feed"):
        request_stats["by_attack_type"]["xss"] += 1
    elif path in ("/tc-auth/config/pulse", "/pulse"):
        request_stats["by_attack_type"]["ddos"] += 1
    elif path.startswith("/data-burning") or path == "/tc-auth/login/password":
        request_stats["by_attack_type"]["data_burning"] += 1
    else:
        request_stats["by_attack_type"]["other"] += 1

    response = await call_next(request)
    return response


# ============================================================================
# Pydantic Schemas
# ============================================================================

class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    username: Optional[str] = None
    email: Optional[str] = None
    identifier: Optional[str] = None
    password: Optional[str] = None


class CommentRequest(BaseModel):
    username: str
    comment: str


class DataBurnRequest(BaseModel):
    size_kb: int = Field(default=10, ge=1, le=10240)
    iterations: int = Field(default=10, ge=1, le=1000)


# ============================================================================
# 1. ORIGIN & PROXY INTERCEPTION ATTACK ENDPOINT (/test)
# Matches proxy.py reference
# ============================================================================

@app.api_route(
    "/test",
    methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
)
async def proxy_test_endpoint(request: Request):
    headers = request.headers

    # Collect forwarding / proxy headers
    proxy_headers = {
        "forwarded": headers.get("forwarded"),
        "x_forwarded_for": headers.get("x-forwarded-for"),
        "x_forwarded_host": headers.get("x-forwarded-host"),
        "x_forwarded_port": headers.get("x-forwarded-port"),
        "x_forwarded_proto": headers.get("x-forwarded-proto"),
        "x_forwarded_prefix": headers.get("x-forwarded-prefix"),
        "x_real_ip": headers.get("x-real-ip"),
        "x_original_host": headers.get("x-original-host"),
        "x_original_url": headers.get("x-original-url"),
        "via": headers.get("via"),
        "true_client_ip": headers.get("true-client-ip"),
        "x_client_ip": headers.get("x-client-ip"),
    }

    # CORS request metadata
    cors_request = {
        "origin": headers.get("origin"),
        "access_control_request_method": headers.get("access-control-request-method"),
        "access_control_request_headers": headers.get("access-control-request-headers"),
    }

    # Request metadata
    request_metadata = {
        "method": request.method,
        "url": str(request.url),
        "path": request.url.path,
        "query": dict(request.query_params),
        "scheme": request.url.scheme,
        "host": request.headers.get("host"),
        "http_version": request.scope.get("http_version"),
        "client": {
            "host": request.client.host if request.client else None,
            "port": request.client.port if request.client else None,
        },
        "server": {
            "host": request.scope.get("server")[0] if request.scope.get("server") else None,
            "port": request.scope.get("server")[1] if request.scope.get("server") else None,
        },
    }

    # Selected request headers
    request_headers = {
        "user-agent": headers.get("user-agent"),
        "referer": headers.get("referer"),
        "accept": headers.get("accept"),
        "accept-language": headers.get("accept-language"),
        "accept-encoding": headers.get("accept-encoding"),
        "content-type": headers.get("content-type"),
        "cookie": headers.get("cookie"),
    }

    return JSONResponse(
        {
            "message": "Origin/Proxy test endpoint",
            "attack_type": "proxy",
            "request": request_metadata,
            "headers": request_headers,
            "origin": cors_request,
            "proxy": proxy_headers,
        }
    )


# ============================================================================
# 2. SQL INJECTION (SQLi) ATTACK ENDPOINTS (/login, /tc-auth/login/password)
# Matches sqli.py reference
# ============================================================================

def execute_vulnerable_login(username: str, password: str) -> dict[str, Any]:
    conn = get_db()

    # Intentionally vulnerable to SQL injection (single line allows inline comments)
    query = f"SELECT id, username, role FROM users WHERE username = '{username}' AND password = '{password}'"

    print(f"[SQL QUERY EXECUTED]: {query.strip()}")

    try:
        user = conn.execute(query).fetchone()
    except sqlite3.Error as e:
        conn.close()
        return {
            "success": False,
            "error": str(e),
            "vulnerability": "SQL Injection Detected (Database Syntax/Execution Error)",
        }

    conn.close()

    if user:
        return {
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "role": user["role"],
            },
        }

    return {
        "success": False,
        "message": "Invalid username or password",
    }


@app.post("/login")
def login(data: LoginRequest):
    user_key = data.username or data.email or data.identifier or ""
    pwd = data.password or ""
    return execute_vulnerable_login(user_key, pwd)


@app.post("/api/auth/login")
def api_auth_login(data: LoginRequest):
    user_key = data.username or data.email or data.identifier or ""
    pwd = data.password or ""
    return execute_vulnerable_login(user_key, pwd)


# ============================================================================
# 3. CROSS-SITE SCRIPTING (XSS) ATTACK ENDPOINTS
# Matches xss.py reference (Reflected & Stored)
# ============================================================================

@app.get(
    "/xss/reflected",
    response_class=HTMLResponse,
)
async def reflected_xss(q: str = ""):
    # Intentionally unescaped HTML reflection
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


@app.get(
    "/api/feed/search",
    response_class=HTMLResponse,
)
async def api_feed_search(q: str = ""):
    """Alternative reflected XSS endpoint for feed search probes."""
    return await reflected_xss(q)


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
    for row in comments:
        # Intentionally unescaped stored comment
        rendered_comments += f"""
        <div class="comment">
            <strong>{row['username']}</strong>
            <p>{row['comment']}</p>
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
    request: Request,
    username: Optional[str] = Form(None),
    comment: Optional[str] = Form(None),
):
    # Support both Form urlencoded and JSON body
    if username is None or comment is None:
        try:
            body = await request.json()
            username = username or body.get("username", "anonymous")
            comment = comment or body.get("comment", "")
        except Exception:
            username = username or "anonymous"
            comment = comment or ""

    db = get_db()
    db.execute(
        """
        INSERT INTO comments (username, comment)
        VALUES (?, ?)
        """,
        (username, comment),
    )
    db.commit()
    db.close()

    return await stored_xss_page()


# ============================================================================
# 4. DISTRIBUTED DENIAL OF SERVICE (DDoS) ATTACK ENDPOINTS
# High-concurrency pulse endpoints matching ddos/execute.py & docs
# ============================================================================

@app.get("/tc-auth/config/pulse")
@app.post("/tc-auth/config/pulse")
async def ddos_pulse_endpoint():
    """DDoS target endpoint configured in attack/ddos/execute.py."""
    return {
        "status": "healthy",
        "service": "pulse",
        "active": True,
        "timestamp": time.time(),
        "total_requests_received": request_stats["total_requests"],
    }


@app.get("/pulse")
async def pulse_endpoint():
    return await ddos_pulse_endpoint()


@app.get("/health")
async def health_endpoint():
    return {
        "status": "healthy",
        "service": "ThreatLens Combined Attack Test Backend",
        "uptime_seconds": round(time.time() - request_stats["started_at"], 2),
    }


# ============================================================================
# 5. DATA BURNING & RESOURCE EXFILTRATION ATTACK ENDPOINTS
# Stateful resource drain & auth endpoints matching attack/data_burning/execute.py
# ============================================================================

@app.post("/tc-auth/login/password")
def data_burning_login(data: LoginRequest):
    """
    Stateful data burning endpoint configured in attack/data_burning/execute.py.
    Also dual-functions as a vulnerable SQLi target for payload tests.
    """
    user_key = data.email or data.username or data.identifier or ""
    pwd = data.password or ""

    # Perform SQL check with vulnerability preservation
    result = execute_vulnerable_login(user_key, pwd)

    # Attach data burning payload metrics
    result["data_burning"] = {
        "processed": True,
        "simulated_token_size_bytes": 512,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_data_burning_token",
    }
    return result


@app.post("/data-burning/burn")
def data_burning_drain(payload: DataBurnRequest):
    """Generates data payload to simulate resource exfiltration/consumption."""
    dummy_data = "X" * (payload.size_kb * 1024)
    return {
        "status": "burned",
        "size_kb": payload.size_kb,
        "iterations": payload.iterations,
        "sample_data": dummy_data[:128] + "...[truncated]",
    }


# ============================================================================
# Manifest & Diagnostics
# ============================================================================

@app.get("/")
async def root():
    return {
        "name": "ThreatLens Combined Attack Test Backend",
        "status": "running",
        "version": "1.0.0",
        "supported_attacks": [
            "proxy",
            "sqli",
            "xss",
            "ddos",
            "data_burning",
        ],
        "endpoints": {
            "proxy": {
                "path": "/test",
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                "description": "Origin & proxy header introspection with permissive CORS",
            },
            "sqli": {
                "paths": ["/login", "/api/auth/login", "/tc-auth/login/password"],
                "method": "POST",
                "description": "Vulnerable login querying SQLite users table",
            },
            "xss": {
                "reflected": "/xss/reflected?q=test (also /api/feed/search)",
                "stored": "/xss/stored (GET & POST)",
                "description": "Unescaped HTML reflections and comments database",
            },
            "ddos": {
                "paths": ["/tc-auth/config/pulse", "/pulse", "/health"],
                "methods": ["GET", "POST"],
                "description": "High-throughput status endpoints for volumetric flood testing",
            },
            "data_burning": {
                "paths": ["/tc-auth/login/password", "/data-burning/burn"],
                "methods": ["POST"],
                "description": "Heavy stateful endpoints for bandwidth and compute consumption",
            },
        },
    }


@app.get("/stats")
async def get_stats():
    return {
        "uptime_seconds": round(time.time() - request_stats["started_at"], 2),
        "statistics": request_stats,
    }


# ============================================================================
# Pytest & Verification Tests
# Can be run via `pytest combined.py` or `python combined.py --test`
# ============================================================================

def test_manifest_and_health():
    from starlette.testclient import TestClient
    client = TestClient(app)
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert "supported_attacks" in data
    assert "proxy" in data["supported_attacks"]
    assert "sqli" in data["supported_attacks"]
    assert "xss" in data["supported_attacks"]
    assert "ddos" in data["supported_attacks"]
    assert "data_burning" in data["supported_attacks"]


def test_proxy_attack_endpoint():
    from starlette.testclient import TestClient
    client = TestClient(app)
    headers = {
        "X-Forwarded-For": "198.51.100.25",
        "X-Forwarded-Host": "attacker.internal",
        "Origin": "https://evil.com",
    }
    res = client.get("/test", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["attack_type"] == "proxy"
    assert body["proxy"]["x_forwarded_for"] == "198.51.100.25"
    assert body["proxy"]["x_forwarded_host"] == "attacker.internal"
    assert body["origin"]["origin"] == "https://evil.com"


def test_sqli_attack_endpoint():
    from starlette.testclient import TestClient
    init_db()
    client = TestClient(app)

    # 1. Normal valid login
    res = client.post("/login", json={"username": "admin", "password": "supersecret123"})
    assert res.status_code == 200
    assert res.json()["success"] is True

    # 2. SQL injection boolean-based bypass: ' OR '1'='1' -- 
    bypass_res = client.post("/login", json={"username": "' OR '1'='1' -- ", "password": "wrong"})
    assert bypass_res.status_code == 200
    assert bypass_res.json()["success"] is True
    assert bypass_res.json()["user"]["username"] == "admin"

    # 3. SQL injection syntax error probe: ' UNION SELECT
    err_res = client.post("/login", json={"username": "' UNION SELECT", "password": "x"})
    assert err_res.status_code == 200
    assert err_res.json()["success"] is False
    assert "error" in err_res.json()


def test_xss_attack_endpoints():
    from starlette.testclient import TestClient
    init_db()
    client = TestClient(app)

    # 1. Reflected XSS
    payload = "<script>alert('XSS')</script>"
    res = client.get(f"/xss/reflected?q={payload}")
    assert res.status_code == 200
    assert payload in res.text

    # 2. Stored XSS
    stored_payload = "<img src=x onerror=alert('STORED')>"
    post_res = client.post("/xss/stored", data={"username": "hacker", "comment": stored_payload})
    assert post_res.status_code == 200
    assert stored_payload in post_res.text


def test_ddos_attack_endpoint():
    from starlette.testclient import TestClient
    client = TestClient(app)
    res = client.get("/tc-auth/config/pulse")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"
    assert res.json()["service"] == "pulse"


def test_data_burning_attack_endpoint():
    from starlette.testclient import TestClient
    init_db()
    client = TestClient(app)

    # Test login consumption endpoint
    res = client.post("/tc-auth/login/password", json={"email": "test@example.com", "password": "test"})
    assert res.status_code == 200
    assert "data_burning" in res.json()

    # Test payload drain endpoint
    burn_res = client.post("/data-burning/burn", json={"size_kb": 2, "iterations": 5})
    assert burn_res.status_code == 200
    assert burn_res.json()["size_kb"] == 2


# ============================================================================
# Runner
# ============================================================================

def run(host: str = "127.0.0.1", port: int = 8001):
    uvicorn.run(
        app,
        host=host,
        port=port,
    )


if __name__ == "__main__":
    if "--test" in sys.argv:
        print("[*] Running embedded self-test suite for all 5 attacks...")
        test_manifest_and_health()
        print("  ✓ Manifest and health endpoint passed")
        test_proxy_attack_endpoint()
        print("  ✓ Origin & Proxy test passed")
        test_sqli_attack_endpoint()
        print("  ✓ SQL Injection (bypass & error-based) passed")
        test_xss_attack_endpoints()
        print("  ✓ Cross-Site Scripting (Reflected & Stored) passed")
        test_ddos_attack_endpoint()
        print("  ✓ DDoS pulse endpoint passed")
        test_data_burning_attack_endpoint()
        print("  ✓ Data Burning endpoint passed")
        print("\n[SUCCESS] All 5 attack test modules verified successfully!")
    else:
        run()