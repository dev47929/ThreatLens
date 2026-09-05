from connect import session_factory

from BLOCKCHAIN_MODULE.db.model import EthereumAnchor
from utils.get_helper import to_dict, to_list_dict


def create_ethereum_anchor(
    account_id: int,
    anchor_id: int,
    chain_id: str,
    chain_height: int,
    chain_hash: str,
    wallet_address: str,
    transaction_hash: str,
    block_no: int,
):
    db = session_factory()

    try:
        anchor = EthereumAnchor(
            account_id=account_id,
            anchor_id=anchor_id,
            chain_id=chain_id,
            chain_height=chain_height,
            chain_hash=chain_hash,
            wallet_address=wallet_address,
            transaction_hash=transaction_hash,
            block_no=block_no,
        )

        db.add(anchor)
        db.commit()
        db.refresh(anchor)

        return to_dict(anchor)

    finally:
        db.close()


def get_ethereum_anchors(
    value,
    field: str,
):
    db = session_factory()

    try:
        allowed_fields = {
            "account_id": EthereumAnchor.account_id,
            "anchor_id": EthereumAnchor.anchor_id,
            "chain_id": EthereumAnchor.chain_id,
        }

        column = allowed_fields.get(field)

        if column is None:
            raise ValueError(
                "field must be one of: account_id, anchor_id, chain_id"
            )

        anchors = (
            db.query(EthereumAnchor)
            .filter(column == value)
            .order_by(EthereumAnchor.id.desc())
            .all()
        )

        return to_list_dict(anchors)

    finally:
        db.close()


def update_integrity_status(
    anchor_id: int,
    integrity_status: str,
):
    db = session_factory()

    try:
        anchor = (
            db.query(EthereumAnchor)
            .filter(
                EthereumAnchor.anchor_id == anchor_id
            )
            .first()
        )

        if anchor is None:
            return None

        anchor.integrity_status = integrity_status

        db.commit()
        db.refresh(anchor)

        return to_dict(anchor)

    finally:
        db.close()