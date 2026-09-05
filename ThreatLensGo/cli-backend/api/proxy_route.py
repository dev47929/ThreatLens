import json

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from attack.store import add_attack, get_attack

from attack.proxy import (
    OriginProxyAttack,
    CASES_FILE,
    save_origin_proxy,
)
from schema.proxy import OriginProxyConfig


# ------------------------------------------------------------
# Case status schema
# ------------------------------------------------------------

class OriginProxyCaseStatus(BaseModel):
    case: str
    enabled: bool


# ------------------------------------------------------------
# Router
# ------------------------------------------------------------

router = APIRouter(
    prefix="/attack/origin-proxy",
    tags=["Origin & Proxy Attack"],
)




# ------------------------------------------------------------
# Get Origin & Proxy Test Cases
# ------------------------------------------------------------

@router.get("/cases")
async def get_origin_proxy_cases():

    try:

        with open(
            CASES_FILE,
            "r",
            encoding="utf-8",
        ) as file:

            cases = json.load(file)

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to load Origin & Proxy cases: "
                f"{exc}"
            ),
        )

    return cases


# ------------------------------------------------------------
# Enable / Disable Multiple Test Cases
# ------------------------------------------------------------

@router.patch("/cases")
async def update_origin_proxy_cases(
    data: list[OriginProxyCaseStatus],
):

    try:

        with open(
            CASES_FILE,
            "r",
            encoding="utf-8",
        ) as file:

            cases = json.load(file)

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to load Origin & Proxy cases: "
                f"{exc}"
            ),
        )

    # --------------------------------------------------------
    # Validate every case before modifying anything
    # --------------------------------------------------------

    for item in data:

        if item.case not in cases:

            raise HTTPException(
                status_code=404,
                detail=(
                    "Origin & Proxy test case "
                    f"'{item.case}' not found"
                ),
            )

    # --------------------------------------------------------
    # Apply changes
    # --------------------------------------------------------

    for item in data:

        cases[item.case]["enabled"] = item.enabled

    # --------------------------------------------------------
    # Save cases
    # --------------------------------------------------------

    try:

        with open(
            CASES_FILE,
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                cases,
                file,
                indent=2,
            )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to save Origin & Proxy cases: "
                f"{exc}"
            ),
        )

    return {
        "updated": [
            {
                "case": item.case,
                "enabled": item.enabled,
            }
            for item in data
        ]
    }

# ------------------------------------------------------------
# Start Origin & Proxy Attack
# ------------------------------------------------------------

@router.post("")
async def start_origin_proxy(
    config: OriginProxyConfig,
    background_tasks: BackgroundTasks,
):

    attack = OriginProxyAttack(
        config.model_dump()
    )

    attack_id = await attack.start()

    add_attack(
        attack_id,
        attack,
       "origin_proxy",
    )

    background_tasks.add_task(
        save_origin_proxy,
        attack_id,
        attack,
        config,
    )

    return {
        "attack_id": attack_id,
        "status": "started",
    }


# ------------------------------------------------------------
# Get Attack Status
# ------------------------------------------------------------

@router.get("/{attack_id}")
async def get_origin_proxy_attack(
    attack_id: str,
):
    attack = get_attack(attack_id)
    return attack.get_status()


# ------------------------------------------------------------
# Stop Attack
# ------------------------------------------------------------

@router.post("/{attack_id}/stop")
async def stop_origin_proxy_attack(
    attack_id: str,
):
    attack = get_attack(attack_id)
    await attack.stop()

    return {
        "attack_id": attack_id,
        "status": "stopping",
    }


# ------------------------------------------------------------
# Stream Attack Status
# ------------------------------------------------------------

@router.get("/{attack_id}/stream")
async def stream_origin_proxy_attack(
    attack_id: str,
):
    attack = get_attack(attack_id)
    async def event_generator():

        async for status in attack.stream(
            interval=1.0
        ):

            yield (
                f"data: "
                f"{json.dumps(status)}"
                f"\n\n"
            )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

