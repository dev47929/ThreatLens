import httpx 
from config import config
from db import get_jwt

async def plot(attack):
    plt = {
        "timeline": []
    }

    async for status in attack.stream(interval=1):

        progress = status.get("progress", {})
        requests = status.get("requests", {})
        performance = status.get("performance", {})

        plt["timeline"].append({
            "time": status.get("elapsed_seconds") or 0,
            "attempted": progress.get("attempted_requests") or 0,
            "active": progress.get("active_requests") or 0,
            "successful": requests.get("successful") or 0,
            "failed": requests.get("failed") or 0,
            "timeouts": requests.get("timeouts") or 0,
            "retried": requests.get("retried") or 0,
            "rps": performance.get("requests_per_second") or 0,
            "latency": {
                "average": performance.get("average_latency_ms") or 0,
                "p50": performance.get("p50_latency_ms") or 0,
                "p95": performance.get("p95_latency_ms") or 0,
                "p99": performance.get("p99_latency_ms") or 0,
            }
        })

        if status.get("status") in {
            "completed",
            "failed",
            "stopped",
        }:
            break

    return plt


def save_attack(
    attack_id: str,
    attack_type: str,
    request: dict,
    status: dict,
    plot: dict | None,
    jwt: str = None,
):
    data = {
        "attack_id": attack_id,
        "attack_type": attack_type,
        "request": request,
        "status": status,
        "plot": plot,
    }

    if jwt is None:
        jwt = get_jwt()

    headers = {
        "Authorization": f"Bearer {jwt}",
    }

    response = httpx.post(
        f"{config.BASE_URL}/attack",
        json=data,
        headers=headers,
    )

    response.raise_for_status()
    return response.json()
