# DDoS Attack API

Base path:

```text
/attack/ddos
```

## API Endpoints

| Method | API URL | Purpose |
|---|---|---|
| `POST` | `/attack/ddos` | Start a new DDoS simulation |
| `GET` | `/attack/ddos/{attack_id}` | Get current/final attack status |
| `POST` | `/attack/ddos/{attack_id}/stop` | Stop a running attack |
| `GET` | `/attack/ddos/{attack_id}/stream` | Stream live attack status via SSE |

---

## 1. Start DDoS Attack

### Endpoint

```http
POST /attack/ddos
```

### Request Body

Use the following JSON configuration:

```json
{
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
```

### Response

```json
{
  "attack_id": "448451f2-2cf9-4593-9551-9ffe571e53d2",
  "status": "started"
}
```

The returned `attack_id` is used for the remaining endpoints.

---

## 2. Get Attack Status

### Endpoint

```http
GET /attack/ddos/{attack_id}
```

### Response

Returns the current or final attack status.

```json
{
  "attack_id": "448451f2-2cf9-4593-9551-9ffe571e53d2",
  "status": "completed",
  "elapsed_seconds": 2.58673357963562,
  "progress": {
    "planned_requests": 100,
    "attempted_requests": 100,
    "active_requests": 0
  },
  "requests": {
    "successful": 100,
    "failed": 0,
    "timeouts": 0,
    "retried": 0
  },
  "performance": {
    "requests_per_second": 38.65879377268009,
    "average_latency_ms": 41.687073000357486,
    "p50_latency_ms": 11.359800002537668,
    "p95_latency_ms": 307.3302000120748,
    "p99_latency_ms": 313.5314999963157
  },
  "status_codes": {
    "200": 100
  },
  "errors": {},
  "error_message": null
}
```

---

## 3. Stop Attack

### Endpoint

```http
POST /attack/ddos/{attack_id}/stop
```

### Response

```json
{
  "attack_id": "448451f2-2cf9-4593-9551-9ffe571e53d2",
  "status": "stopping"
}
```

The attack transitions to its terminal `stopped` state after the running tasks finish shutting down.

---

## 4. Stream Attack Status

### Endpoint

```http
GET /attack/ddos/{attack_id}/stream
```

### Response

The endpoint uses **Server-Sent Events (SSE)**.

Content type:

```text
text/event-stream
```

Each event contains the same attack status object returned by the status endpoint.

Example:

```text
data: {"attack_id":"448451f2-2cf9-4593-9551-9ffe571e53d2","status":"pending",...}

data: {"attack_id":"448451f2-2cf9-4593-9551-9ffe571e53d2","status":"running",...}

data: {"attack_id":"448451f2-2cf9-4593-9551-9ffe571e53d2","status":"running",...}

data: {"attack_id":"448451f2-2cf9-4593-9551-9ffe571e53d2","status":"completed",...}
```

The stream ends when the attack reaches one of the terminal states:

```text
completed
failed
stopped
```

---

## Typical Client Flow

```text
POST /attack/ddos
        |
        | receive attack_id
        v
GET /attack/ddos/{attack_id}/stream
        |
        | live status updates
        v
   running...
        |
        +---- POST /attack/ddos/{attack_id}/stop
        |             (optional)
        |
        v
 completed / failed / stopped
```

## Endpoint Summary

```text
POST  /attack/ddos
GET   /attack/ddos/{attack_id}
POST  /attack/ddos/{attack_id}/stop
GET   /attack/ddos/{attack_id}/stream
```
