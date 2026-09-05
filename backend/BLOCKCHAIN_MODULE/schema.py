from pydantic import BaseModel, RootModel


class RepoRequest(BaseModel):
    repo_id: int


class CommitRequest(BaseModel):
    repo_id: int
    limit: int


class AttackRequest(BaseModel):
    type: str
    limit: int


class CustomRequest(BaseModel):
    type: str
    data: dict


class ChainRequest(BaseModel):
    chain_id: str
    usage: bool = False
    repos: list[RepoRequest] = []
    commits: list[CommitRequest] = []
    attacks: list[AttackRequest] = []
    custom: list[CustomRequest] = []


class Block(BaseModel):
    index: int
    type: str
    data: dict
    created_at: str
    prev: str | None
    current: str


class ChainData(RootModel[list[Block]]):
    pass


from pydantic import BaseModel


class CreateEthereumAnchorRequest(BaseModel):
    account_id: int
    anchor_id: int
    chain_id: str
    chain_height: int
    chain_hash: str
    wallet_address: str
    transaction_hash: str
    block_no: int


class UpdateIntegrityStatusRequest(BaseModel):
    integrity_status: str