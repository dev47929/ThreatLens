from config import config
import httpx
from db import get_jwt

header={
    "Authorization": f"Bearer {get_jwt()}",
}

def chk_state():
    response = httpx.get(
        f"{config.AUTH_BASE_URL}/me",
        headers=header
    )
    return response.json()



def global_sync_usage(body):
    response = httpx.put(
        f"{config.BASE_URL}/usage",
        json=body,
        headers=header
    )
    response.raise_for_status()
    return response.json()


def get_global_limit():
    response = httpx.put(
        f"{config.BASE_URL}/usage",
        headers=header
    )
    response.raise_for_status()

    data = response.json()

    tier = config.PLAN[data["plan"]]
    prompt_tokens = tier * 1_000_000

    return {
        "prompt_tokens": prompt_tokens,
        "completion_tokens": prompt_tokens * 4,
        "total_tokens": prompt_tokens * 4,
    }