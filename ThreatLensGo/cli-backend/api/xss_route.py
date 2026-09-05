import json

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse

from attack.xss import XSSAttack, CASES_FILE, save_xss
from schema.xss import XSSConfig, XSSCaseStatus
from attack.store import add_attack, get_attack



router = APIRouter(
    prefix="/attack/xss",
    tags=["XSS Attack"],
)


# ------------------------------------------------------------
# Get XSS Test Cases
# ------------------------------------------------------------

@router.get("/cases")
async def get_xss_cases():

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
            detail=f"Unable to load XSS cases: {exc}",
        )

    return cases


# ------------------------------------------------------------
# Enable / Disable Multiple XSS Test Cases
# ------------------------------------------------------------

@router.patch("/cases")
async def update_xss_cases(
    data: list[XSSCaseStatus],
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
            detail=f"Unable to load XSS cases: {exc}",
        )

    # Validate all cases before modifying anything
    for item in data:

        if item.case not in cases:

            raise HTTPException(
                status_code=404,
                detail=f"XSS test case '{item.case}' not found",
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
            detail=f"Unable to save XSS cases: {exc}",
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
# Start XSS Attack
# ------------------------------------------------------------

@router.post("")
async def start_xss(
    config: XSSConfig,
    background_tasks: BackgroundTasks,
):



    attack = XSSAttack(
        config.model_dump()
    )

    attack_id = await attack.start()

    add_attack(
        attack_id,
        attack,
        "xss",
    )



    background_tasks.add_task(
        save_xss,
        attack_id,
        attack,
        config,
    )

    return {
        "attack_id": attack_id,
        "status": "started",
    }


# ------------------------------------------------------------
# Get XSS Attack Status
# ------------------------------------------------------------

@router.get("/{attack_id}")
async def get_xss_attack(
    attack_id: str,
):
    attack = get_attack(attack_id)
    return attack.get_status()


# ------------------------------------------------------------
# Stop XSS Attack
# ------------------------------------------------------------

@router.post("/{attack_id}/stop")
async def stop_xss_attack(
    attack_id: str,
):
    attack = get_attack(attack_id)
    attack.stop()

    return {
        "attack_id": attack_id,
        "status": "stopping",
    }


# ------------------------------------------------------------
# Stream XSS Attack Status
# ------------------------------------------------------------

@router.get("/{attack_id}/stream")
async def stream_xss_attack(
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