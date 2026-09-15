from connect import auth
from fastapi import APIRouter, Depends , Query
from SITE_MODULE.schema.usage import UsageUpdateRequest
from typing import Literal

from SITE_MODULE.service.usage_service import (
    set_usage,
    get_usage,
    set_plan,
)


router = APIRouter(
    prefix="/usage",
    tags=["Usage"],
)


@router.get("")
def get_account_usage(
    user=Depends(auth.deps.get_current_user),
):
    account_id = user["account"]["id"]
    return get_usage(
        account_id=account_id,
    )

@router.put("")
def update_account_usage(
    body: UsageUpdateRequest,
    user=Depends(auth.deps.get_current_user),
):
    account_id = user["account"]["id"]

    return set_usage(
        account_id=account_id,
        prompt_tokens=body.prompt_tokens,
        completion_tokens=body.completion_tokens,
        plan=body.plan,
    )


@router.patch("")
def update_plan(
    plan: Literal["free", "pro", "proplus", "proplus1", "proplus2"] = Query(...),
    user=Depends(auth.deps.get_current_user),
):
    account_id = user["account"]["id"]

    return set_plan(
        account_id=account_id,
        plan=plan,
    )