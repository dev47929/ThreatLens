# attack/data_burning/router.py

import json

from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import StreamingResponse
from attack.data_burning.execute import save_data_burn
from attack.store import add_attack, get_attack

from attack.ddos import DDoSAttack
from schema.data_burning import DataBurningConfig


router = APIRouter(
    prefix="/attack/data-burning",
    tags=["Data Burning Attack"],
)



# ------------------------------------------------------------
# Start Data Burning Attack
# ------------------------------------------------------------

@router.post("")
async def start_data_burning(
    config: DataBurningConfig,
    background_tasks: BackgroundTasks,
):

    attack = DDoSAttack(
        config.model_dump()
    )

    attack_id = await attack.start()

    add_attack(
        attack_id,
        attack,
        "data_burning",
    )

    background_tasks.add_task(
        save_data_burn,
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
async def get_data_burning_attack(
    attack_id: str,
):

    attack = get_attack(attack_id)
    return attack.get_status()


# ------------------------------------------------------------
# Stop Attack
# ------------------------------------------------------------

@router.post("/{attack_id}/stop")
async def stop_data_burning_attack(
    attack_id: str,
):

    attack = get_attack(attack_id)

    attack.stop()

    return {
        "attack_id": attack_id,
        "status": "stopping",
    }


# ------------------------------------------------------------
# Stream Attack Status
# ------------------------------------------------------------

@router.get("/{attack_id}/stream")
async def stream_data_burning_attack(
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