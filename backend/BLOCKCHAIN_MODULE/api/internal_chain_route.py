from BLOCKCHAIN_MODULE.service.builder_service import build_chain
from BLOCKCHAIN_MODULE.service.chain_service import InternalChain
from BLOCKCHAIN_MODULE.schema import (
    ChainRequest,
    ChainData,
)

from fastapi import APIRouter, Depends, Query
from typing import Literal

from connect import auth


router = APIRouter(
    prefix="/chain",
    tags=["Internal Chain"],
)


@router.post("/build")
def setup_chain(
    config: ChainRequest,
    user: dict = Depends(auth.deps.get_current),
):
    chain: InternalChain = build_chain(
        config=config.model_dump(),
        user=user,
    )

    return {
        "chain_id": chain.chain_id,
    }


@router.get("")
def get_chains(
    user: dict = Depends(auth.deps.get_current),
):
    return {
        "chains": InternalChain.get_chains(user),
    }


@router.post("/validate")
def validate_chain(
    chain_data: ChainData,
):
    chain = [
        block.model_dump()
        for block in chain_data.root
    ]

    InternalChain.validate_chain_data(chain)

    return {
        "status": True,
        "message": "Chain validation successful",
    }


@router.get("/{chain_id}")
def get_chain(
    chain_id: str,
    page: int = Query(1, ge=1, le=100),
    limit: int = Query(10, ge=1, le=100),
    user: dict = Depends(auth.deps.get_current),
):
    chain: InternalChain = InternalChain(
        chain_name=chain_id,
        user=user,
    )

    return chain.load_chain(
        page=page,
        limit=limit,
    )

@router.get("/{chain_id}/latest")
def get_latest_block(
    chain_id: str,
    user: dict = Depends(auth.deps.get_current),
):
    chain : InternalChain = InternalChain(
        chain_name=chain_id,
        user=user,
    )

    return chain.get_latest_block()


@router.get("/{chain_id}/verify")
def verify_chain(
    chain_id: str,
    target: int = Query(10),
    mode: Literal[
        "single",
        "from",
        "till",
        "latest",
        "full",
        "last",
    ] = Query("last"),
    user: dict = Depends(auth.deps.get_current),
):
    chain: InternalChain = InternalChain(
        chain_name=chain_id,
        user=user,
    )

    return chain.verify_chain(
        target=target,
        mode=mode,
    )


@router.post("/{chain_id}/replace")
def validate_and_replace_chain(
    chain_id: str,
    chain_data: ChainData,
    user: dict = Depends(auth.deps.get_current),
):
    chain: InternalChain = InternalChain(
        chain_name=chain_id,
        user=user,
    )

    new_chain = [
        block.model_dump()
        for block in chain_data.root
    ]

    result = chain.replace_chain(new_chain)

    chain.commit()

    return result


@router.delete("/{chain_id}")
def remove_chain(
    chain_id: str,
    user: dict = Depends(auth.deps.get_current),
):
    return InternalChain.destroy_chain(
        chain_id=chain_id,
        user=user,
    )