# ThreadLens LLM Gateway API Usage Guide

## Overview

The ThreadLens CLI backend exposes an OpenAI-compatible LLM gateway under:

```text
/llm
```

The gateway currently supports:

- Groq
- OpenRouter
- Chat completions
- Streaming and non-streaming completions
- Function/tool calling
- Local token usage tracking
- Usage synchronization
- LLM limits
- Runtime provider switching

The gateway uses the currently selected provider configuration internally. Clients do not need to know the provider-specific API URL or API key.

---

# Base URL

For local CLI backend development:

```text
http://localhost:1234
```

Therefore the gateway endpoints are:

```text
GET    http://localhost:1234/llm/provider
PATCH  http://localhost:1234/llm/provider
POST   http://localhost:1234/llm/chat

GET    http://localhost:1234/llm/usage
PATCH  http://localhost:1234/llm/usage
GET    http://localhost:1234/llm/usage/sync

GET    http://localhost:1234/llm/limit
```

---

# Provider Management

## GET /llm/provider

Returns the currently selected provider and the available provider configurations.

### Request

```http
GET /llm/provider
```

No request body is required.

### Response

Example:

```json
{
  "current": {
    "provider": "openrouter",
    "base_url": "https://openrouter.ai/api/v1",
    "default_model": "openrouter/free"
  },
  "available": {
    "groq": {
      "base_url": "https://api.groq.com/openai/v1",
      "default_model": "openai/gpt-oss-20b",
      "configured": true
    },
    "openrouter": {
      "base_url": "https://openrouter.ai/api/v1",
      "default_model": "openrouter/free",
      "configured": true
    }
  }
}
```

### Response fields

#### `current`

| Field | Type | Description |
|---|---|---|
| provider | string \| null | Currently selected provider |
| base_url | string | Provider API base URL |
| default_model | string | Default model used when a chat request does not specify a model |

#### `available`

Contains each configured provider.

| Field | Type | Description |
|---|---|---|
| base_url | string | Provider API base URL |
| default_model | string | Default model for that provider |
| configured | boolean | Whether an API key is configured |

API keys are never returned by this endpoint.

---

# PATCH /llm/provider

Changes the active LLM provider at runtime.

The provider is selected using a query parameter. There is no request body.

## Supported providers

```text
openrouter
groq
```

## Default provider parameter

If `provider` is omitted, the route defaults to:

```text
openrouter
```

### Set OpenRouter

```http
PATCH /llm/provider?provider=openrouter
```

### Set Groq

```http
PATCH /llm/provider?provider=groq
```

### Response

Example:

```json
{
  "provider": "groq",
  "base_url": "https://api.groq.com/openai/v1",
  "default_model": "openai/gpt-oss-20b"
}
```

### Important behavior

Provider switching changes the runtime configuration:

```python
config.LLM_PROVIDER_BASE_URL
config.LLM_PROVIDER_API_KEY
config.DEFAULT_MODEL
```

It does not modify the provider definitions or permanently modify the configuration file.

After the process restarts, the values defined in `Config` are used again.

---

# Chat Completion

## POST /llm/chat

Sends a chat completion request through the currently selected LLM provider.

The gateway uses an OpenAI-compatible chat completion interface.

### Request body

```json
{
  "model": "openai/gpt-oss-20b",
  "messages": [
    {
      "role": "user",
      "content": "What is Redis?"
    }
  ],
  "temperature": 0.2,
  "max_tokens": 300,
  "stream": false
}
```

## ChatRequest

The request model is:

```python
class ChatRequest(BaseModel):
    model: str | None = None
    messages: list[ChatMessage]
    tools: list[dict] | None = None
    temperature: float | None = 0.2
    max_tokens: int | None
    stream: bool = True
```

### Fields

| Field | Type | Required | Default | Description |
|---|---|---:|---|---|
| model | string \| null | No | Provider default | Model identifier |
| messages | array | Yes | — | List of chat message objects |
| tools | array \| null | No | `null` | Function/tool definitions |
| temperature | float \| null | No | `0.2` | Sampling temperature |
| max_tokens | integer \| null | No | `null` | Maximum completion token count |
| stream | boolean | No | `true` | Enables streaming when `true` |

If `model` is omitted, the gateway uses:

```python
config.DEFAULT_MODEL
```

---

# ChatMessage

Each item in `messages` follows:

```python
class ChatMessage(BaseModel):
    role: str
    content: Any = None
    tool_calls: list[dict] | None = None
    tool_call_id: str | None = None
```

### Fields

| Field | Type | Description |
|---|---|---|
| role | string | Message role such as `user`, `assistant`, or `tool` |
| content | any | Message content; may be `null` for tool-call assistant messages |
| tool_calls | array \| null | Tool calls returned by the assistant |
| tool_call_id | string \| null | ID of the tool call associated with a tool result |

