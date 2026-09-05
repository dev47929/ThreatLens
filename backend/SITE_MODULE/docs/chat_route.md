# Global Backend Chat API Usage

This API is the **global backend chat service** hosted at:

```text
https://api.codesena.me
```

It is separate from the CLI/local chat API. These routes manage chat sessions and persisted chat history for authenticated accounts.

## Authentication

Chat creation, chat listing, and chat deletion use the current authenticated account.

The authentication dependency resolves the account and the backend uses:

```text
account["account"]["id"]
```

The history routes shown here do not explicitly declare the authentication dependency in the router code.

---

## 1. Save Chat History

### POST `/chats/history`

Saves one or more messages to an existing chat.

### Request

```json
{
  "chat_id": 1,
  "messages": [
    {
      "role": "user",
      "content": "What is Redis?"
    },
    {
      "role": "assistant",
      "content": "Redis is an in-memory data store."
    }
  ]
}
```

Each message is converted using:

```python
message.model_dump(exclude_none=True)
```

The message data can contain:

```text
role
content
tool_calls
tool_call_id
```

### Response

```json
{
  "chat_id": 1,
  "saved": 2
}
```

---

## 2. Get Chat History

### GET `/chats/{chat_id}/history`

Returns paginated chat history.

### Query Parameters

| Parameter | Type | Default | Constraints |
|---|---|---:|---|
| `page` | integer | `1` | `>= 1` |
| `limit` | integer | `10` | `1-100` |
| `format` | string | `default` | `default`, `message`, `table` |

### Default Format

```http
GET https://api.codesena.me/chats/1/history?page=1&limit=10
```

Response:

```json
{
  "page": 1,
  "limit": 10,
  "data": [
    {
      "id": 36,
      "message": {
        "role": "assistant",
        "content": "Redis is an in-memory data store."
      },
      "chat_id": 1,
      "created_at": "2026-09-02T21:19:13.462709+05:30"
    }
  ]
}
```

### Message Format

Use:

```http
GET https://api.codesena.me/chats/1/history?page=1&limit=10&format=message
```

This returns **only the list of message dictionaries**:

```json
[
  {
    "role": "user",
    "content": "What is Redis?"
  },
  {
    "role": "assistant",
    "content": "Redis is an in-memory data store."
  }
]
```

Tool-related fields are preserved when present:

```json
[
  {
    "role": "assistant",
    "content": null,
    "tool_calls": [
      {
        "id": "call_123",
        "type": "function",
        "function": {
          "name": "get_weather",
          "arguments": "{\"city\":\"Bhopal\"}"
        }
      }
    ]
  },
  {
    "role": "tool",
    "content": "{\"temperature\":28}",
    "tool_call_id": "call_123"
  }
]
```

### Table Format

The API accepts:

```http
GET /chats/1/history?format=table
```

The current route contains no table transformation:

```python
if format == "table":
    history
```

Therefore, no separate table response structure is currently defined by this route.

---

## 3. Create Chat

### POST `/chats`

Creates a chat for the authenticated account.

### Request

```json
{
  "title": "Redis Discussion",
  "model": "openai/gpt-oss-20b"
}
```

### Response

Returns the chat object created by the backend.

The chat is associated with the authenticated account automatically.

---

## 4. List Chats

### GET `/chats`

Returns chats belonging to the authenticated account.

Example:

```http
GET https://api.codesena.me/chats
```

No request body or query parameters are required.

---

## 5. Delete Chat

### DELETE `/chats/{chat_id}`

Deletes a chat belonging to the authenticated account.

Example:

```http
DELETE https://api.codesena.me/chats/1
```

Response:

```json
{
  "success": true
}
```

The exact result depends on the deletion performed by the service.

---

## Endpoint Summary

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/chats/history` | Save chat messages |
| `GET` | `/chats/{chat_id}/history` | Get paginated history |
| `POST` | `/chats` | Create a chat |
| `GET` | `/chats` | List account chats |
| `DELETE` | `/chats/{chat_id}` | Delete a chat |

## Message Structure

The history data uses message dictionaries with the following possible fields:

```python
{
    "role": str,
    "content": Any,
    "tool_calls": list[dict] | None,
    "tool_call_id": str | None,
}
```

Optional fields are omitted when saving because the backend uses:

```python
model_dump(exclude_none=True)
```

This API is the **global backend API** at `api.codesena.me`, not the local/CLI gateway API.
