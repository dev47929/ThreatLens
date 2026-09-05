from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn


app = FastAPI(
    title="ThreadLens Origin Proxy Test Backend",
)


# ------------------------------------------------------------
# Intentionally permissive CORS configuration
# ------------------------------------------------------------

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
        "X-Real-IP",
        "Via",
    ],
)


# ------------------------------------------------------------
# Single test endpoint
# ------------------------------------------------------------

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
async def test_endpoint(
    request: Request,
):

    headers = request.headers

    # --------------------------------------------------------
    # Collect forwarding / proxy headers
    # --------------------------------------------------------

    proxy_headers = {
        "forwarded": headers.get("forwarded"),
        "x_forwarded_for": headers.get(
            "x-forwarded-for"
        ),
        "x_forwarded_host": headers.get(
            "x-forwarded-host"
        ),
        "x_forwarded_port": headers.get(
            "x-forwarded-port"
        ),
        "x_forwarded_proto": headers.get(
            "x-forwarded-proto"
        ),
        "x_forwarded_prefix": headers.get(
            "x-forwarded-prefix"
        ),
        "x_real_ip": headers.get(
            "x-real-ip"
        ),
        "x_original_host": headers.get(
            "x-original-host"
        ),
        "x_original_url": headers.get(
            "x-original-url"
        ),
        "via": headers.get(
            "via"
        ),
        "true_client_ip": headers.get(
            "true-client-ip"
        ),
        "x_client_ip": headers.get(
            "x-client-ip"
        ),
    }

    # --------------------------------------------------------
    # CORS request metadata
    # --------------------------------------------------------

    cors_request = {
        "origin": headers.get("origin"),
        "access_control_request_method": headers.get(
            "access-control-request-method"
        ),
        "access_control_request_headers": headers.get(
            "access-control-request-headers"
        ),
    }

    # --------------------------------------------------------
    # Request metadata
    # --------------------------------------------------------

    request_metadata = {
        "method": request.method,
        "url": str(request.url),
        "path": request.url.path,
        "query": dict(request.query_params),
        "scheme": request.url.scheme,
        "host": request.headers.get("host"),
        "http_version": request.scope.get(
            "http_version"
        ),
        "client": {
            "host": (
                request.client.host
                if request.client
                else None
            ),
            "port": (
                request.client.port
                if request.client
                else None
            ),
        },
        "server": {
            "host": (
                request.scope.get("server")[0]
                if request.scope.get("server")
                else None
            ),
            "port": (
                request.scope.get("server")[1]
                if request.scope.get("server")
                else None
            ),
        },
    }

    # --------------------------------------------------------
    # Selected request headers
    # --------------------------------------------------------

    request_headers = {
        "user-agent": headers.get("user-agent"),
        "referer": headers.get("referer"),
        "accept": headers.get("accept"),
        "accept-language": headers.get(
            "accept-language"
        ),
        "accept-encoding": headers.get(
            "accept-encoding"
        ),
        "content-type": headers.get(
            "content-type"
        ),
        "cookie": headers.get("cookie"),
    }

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return JSONResponse(
        {
            "message": "Origin/Proxy test endpoint",
            "request": request_metadata,
            "headers": request_headers,
            "origin": cors_request,
            "proxy": proxy_headers,
        }
    )


# ------------------------------------------------------------
# Run
# ------------------------------------------------------------

if __name__ == "__main__":

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
    )