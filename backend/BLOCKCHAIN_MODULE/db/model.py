from sqlalchemy import (
    BigInteger,
    CHAR,
    Column,
    DateTime,
    String,
    func,
)

from tc_auth.db import Base


class EthereumAnchor(Base):
    __tablename__ = "ethereum_anchors"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    account_id = Column(
        BigInteger,
        nullable=False,
    )

    anchor_id = Column(
        BigInteger,
        nullable=False,
    )

    chain_id = Column(
        String(255),
        nullable=False,
    )

    chain_height = Column(
        BigInteger,
        nullable=False,
    )

    chain_hash = Column(
        CHAR(64),
        nullable=False,
    )

    wallet_address = Column(
        CHAR(42),
        nullable=False,
    )

    transaction_hash = Column(
        CHAR(66),
        nullable=False,
    )

    block_no = Column(
        BigInteger,
        nullable=False,
    )

    integrity_status = Column(
        String(30),
        nullable=False,
        default="verified",
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )