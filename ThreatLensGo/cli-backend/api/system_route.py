import asyncio
import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from service.system_service import chk_state
from attack.store import (
    get_attack_list,
    subscribe,
    unsubscribe,
)

router = APIRouter(tags=["system"])


@router.get("/pulse")
def heartbeat():
    return {
        "status": "Live",
        "connect": True,
    }


@router.get("/me")
def get_me():
    return chk_state()


@router.get("/attack")
async def get_attack(
    attack_type: str = None,
    stream: bool = False,
    polling: bool = False,
    interval: int = 2,
):
    if not stream:
        return get_attack_list(attack_type)

    if interval < 1:
        interval = 1

    if polling:

        async def polling_stream():
            while True:
                attacks = get_attack_list(attack_type)

                yield (
                    f"event: attack_list\n"
                    f"data: {json.dumps(attacks, default=str)}\n\n"
                )

                await asyncio.sleep(interval)

        return StreamingResponse(
            polling_stream(),
            media_type="text/event-stream",
        )

    queue = subscribe()

    async def event_stream():
        try:
            while True:
                event = await queue.get()

                if attack_type and event["attack_type"] != attack_type:
                    continue

                yield (
                    f"event: attack_created\n"
                    f"data: {json.dumps(event)}\n\n"
                )

        finally:
            unsubscribe(queue)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
    )