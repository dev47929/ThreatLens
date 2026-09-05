from typing import Any

from pydantic import BaseModel, Field


class XSSTarget(BaseModel):
    base_url: str
    endpoint: str
    method: str = "POST"
    query_params: dict[str, Any] = Field(default_factory=dict)
    path_params: dict[str, Any] = Field(default_factory=dict)


class XSSRequest(BaseModel):
    headers: dict[str, str] = Field(default_factory=dict)
    body: dict[str, Any] = Field(default_factory=dict)
    auth: Any | None = None


class XSSAttack(BaseModel):
    requests_per_case: int = Field(default=1, ge=1)
    delay: float = Field(default=0, ge=0)
    timeout: float = Field(default=5, gt=0)
    on_failure: str = "continue"


class XSSConfig(BaseModel):
    target: XSSTarget
    request: XSSRequest
    attack: XSSAttack

class XSSCaseStatus(BaseModel):
    case: str
    enabled: bool