---

# Basic Chat Request

```http
POST /llm/chat
Content-Type: application/json
```

```json
{
  "messages": [
    {
      "role": "user",
      "content": "What is FastAPI?"
    }
  ],
  "stream": false
}
```

Because `model` is omitted, the currently configured provider's default model is used.

---

# Explicit Model

```json
{
  "model": "openai/gpt-oss-20b",
  "messages": [
    {
      "role": "user",
      "content": "Explain Redis in two sentences."
    }
  ],
  "temperature": 0.2,
  "max_tokens": 200,
  "stream": false
}
```

The exact model identifier must be supported by the currently selected provider.

---

# Tool Calling

The gateway supports OpenAI-compatible function/tool definitions.

### Request

```json
{
  "model": "openai/gpt-oss-20b",
  "messages": [
    {
      "role": "user",
      "content": "What is the weather in Bhopal?"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get the current weather for a city.",
        "parameters": {
          "type": "object",
          "properties": {
            "city": {
              "type": "string",
              "description": "The city to get weather for."
            }
          },
          "required": [
            "city"
          ]
        }
      }
    }
  ],
  "temperature": 0.2,
  "max_tokens": 300,
  "stream": false
}
```

### Tool-call response

A provider may return an assistant message similar to:

```json
{
  "role": "assistant",
  "content": null,
  "tool_calls": [
    {
      "id": "call_123",
      "type": "function",
      "function": {
        "name": "get_weather",
        "arguments": "{"city":"Bhopal"}"
      }
    }
  ]
}
```

The client/application can execute the requested function and then provide the result as a `tool` message.

### Tool result message

```json
{
  "role": "tool",
  "content": "{"temperature":28,"condition":"Cloudy"}",
  "tool_call_id": "call_123"
}
```

The complete message sequence can then be sent back to `/llm/chat`.

---

# Streaming

The gateway supports Server-Sent Events (SSE) when:

```json
{
  "stream": true
}
```

Example:

```http
POST /llm/chat
Content-Type: application/json
```

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Explain PostgreSQL."
    }
  ],
  "stream": true
}
```

The gateway forwards the provider's SSE stream.

The response content type is:

```text
text/event-stream
```

The gateway also forwards the provider's `[DONE]` event.

---

# Non-Streaming

For a normal JSON response, set:

```json
{
  "stream": false
}
```

Example:

```json
{
  "model": "openai/gpt-oss-20b",
  "messages": [
    {
      "role": "user",
      "content": "What is PostgreSQL?"
    }
  ],
  "stream": false
}
```

The gateway returns the provider's JSON completion response.

---

# Usage

The gateway maintains local token usage.

## GET /llm/usage

Returns the current locally tracked usage.

### Request

```http
GET /llm/usage
```

### Response

The exact response is generated by `get_usage()`.

The usage data tracks:

```text
prompt_tokens
completion_tokens
```

Provider responses may also contain:

```text
total_tokens
```

The gateway uses provider usage data to update local usage.

---

# PATCH /llm/usage

Manually patches local usage.

### Request

```http
PATCH /llm/usage
Content-Type: application/json
```

Body:

```json
{
  "prompt_tokens": 137,
  "completion_tokens": 40
}
```

### Request model

```python
class PatchUsageRequest(BaseModel):
    prompt_tokens: int
    completion_tokens: int
```

### Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| prompt_tokens | integer | Yes | Prompt token count to add/update |
| completion_tokens | integer | Yes | Completion token count to add/update |

The exact update behavior is implemented by `patch_usage()`.

---

# Synchronize Usage

## GET /llm/usage/sync

Synchronizes locally tracked usage with the global service.

### Request

```http
GET /llm/usage/sync
```

The route calls:

```python
sync_usage()
```

The synchronization request sends:

```json
{
  "prompt_tokens": 137,
  "completion_tokens": 40
}
```

The local usage is marked as synchronized after the global usage synchronization succeeds.

The exact response is generated by `sync_usage()`.

---

# LLM Limits

## GET /llm/limit

Returns the current LLM usage/limit information.

### Request

```http
GET /llm/limit
```

The route calls:

```python
get_limit()
```

The exact response structure is generated by the limit service.

---

# Complete Endpoint Reference

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/llm/provider` | Show current and available providers |
| PATCH | `/llm/provider?provider=openrouter` | Select OpenRouter |
| PATCH | `/llm/provider?provider=groq` | Select Groq |
| POST | `/llm/chat` | Create a chat completion |
| GET | `/llm/usage` | Get local token usage |
| PATCH | `/llm/usage` | Patch local token usage |
| GET | `/llm/usage/sync` | Synchronize local usage |
| GET | `/llm/limit` | Get LLM limits |

