from typing import Literal

from fastapi import APIRouter, Query

from BLOCKCHAIN_MODULE.schema import (
    CreateEthereumAnchorRequest,
    UpdateIntegrityStatusRequest,
)

from BLOCKCHAIN_MODULE.service.eth_service import (
    create_ethereum_anchor,
    get_ethereum_anchors,
    update_integrity_status,
)


router = APIRouter(
    prefix="/eth",
    tags=["Ethereum Anchors"],
)


@router.post("")
def create_anchor(
    data: CreateEthereumAnchorRequest,
):
    return create_ethereum_anchor(
        account_id=data.account_id,
        anchor_id=data.anchor_id,
        chain_id=data.chain_id,
        chain_height=data.chain_height,
        chain_hash=data.chain_hash,
        wallet_address=data.wallet_address,
        transaction_hash=data.transaction_hash,
        block_no=data.block_no,
    )


@router.get("")
def get_anchors(
    value: int | str = Query(...),
    field: Literal[
        "account_id",
        "anchor_id",
        "chain_id",
    ] = Query(...),
):
    return get_ethereum_anchors(
        value=value,
        field=field,
    )


@router.patch("/{anchor_id}/integrity")
def update_anchor_integrity(
    anchor_id: int,
    data: UpdateIntegrityStatusRequest,
):
    return update_integrity_status(
        anchor_id=anchor_id,
        integrity_status=data.integrity_status,
    )