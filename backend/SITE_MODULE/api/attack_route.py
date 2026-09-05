from connect import auth
from fastapi import APIRouter, Depends
from SITE_MODULE.schema.attack import AttackCreate

from SITE_MODULE.service.attack_service import (
    post_attack,
    get_attack
)


router = APIRouter(
    prefix="/attack",
    tags=["Attack"],
)


@router.post("")
def post_attack_route(
    attack: AttackCreate,
    user: dict = Depends(auth.deps.get_current),
):
    return post_attack(
        user=user,
        **attack.model_dump(),
    )


@router.get("")
def get_attack_route(
    attack_type: str = None,
    page: int = 1,
    limit: int = 10,
    user: dict = Depends(auth.deps.get_current),
):
    account_id = user["account"]["id"]

    return get_attack(
        account_id=account_id,
        attack_type=attack_type,
        page=page,
        limit=limit,
    )
