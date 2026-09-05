# Chat API Routes

Base URL for local CLI usage:

- http://localhost:1234

These routes are defined in `cli-backend/api/chat_route.py` and are mounted under the `/chats` prefix.

---

## 1) Create a chat

### POST /chats

Creates a new chat session.

#### Parameters

No query parameters.

#### Request body

```json
{
  "title": "Repository review",
  "model": "anthropic/claude-3.5-sonnet"
}
```

Fields:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| title | string | No | Friendly title for the chat |
| model | string | No | LLM model identifier used for the chat |

#### Response

The upstream service returns the created chat object. Example shape:

```json
{
  "id": 1,
  "title": "Repository review",
  "model": "anthropic/claude-3.5-sonnet",
  "created_at": "2026-08-30T10:00:00Z"
}
```

Exact fields can vary depending on the backend implementation, but the route usually returns the created chat record.

#### Sample fetch

```js
fetch("http://localhost:1234/chats", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    title: "Repository review",
    model: "anthropic/claude-3.5-sonnet"
  })
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

## 2) List chats

### GET /chats

Returns all chat sessions available to the current user/session.

#### Parameters

No query parameters.

#### Request body

No request body.

#### Response

Example JSON:

```json
[
  {
    "id": 1,
    "title": "Repository review",
    "model": "anthropic/claude-3.5-sonnet"
  },
  {
    "id": 2,
    "title": "Security check",
    "model": "gpt-4o-mini"
  }
]
```

#### Sample fetch

```js
fetch("http://localhost:1234/chats")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

## 3) Delete a chat

### DELETE /chats/{chat_id}

Deletes a chat by ID.

#### Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| chat_id | integer | Yes | Chat ID to delete |

#### Request body

No request body.

#### Response

The upstream service typically returns the deleted chat record or a success payload. Example:

```json
{
  "status": "deleted",
  "chat_id": 1
}
```

#### Sample fetch

```js
fetch("http://localhost:1234/chats/1", {
  method: "DELETE"
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

## 4) Save chat history

### POST /chats/history

Stores a chat history payload for the specified chat ID.

#### Parameters

No query parameters.

#### Request body

```json
{
  "chat_id": 1,
  "messages": [
    {
      "role": "user",
      "content": "Summarize the repository structure"
    },
    {
      "role": "assistant",
      "content": "This project has a CLI backend and a web frontend."
    }
  ]
}
```

Fields:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| chat_id | integer | Yes | Target chat session ID |
| messages | array | Yes | List of chat messages to store |

Each message item is a generic object and can include the usual chat fields such as `role`, `content`, and optional `tool_calls` / `tool_call_id` depending on the backend schema.

#### Response

Example JSON:

```json
{
  "status": "saved",
  "chat_id": 1
}
```

#### Sample fetch

```js
fetch("http://localhost:1234/chats/history", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    chat_id: 1,
    messages: [
      { role: "user", content: "Summarize the repository structure" },
      { role: "assistant", content: "This project has a CLI backend and a web frontend." }
    ]
  })
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

## 5) Get chat history

### GET /chats/{chat_id}/history

Retrieves saved chat history for a chat session.

#### Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| chat_id | integer | Yes | Chat session ID |
| page | integer | No | Pagination page number; default `1`, minimum `1` |
| limit | integer | No | Number of records per page; default `10`, range `1-100` |
| format | string | No | Response format; default `default`; allowed values: `default`, `message`, `table` |

#### Request body

No request body.

#### `format=default`

Request:

```http
GET /chats/1/history?page=1&limit=10&format=default
```

Returns the normal paginated history response.

Example:

```json
{
  "page": 1,
  "limit": 10,
  "data": [
    {
      "id": 36,
      "message": {
        "role": "assistant",
        "content": "Yes, Redis is a key-value database."
      },
      "chat_id": 1,
      "created_at": "2026-09-02T21:19:13.462709+05:30"
    },
    {
      "id": 35,
      "message": {
        "role": "user",
        "content": "Is Redis a database?"
      },
      "chat_id": 1,
      "created_at": "2026-09-02T21:19:13.462709+05:30"
    }
  ]
}
```

#### `format=message`

Request:

```http
GET /chats/1/history?page=1&limit=10&format=message
```

Returns only the list of message objects.

Example:

```json
[
  {
    "role": "assistant",
    "content": "Yes, Redis is a key-value database."
  },
  {
    "role": "user",
    "content": "Is Redis a database?"
  }
]
```

If tool data is present, it is preserved in the message object:

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

#### `format=table`

Request:

```http
GET /chats/1/history?page=1&limit=10&format=table
```

Returns the table-format representation generated by the history service.

The exact table structure depends on the current `get_history()` service implementation.

#### Sample fetch

Default:

```js
fetch("http://localhost:1234/chats/1/history?page=1&limit=10")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

Message format:

```js
fetch("http://localhost:1234/chats/1/history?page=1&limit=10&format=message")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

Table format:

```js
fetch("http://localhost:1234/chats/1/history?page=1&limit=10&format=table")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

## Notes

- This router expects the CLI to already have a valid JWT from the auth flow.
- `POST /chats/history` attempts to synchronize local LLM usage before saving history.
- Usage synchronization errors are ignored by the route so they do not prevent history from being saved.
- `GET /chats/{chat_id}/history` supports pagination through `page` and `limit`.
- `format=default` returns the normal paginated history response.
- `format=message` returns only the list of stored message objects.
- Message objects can contain `role`, `content`, and optional `tool_calls` / `tool_call_id` fields.
- `format=table` returns the table-format result generated by the history service.
- The actual chat payloads and upstream response fields depend on the backend service implementation behind the CLI.
