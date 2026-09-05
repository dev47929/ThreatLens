# GET `/attack` — Usage Guide

Returns attacks currently stored in the backend's in-memory attack store.

The endpoint supports normal JSON retrieval and Server-Sent Events (SSE) streaming.

## Endpoint

```http
GET /attack
```

## Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---:|---:|---|
| `attack_type` | string | No | `null` | Filters attacks by attack type. If omitted, all attack types are returned. |
| `stream` | boolean | No | `false` | Enables SSE streaming mode. |
| `polling` | boolean | No | `false` | When streaming, controls whether the server sends data at fixed intervals. |
| `interval` | integer | No | `2` | Polling interval in seconds when `polling=true`. Minimum effective value is 1 second. |

### Allowed `attack_type` Values

- `ddos`
- `data_burning`
- `xss`
- `sqli`
- `origin_proxy`

---

## Normal Mode

When `stream=false` (default), the endpoint returns the current attack list once.

```http
GET /attack
```

### Filter by attack type

```http
GET /attack?attack_type=ddos
```

Results are ordered by `posted_at` descending, so the latest attack appears first.

### Response

```json
[
  {
    "attack_id": "34a354b3-6229-46a3-b672-68eb23e9a9b9",
    "attack_type": "ddos",
    "posted_at": "2026-09-01T18:13:46.425239+00:00",
    "config": {
      "target": {
        "base_url": "http://localhost:8000",
        "endpoint": "/tc-auth/config/pulse",
        "method": "GET",
        "path_params": null,
        "query_params": null
      },
      "request": {
        "headers": null,
        "auth": null,
        "body": null
      },
      "attack": {
        "duration": 30,
        "requests": 100,
        "concurrency": 10,
        "delay": 0.2,
        "timeout": 1,
        "retries": 0,
        "on_failure": "continue"
      }
    }
  }
]
```

### Response Fields

| Field | Type | Description |
|---|---|---|
| `attack_id` | string | Unique ID of the attack. |
| `attack_type` | string | Type of attack. |
| `posted_at` | string | UTC timestamp when the attack was added to the in-memory store. |
| `config` | object | Configuration used for the attack. |
| `config.target` | object | Common target configuration. |
| `config.request` | object | Common request configuration. |
| `config.attack` | object | Attack-specific configuration. Its fields depend on `attack_type`. |

`target` and `request` use the same field structure across attack types. The `attack` section may contain different fields for different attack types.

---

# SSE Streaming

Set:

```http
stream=true
```

to keep the HTTP connection open using Server-Sent Events.

There are two streaming modes.

## Event-Driven Mode

```http
GET /attack?stream=true
```

or:

```http
GET /attack?stream=true&polling=false
```

The server waits for a new attack to be added.

It does **not repeatedly query the attack store while idle**.

When a new attack is added, the server immediately sends:

```text
event: attack_created
data: {"attack_id":"...","attack_type":"ddos","posted_at":"..."}

```

### Filtered Event Stream

```http
GET /attack?stream=true&polling=false&attack_type=ddos
```

Only newly created DDoS attacks are sent to this connection.

---

## Polling Mode

Enable polling with:

```http
GET /attack?stream=true&polling=true
```

The server sends the current attack list at the configured interval.

The default interval is:

```text
2 seconds
```

### Custom Interval

```http
GET /attack?stream=true&polling=true&interval=5
```

The current attack list is sent every 5 seconds.

### Filtered Polling

```http
GET /attack?stream=true&polling=true&interval=5&attack_type=ddos
```

Every 5 seconds, the current DDoS attack list is sent.

---

# Streaming Summary

| Request | Behavior |
|---|---|
| `/attack` | Return current attacks once |
| `/attack?attack_type=ddos` | Return current DDoS attacks once |
| `/attack?stream=true` | SSE; send only when a new attack is added |
| `/attack?stream=true&polling=false` | SSE; send only when a new attack is added |
| `/attack?stream=true&polling=true` | SSE; send current list every 2 seconds |
| `/attack?stream=true&polling=true&interval=5` | SSE; send current list every 5 seconds |
| `/attack?stream=true&polling=true&interval=5&attack_type=ddos` | SSE; send DDoS list every 5 seconds |

---

# SSE Event Format

Event-driven mode uses the `attack_created` event:

```text
event: attack_created
data: {"attack_id":"f70b311a-194a-471d-9a67-e43730080d6e","attack_type":"ddos","posted_at":"2026-09-01T18:05:06.362831+00:00"}

```

The event data is:

```json
{
  "attack_id": "f70b311a-194a-471d-9a67-e43730080d6e",
  "attack_type": "ddos",
  "posted_at": "2026-09-01T18:05:06.362831+00:00"
}
```

The event contains metadata about the newly created attack, not the complete attack object.

---

# JavaScript Fetch — Normal Request

```javascript
const response = await fetch("http://localhost:1234/attack", {
  method: "GET",
  headers: {
    "Accept": "application/json"
  }
});

if (!response.ok) {
  throw new Error(`HTTP error: ${response.status}`);
}

const attacks = await response.json();

console.log(attacks);
```

## Filtered Request

```javascript
const attackType = "ddos";

const url =
  `http://localhost:1234/attack?attack_type=${encodeURIComponent(attackType)}`;

const response = await fetch(url, {
  method: "GET",
  headers: {
    "Accept": "application/json"
  }
});

if (!response.ok) {
  throw new Error(`HTTP error: ${response.status}`);
}

const attacks = await response.json();

console.log(attacks);
```

---

# JavaScript SSE — Event-Driven

For SSE without custom-header authentication:

```javascript
const events = new EventSource(
  "http://localhost:1234/attack?stream=true"
);

events.addEventListener("attack_created", (event) => {
  const attack = JSON.parse(event.data);

  console.log("New attack:", attack);

  // Add the attack to the frontend list.
});

events.onerror = (error) => {
  console.error("SSE connection error:", error);
};
```

### Filtered SSE

```javascript
const events = new EventSource(
  "http://localhost:1234/attack?stream=true&attack_type=ddos"
);

events.addEventListener("attack_created", (event) => {
  const attack = JSON.parse(event.data);

  console.log("New DDoS attack:", attack);
});
```

> This endpoint does not require authentication, so the native browser `EventSource` API can be used directly.

---

# JavaScript SSE — Polling Mode

```javascript
const events = new EventSource(
  "http://localhost:1234/attack?stream=true&polling=true&interval=5"
);

events.addEventListener("attack_list", (event) => {
  const attacks = JSON.parse(event.data);

  console.log("Current attacks:", attacks);

  // Replace/update the frontend attack list.
});

events.onerror = (error) => {
  console.error("SSE connection error:", error);
};
```

---

# In-Memory Storage

Attack records are stored only in the backend's in-memory `attacks` dictionary.

They are not persisted in the database.

If the backend process stops or restarts, the stored attack records are lost.

This endpoint therefore represents attacks currently available in the running backend process.
