# attack/store.py

import asyncio
from fastapi import HTTPException
from datetime import datetime, timezone


attacks: dict[str, dict] = {}
_subscribers: set[asyncio.Queue] = set()


def add_attack(
    attack_id: str,
    attack,
    attack_type: str,
):
    posted_at = datetime.now(timezone.utc)

    attacks[attack_id] = {
        "attack": attack,
        "attack_type": attack_type,
        "posted_at": posted_at,
    }

    event = {
        "attack_id": attack_id,
        "attack_type": attack_type,
        "posted_at": posted_at.isoformat(),
    }

    for queue in _subscribers:
        queue.put_nowait(event)


def get_attack(attack_id: str):
    attack = attacks.get(attack_id)
    if attack:
        attack = attack["attack"]
    else:
        raise HTTPException(
            status_code=404,
            detail="Attack not found",
        )
    return attack


def get_attack_list(attack_type: str = None):
    filtered = [
        {
            "attack_id": attack_id,
            "attack_type": data["attack_type"],
            "posted_at": data["posted_at"],
            "config": data["attack"].config,
        }
        for attack_id, data in attacks.items()
        if not attack_type or data["attack_type"] == attack_type
    ]

    return sorted(
        filtered,
        key=lambda attack: attack["posted_at"],
        reverse=True,
    )


def subscribe() -> asyncio.Queue:
    queue = asyncio.Queue()
    _subscribers.add(queue)
    return queue


def unsubscribe(queue: asyncio.Queue):
    _subscribers.discard(queue)