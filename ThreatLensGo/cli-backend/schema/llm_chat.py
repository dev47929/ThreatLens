from typing import Any
from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str
    content: Any = None
    tool_calls: list[dict] | None = None
    tool_call_id: str | None = None


class ChatRequest(BaseModel):
    model: str | None = None
    messages: list[ChatMessage]
    tools: list[dict] | None = None
    temperature: float | None = 0.2
    max_tokens: int | None 
    stream: bool = True


class CreateChatRequest(BaseModel):
    title: str | None = None
    model: str | None = None


class ChatHistoryRequest(BaseModel):
    chat_id: int
    messages: list[dict]

class PatchUsageRequest(BaseModel):
    prompt_tokens: int
    completion_tokens: int

