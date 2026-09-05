# Data Burning Attack API — Usage Guide

## Endpoint

```http
POST /attack/data-burning
```

Starts a controlled Data Burning attack against the configured target API.

The Data Burning attack reuses the existing `DDoSAttack` execution engine and allows a request body to be supplied, making it suitable for testing stateful/write-heavy endpoints such as login or database-backed APIs.

---

## Request Body

### Example

```json
{
  "target": {
    "base_url": "http://localhost:8000",
    "endpoint": "/tc-auth/login/password",
    "method": "POST",
    "path_params": null,
    "query_params": null
  },
  "request": {
    "headers": {
      "Content-Type": "application/json"
    },
    "auth": null,
    "body": {
      "email": "test@example.com",
      "password": "test-password"
    }
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

---

# Parameters

## `target`

| Parameter      | Type          | Required | Description                |
| -------------- | ------------- | -------: | -------------------------- |
| `base_url`     | string        |      Yes | Base URL of the target API |
| `endpoint`     | string        |      Yes | Target API endpoint        |
| `method`       | string        |      Yes | HTTP method                |
| `path_params`  | object / null |       No | Path parameters            |
| `query_params` | object / null |       No | Query parameters           |

### Example

```json
{
  "base_url": "http://localhost:8000",
  "endpoint": "/tc-auth/login/password",
  "method": "POST",
  "path_params": null,
  "query_params": null
}
```

---

## `request`

| Parameter | Type          | Required | Description          |
| --------- | ------------- | -------: | -------------------- |
| `headers` | object / null |       No | HTTP request headers |
| `auth`    | any / null    |       No | HTTP authentication  |
| `body`    | any / null    |       No | JSON request body    |

### Example

```json
{
  "headers": {
    "Content-Type": "application/json"
  },
  "auth": null,
  "body": {
    "email": "test@example.com",
    "password": "test-password"
  }
}
```

The `body` can contain the parameters required by the target endpoint.

For example:

```json
{
  "email": "test@example.com",
  "password": "test-password"
}
```

---

# Attack Parameters

| Parameter     | Type           |      Default | Description                               |
| ------------- | -------------- | -----------: | ----------------------------------------- |
| `duration`    | float / null   |       `null` | Maximum attack duration in seconds        |
| `requests`    | integer / null |       `null` | Maximum number of requests                |
| `concurrency` | integer        |         `10` | Number of concurrent workers              |
| `delay`       | float          |          `0` | Delay between requests                    |
| `timeout`     | float          |         `10` | Request timeout in seconds                |
| `retries`     | integer        |          `0` | Number of retries                         |
| `on_failure`  | string         | `"continue"` | Whether to continue or stop after failure |

At least one of `duration` or `requests` should be configured for a bounded test.

---

# Sample Fetch

```javascript
const response = await fetch(
  "http://localhost:8000/attack/data-burning",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      target: {
        base_url: "http://localhost:8000",
        endpoint: "/tc-auth/login/password",
        method: "POST",
        path_params: null,
        query_params: null
      },

      request: {
        headers: {
          "Content-Type": "application/json"
        },
        auth: null,
        body: {
          email: "test@example.com",
          password: "test-password"
        }
      },

      attack: {
        duration: 30,
        requests: 100,
        concurrency: 10,
        delay: 0.2,
        timeout: 1,
        retries: 0,
        on_failure: "continue"
      }
    })
  }
);

const data = await response.json();

console.log(data);
```

---

# Sample Response

```json
{
  "attack_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "started"
}
```

The returned `attack_id` is used to monitor or stop the attack.

---

# Get Attack Status

```http
GET /attack/data-burning/{attack_id}
```

### Fetch

```javascript
const response = await fetch(
  "http://localhost:8000/attack/data-burning/7c9e6679-7425-40de-944b-e07fc1f90ae7"
);

const data = await response.json();

console.log(data);
```

### Sample Response

```json
{
  "attack_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "completed",
  "elapsed_seconds": 30.12,
  "progress": {
    "planned_requests": 100,
    "attempted_requests": 100,
    "active_requests": 0
  },
  "requests": {
    "successful": 94,
    "failed": 6,
    "timeouts": 2,
    "retried": 0
  },
  "performance": {
    "requests_per_second": 3.32,
    "average_latency_ms": 287.41,
    "p50_latency_ms": 241.18,
    "p95_latency_ms": 721.52,
    "p99_latency_ms": 903.14
  },
  "status_codes": {
    "200": 94,
    "500": 4
  },
  "errors": {
    "ReadTimeout": 2
  },
  "error_message": null
}
```

---

# Stop Attack

```http
POST /attack/data-burning/{attack_id}/stop
```

### Fetch

```javascript
const response = await fetch(
  "http://localhost:8000/attack/data-burning/7c9e6679-7425-40de-944b-e07fc1f90ae7/stop",
  {
    method: "POST"
  }
);

const data = await response.json();

console.log(data);
```

### Response

```json
{
  "attack_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "stopping"
}
```

---

# Live Attack Stream

```http
GET /attack/data-burning/{attack_id}/stream
```

The endpoint returns an SSE stream containing the current attack status.

### Fetch

```javascript
const eventSource = new EventSource(
  "http://localhost:8000/attack/data-burning/7c9e6679-7425-40de-944b-e07fc1f90ae7/stream"
);

eventSource.onmessage = (event) => {
  const status = JSON.parse(event.data);

  console.log(status);

  if (
    ["completed", "failed", "stopped"].includes(status.status)
  ) {
    eventSource.close();
  }
};
```

### Sample SSE Event

```text
data: {
  "attack_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "running",
  "elapsed_seconds": 12.34,
  "progress": {
    "planned_requests": 100,
    "attempted_requests": 48,
    "active_requests": 10
  },
  "requests": {
    "successful": 44,
    "failed": 4,
    "timeouts": 1,
    "retried": 0
  },
  "performance": {
    "requests_per_second": 3.89,
    "average_latency_ms": 265.32,
    "p50_latency_ms": 219.14,
    "p95_latency_ms": 641.27,
    "p99_latency_ms": 641.27
  }
}
```

---

# API Summary

| Method | Endpoint                                  | Purpose            |
| ------ | ----------------------------------------- | ------------------ |
| `POST` | `/attack/data-burning`                    | Start attack       |
| `GET`  | `/attack/data-burning/{attack_id}`        | Get status         |
| `POST` | `/attack/data-burning/{attack_id}/stop`   | Stop attack        |
| `GET`  | `/attack/data-burning/{attack_id}/stream` | Stream live status |