---

# Recommended Client Flow

A typical client flow is:

```text
1. GET /llm/provider
       |
       v
2. Check current provider
       |
       v
3. Optionally PATCH /llm/provider?provider=...
       |
       v
4. POST /llm/chat
       |
       +---- stream=true ---> SSE response
       |
       +---- stream=false --> JSON response
       |
       v
5. Track usage
       |
       v
6. GET /llm/usage
       |
       v
7. GET /llm/usage/sync
```

For tool calling:

```text
POST /llm/chat
       |
       v
assistant returns tool_calls
       |
       v
client executes tool
       |
       v
client adds tool message
       |
       v
POST /llm/chat with updated messages
       |
       v
final assistant response
```

---

# Provider Configuration

The gateway currently defines two providers:

## Groq

```text
URL:
https://api.groq.com/openai/v1

Default model:
openai/gpt-oss-20b
```

## OpenRouter

```text
URL:
https://openrouter.ai/api/v1

Default model:
openrouter/free
```

Provider API keys are configuration secrets and are not returned by the provider endpoint.

The configuration uses four environment variables:

```env
GROQ_API_KEY=YOUR_GROQ_API_KEY
GROQ_DEFAULT_MODEL=openai/gpt-oss-20b

OPEN_ROUTER_API_KEY=YOUR_OPENROUTER_API_KEY
OPEN_ROUTER_DEFAULT_MODEL=openrouter/free
```

Do not commit the `.env` file to the repository.

---

# Provider Selection Behavior

The gateway has a default provider configured in `Config`.

The current configuration uses OpenRouter by default:

```python
LLM_PROVIDER_BASE_URL = OPEN_ROUTER_URL
LLM_PROVIDER_API_KEY = OPEN_ROUTER_API_KEY
DEFAULT_MODEL = OPEN_ROUTER_DEFAULT_MODEL
```

Calling:

```http
PATCH /llm/provider?provider=groq
```

changes the active runtime provider to Groq.

Calling:

```http
PATCH /llm/provider?provider=openrouter
```

changes it back to OpenRouter.

The provider selection is runtime-only and is lost when the application process restarts.

---

# Error Handling

Provider errors returned by the upstream LLM provider are forwarded through the gateway.

For non-streaming requests, an unsuccessful upstream response results in an HTTP error containing the upstream response body.

For streaming requests, an upstream error is returned as an SSE error event followed by:

```text
data: [DONE]
```

Network/request failures to the upstream provider are reported as gateway errors.

---

# Security

## API Keys

Never expose provider API keys through:

- API responses
- logs
- client-side JavaScript
- Git repositories
- documentation committed with real credentials

Provider keys should remain server-side.

## Provider endpoint

Clients communicate with:

```text
/llm/*
```

They do not directly communicate with Groq or OpenRouter.

The gateway is responsible for:

- Selecting the provider
- Supplying the provider API key
- Selecting the default model
- Forwarding chat requests
- Forwarding streaming responses
- Processing usage information

---

# JavaScript Examples

## Basic non-streaming completion

```js
const response = await fetch("http://localhost:1234/llm/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    messages: [
      {
        role: "user",
        content: "What is Redis?"
      }
    ],
    stream: false
  })
});

const data = await response.json();

console.log(data);
```

## Switch provider

```js
await fetch(
  "http://localhost:1234/llm/provider?provider=groq",
  {
    method: "PATCH"
  }
);
```

## Check provider

```js
const response = await fetch(
  "http://localhost:1234/llm/provider"
);

const data = await response.json();

console.log(data);
```

## Tool calling

```js
const response = await fetch("http://localhost:1234/llm/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    messages: [
      {
        role: "user",
        content: "What is the weather in Bhopal?"
      }
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "get_weather",
          description: "Get the current weather for a city.",
          parameters: {
            type: "object",
            properties: {
              city: {
                type: "string"
              }
            },
            required: ["city"]
          }
        }
      }
    ],
    stream: false
  })
});

const data = await response.json();

console.log(data);
```

---

# Summary

The LLM Gateway provides one consistent API for multiple LLM providers.

Clients use:

```text
POST /llm/chat
```

without needing provider-specific URLs or API keys.

Provider selection is controlled with:

```text
PATCH /llm/provider?provider=openrouter
PATCH /llm/provider?provider=groq
```

Chat messages use the `ChatMessage` structure and support tool calls.

Usage is available and synchronizable through:

```text
GET /llm/usage
PATCH /llm/usage
GET /llm/usage/sync
```

LLM limits are available through:

```text
GET /llm/limit
```

The gateway is therefore the single client-facing interface for the configured LLM providers.
