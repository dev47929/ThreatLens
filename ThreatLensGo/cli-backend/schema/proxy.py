from pydantic import BaseModel
from typing import Any


class TargetConfig(BaseModel):
    base_url: str
    endpoint: str
    method: str
    path_params: dict[str, Any] | None = None
    query_params: dict[str, Any] | None = None


class RequestConfig(BaseModel):
    headers: dict[str, str] = {}
    auth: Any | None = None
    body: dict[str, Any] | None = None


class AttackConfig(BaseModel):
    requests_per_case: int = 1
    delay: float = 0.2
    timeout: float = 5
    on_failure: str = "continue"


class OriginProxyConfig(BaseModel):
    target: TargetConfig
    request: RequestConfig
    attack: AttackConfig