# attack/sqli/router.py

import json

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from attack.sqli import SQLInjectionAttack, CASES_FILE, save_sqli
from schema.sqli import SQLiConfig
from attack.store import add_attack, get_attack


router = APIRouter(
    prefix="/attack/sqli",
    tags=["SQL Injection Attack"],
)



# ------------------------------------------------------------
# Case Enable / Disable Schema
# ------------------------------------------------------------

class SQLiCaseStatus(BaseModel):
    case: str
    enabled: bool


# ------------------------------------------------------------
# View SQLi Test Cases
# ------------------------------------------------------------

@router.get("/cases")
async def get_sqli_cases():

    try:
        with open(
            CASES_FILE,
            "r",
            encoding="utf-8",
        ) as file:
            return json.load(file)

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Unable to load SQLi cases: {exc}",
        )


# ------------------------------------------------------------
# Enable / Disable SQLi Test Case
# ------------------------------------------------------------

@router.patch("/cases")
async def update_sqli_cases(
    data: list[SQLiCaseStatus],
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
            detail=f"Unable to load SQLi cases: {exc}",
        )

    # Validate all cases before modifying anything
    for item in data:

        if item.case not in cases:

            raise HTTPException(
                status_code=404,
                detail=f"SQLi test case '{item.case}' not found",
            )

    # Apply all changes
    for item in data:

        cases[item.case]["enabled"] = item.enabled

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
            detail=f"Unable to save SQLi cases: {exc}",
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
# Start SQLi Attack
# ------------------------------------------------------------

@router.post("")
async def start_sqli(
    config: SQLiConfig,
    background_tasks: BackgroundTasks,
):

    attack = SQLInjectionAttack(
        config.model_dump()
    )

    attack_id = await attack.start()

    add_attack(
        attack_id,
        attack,
        "sqli",
    )

    background_tasks.add_task(
        save_sqli,
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
async def get_sqli_attack(
    attack_id: str,
):
    attack = get_attack(attack_id)
    return attack.get_status()


# ------------------------------------------------------------
# Stop Attack
# ------------------------------------------------------------

@router.post("/{attack_id}/stop")
async def stop_sqli_attack(
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
async def stream_sqli_attack(
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