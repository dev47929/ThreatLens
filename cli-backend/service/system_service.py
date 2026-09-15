from config import config
import httpx
from db.authorization import get_jwt


def get_header():
    jwt = get_jwt()
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if jwt:
        headers["Authorization"] = f"Bearer {jwt}"
    return headers


def chk_state():
    try:
        response = httpx.get(
            f"{config.AUTH_BASE_URL}/me",
            headers=get_header(),
            timeout=10.0,
        )
        return response.json()
    except Exception as e:
        return {
            "status": "failed",
            "error": str(e),
        }


def global_sync_usage(body: dict):
    response = httpx.put(
        f"{config.BASE_URL}/usage",
        json=body,
        headers=get_header(),
        timeout=10.0,
    )
    response.raise_for_status()
    return response.json()


def get_global_limit():
    response = httpx.get(
        f"{config.BASE_URL}/usage",
        headers=get_header(),
        timeout=10.0,
    )
    response.raise_for_status()

    data = response.json()
    plan_name = (data.get("plan") or "free").lower()
    tier = config.PLAN.get(plan_name, 1)
    prompt_tokens = tier * 1_000_000

    return {
        "plan": plan_name,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": prompt_tokens * 4,
        "total_tokens": prompt_tokens * 5,
    }