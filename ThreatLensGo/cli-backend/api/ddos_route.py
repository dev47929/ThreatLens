# attack/ddos/router.py

import json
from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import StreamingResponse

from attack.ddos import DDoSAttack
from attack.ddos.execute import save_ddos
from schema.ddos import DDoSConfig
from attack.store import add_attack, get_attack


router = APIRouter(
    prefix="/attack/ddos",
    tags=["DDoS Attack"],
)

# ------------------------------------------------------------
# Start DDoS Attack
# ------------------------------------------------------------

@router.post("")
async def start_ddos(
    config: DDoSConfig,
    background_tasks: BackgroundTasks,
):

    attack = DDoSAttack(
        config.model_dump()
    )

    attack_id = await attack.start()

    add_attack(
        attack_id,
        attack,
        "ddos"
    )

    background_tasks.add_task(
        save_ddos,
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
async def get_ddos_attack(
    attack_id: str,
):
    attack = get_attack(attack_id)
    return attack.get_status()


# ------------------------------------------------------------
# Stop Attack
# ------------------------------------------------------------

@router.post("/{attack_id}/stop")
async def stop_ddos_attack(
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
async def stream_ddos_attack(
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