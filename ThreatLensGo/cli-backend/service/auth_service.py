import httpx 
from fastapi.exceptions import HTTPException
from config import config
from db import save_jwt


def password_login(identifier: str, password: str) -> dict:
    response = httpx.post(
        f"{config.AUTH_BASE_URL}/login/password",
        json={
            "identifier": identifier,
            "password": password,
        }
    )

    response.raise_for_status()

    data = response.json()
    access_token = data.get("access_token")

    if not access_token:
        raise HTTPException(
            detail="login failed",
            status_code=400,
        )

    save_jwt(access_token)

    return {"status": "logged in"}


def oauth_callback(access_token: str):
    if not access_token:
        raise HTTPException(detail="unable to verify account", status_code=400)
    save_jwt(access_token)
    return {"status": "logged in"}

