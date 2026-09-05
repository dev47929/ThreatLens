from typing import Any

from pydantic import BaseModel, Field


class DataBurningTarget(BaseModel):
    base_url: str
    endpoint: str
    method: str

    path_params: dict[str, Any] | None = None
    query_params: dict[str, Any] | None = None


class DataBurningRequest(BaseModel):
    headers: dict[str, str] | None = None
    auth: Any | None = None
    body: Any | None = None


class DataBurningAttackConfig(BaseModel):
    duration: float | None = Field(
        default=None,
        gt=0,
    )

    requests: int | None = Field(
        default=None,
        gt=0,
    )

    concurrency: int = Field(
        default=10,
        gt=0,
    )

    delay: float = Field(
        default=0,
        ge=0,
    )

    timeout: float = Field(
        default=10,
        gt=0,
    )

    retries: int = Field(
        default=0,
        ge=0,
    )

    on_failure: str = "continue"


class DataBurningConfig(BaseModel):
    target: DataBurningTarget
    request: DataBurningRequest
    attack: DataBurningAttackConfig