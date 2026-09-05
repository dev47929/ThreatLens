# Origin & Proxy Attack API — Frontend Integration Guide

## Overview

The Origin & Proxy attack module tests a target endpoint for security issues related to:

- CORS / `Origin` handling
- `Forwarded` headers
- `X-Forwarded-*` headers
- Client IP headers
- Reverse-proxy metadata
- Host handling
- Scheme / protocol handling
- Proxy-related response metadata

The module follows the same attack lifecycle as the SQLi and XSS attack modules.

---

## Base URL

The route prefix is:

```text
/attack/origin-proxy
```

For a local backend:

```text
http://127.0.0.1:8000/attack/origin-proxy
```

> Replace the host/port with your deployed backend URL in production.

---

# API Routes

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/attack/origin-proxy` | Start an Origin/Proxy attack |
| `GET` | `/attack/origin-proxy/{attack_id}` | Get attack status/result |
| `POST` | `/attack/origin-proxy/{attack_id}/stop` | Stop a running attack |
| `GET` | `/attack/origin-proxy/{attack_id}/stream` | Stream live attack status using SSE |
| `GET` | `/attack/origin-proxy/cases` | Fetch all Origin/Proxy test cases |
| `PATCH` | `/attack/origin-proxy/cases` | Enable/disable multiple test cases |

---

# 1. Start Origin & Proxy Attack

Starts a new asynchronous attack.

## Request

```http
POST /attack/origin-proxy
Content-Type: application/json
```

### Request Body

```json
{
  "target": {
    "base_url": "http://127.0.0.1:8000",
    "endpoint": "/test",
    "method": "GET",
    "path_params": null,
    "query_params": null
  },
  "request": {
    "headers": {},
    "auth": null,
    "body": null
  },
  "attack": {
    "requests_per_case": 1,
    "delay": 0.2,
    "timeout": 5,
    "on_failure": "continue"
  }
}
```

## `target`

| Field | Type | Required | Description |
|---|---|---:|---|
| `base_url` | `string` | Yes | Base URL of the target server |
| `endpoint` | `string` | Yes | Endpoint/path that should be tested |
| `method` | `string` | Yes | HTTP method used for the target request |
| `path_params` | `object \| null` | No | Path parameter values |
| `query_params` | `object \| null` | No | Query parameter values |

### Example

```json
{
  "target": {
    "base_url": "http://127.0.0.1:8000",
    "endpoint": "/users/{user_id}",
    "method": "GET",
    "path_params": {
      "user_id": "123"
    },
    "query_params": {
      "include": "profile"
    }
  }
}
```

---

## `request`

Contains the normal/base request configuration that the attack engine should use.

| Field | Type | Required | Description |
|---|---|---:|---|
| `headers` | `object` | No | Base request headers |
| `auth` | `any \| null` | No | Authentication configuration |
| `body` | `object \| null` | No | Base request body |

### Example

```json
{
  "request": {
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer <token>"
    },
    "auth": null,
    "body": {
      "name": "test"
    }
  }
}
```

Individual Origin/Proxy test cases can add or modify headers used during testing.

---

## `attack`

Controls attack execution.

| Field | Type | Description |
|---|---|---|
| `requests_per_case` | `integer` | Number of requests generated for each enabled test case |
| `delay` | `float` | Delay between requests |
| `timeout` | `float` | HTTP request timeout |
| `on_failure` | `string` | Behavior when an individual request fails |

Example:

```json
{
  "attack": {
    "requests_per_case": 1,
    "delay": 0.2,
    "timeout": 5,
    "on_failure": "continue"
  }
}
```

---

## Start Attack — Response

### HTTP Response

```json
{
  "attack_id": "9d13e3f5-a99f-4b0a-8009-4583953068a7",
  "status": "started"
}
```

| Field | Type | Description |
|---|---|---|
| `attack_id` | `string` | Unique identifier for this attack |
| `status` | `string` | Initial attack state |

The frontend **must store `attack_id`** because it is required for:

- Checking status
- Opening the SSE stream
- Stopping the attack
- Fetching final results

---

# 2. Get Attack Status / Result

Returns the current state of an attack and its results.

## Request

```http
GET /attack/origin-proxy/{attack_id}
```

### Path Parameter

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `attack_id` | `string` | Yes | ID returned by the start endpoint |

### Example

```http
GET /attack/origin-proxy/9d13e3f5-a99f-4b0a-8009-4583953068a7
```

## Response

```json
{
  "attack_id": "9d13e3f5-a99f-4b0a-8009-4583953068a7",
  "status": "completed",
  "elapsed_seconds": 5.21,
  "progress": {
    "planned_requests": 25,
    "attempted_requests": 25
  },
  "requests": {
    "successful": 25,
    "failed": 0,
    "timeouts": 0
  },
  "findings": [
    {
      "case": "origin",
      "test": "origin_example",
      "request": {
        "method": "GET",
        "url": "http://127.0.0.1:8000/test",
        "headers": {
          "Origin": "https://example.com"
        },
        "query_params": {}
      },
      "response": {
        "status_code": 200,
        "headers": {
          "access-control-allow-origin": "https://example.com"
        }
      },
      "metadata": {
        "status_code": 200,
        "content_type": "application/json",
        "server": "uvicorn"
      },
      "analysis": {
        "findings": [
          {
            "type": "cors_headers_observed",
            "headers": {
              "access-control-allow-origin": "https://example.com"
            }
          }
        ]
      }
    }
  ]
}
```

## Status Values

The frontend should handle these states:

```text
created
running
completed
failed
stopped
```

### Recommended frontend behavior

| Status | Frontend behavior |
|---|---|
| `created` | Show attack as queued/created |
| `running` | Show progress and allow Stop |
| `completed` | Stop polling/streaming and display findings |
| `failed` | Stop monitoring and display failure state |
| `stopped` | Stop monitoring and display partial results if available |

---

# 3. Stop Attack

Stops a running attack.

## Request

```http
POST /attack/origin-proxy/{attack_id}/stop
```

No request body is required.

### Example

```http
POST /attack/origin-proxy/9d13e3f5-a99f-4b0a-8009-4583953068a7/stop
```

## Response

```json
{
  "attack_id": "9d13e3f5-a99f-4b0a-8009-4583953068a7",
  "status": "stopping"
}
```

After requesting a stop, continue monitoring the attack until the final state becomes:

```text
stopped
```

or another terminal state returned by the backend.

---

# 4. Stream Attack Status Using SSE

The stream endpoint provides real-time attack progress using **Server-Sent Events (SSE)**.

## Request

```http
GET /attack/origin-proxy/{attack_id}/stream
```

No request body is required.

### Example

```http
GET /attack/origin-proxy/9d13e3f5-a99f-4b0a-8009-4583953068a7/stream
```

## Response Content-Type

```text
text/event-stream
```

Each event contains JSON after the `data:` prefix.

### Example Stream

```text
data: {"attack_id":"9d13e3f5-a99f-4b0a-8009-4583953068a7","status":"running","elapsed_seconds":1.01,"progress":{"planned_requests":25,"attempted_requests":5},"requests":{"successful":5,"failed":0,"timeouts":0},"findings":[]}

data: {"attack_id":"9d13e3f5-a99f-4b0a-8009-4583953068a7","status":"running","elapsed_seconds":2.02,"progress":{"planned_requests":25,"attempted_requests":10},"requests":{"successful":10,"failed":0,"timeouts":0},"findings":[]}

data: {"attack_id":"9d13e3f5-a99f-4b0a-8009-4583953068a7","status":"completed","elapsed_seconds":5.21,"progress":{"planned_requests":25,"attempted_requests":25},"requests":{"successful":25,"failed":0,"timeouts":0},"findings":[...]}
```

The stream ends automatically when the attack reaches a terminal state such as:

```text
completed
failed
stopped
```

---

# 5. Get Origin & Proxy Test Cases

Returns the currently configured Origin/Proxy test cases.

## Request

```http
GET /attack/origin-proxy/cases
```

No request body is required.

## Response

The endpoint returns the current test-case configuration.

Example:

```json
{
  "origin": {
    "name": "Origin Handling",
    "description": "Tests Origin header handling.",
    "category": "cors",
    "enabled": true,
    "tests": [
      {
        "name": "origin_example",
        "method": "GET",
        "headers": {
          "Origin": "https://example.com"
        }
      }
    ]
  },
  "forwarded": {
    "name": "Forwarded Header",
    "description": "Tests Forwarded header handling.",
    "category": "proxy",
    "enabled": true,
    "tests": [
      {
        "name": "forwarded_local",
        "method": "GET",
        "headers": {
          "Forwarded": "for=127.0.0.1;proto=https;host=example.com"
        }
      }
    ]
  }
}
```

The exact response is the current `cases.json` configuration.

### Frontend usage

Use this endpoint to:

1. Load available test cases.
2. Display case names/descriptions.
3. Display enabled/disabled state.
4. Let the user select which cases should run.
5. Send changed states through the `PATCH /cases` endpoint.

---

# 6. Enable / Disable Multiple Test Cases

Updates multiple test cases in one request.

## Request

```http
PATCH /attack/origin-proxy/cases
Content-Type: application/json
```

### Request Body

The body is a JSON array.

```json
[
  {
    "case": "origin",
    "enabled": true
  },
  {
    "case": "forwarded",
    "enabled": false
  },
  {
    "case": "x_forwarded",
    "enabled": true
  }
]
```

### Item Schema

| Field | Type | Required | Description |
|---|---|---:|---|
| `case` | `string` | Yes | Case identifier from `/cases` |
| `enabled` | `boolean` | Yes | Whether the case should be enabled |

### Enable a Case

```json
[
  {
    "case": "origin",
    "enabled": true
  }
]
```

### Disable a Case

```json
[
  {
    "case": "origin",
    "enabled": false
  }
]
```

### Update Multiple Cases

```json
[
  {
    "case": "origin",
    "enabled": true
  },
  {
    "case": "forwarded",
    "enabled": true
  },
  {
    "case": "x_forwarded",
    "enabled": false
  },
  {
    "case": "real_ip",
    "enabled": true
  }
]
```

## Response

```json
{
  "updated": [
    {
      "case": "origin",
      "enabled": true
    },
    {
      "case": "forwarded",
      "enabled": true
    },
    {
      "case": "x_forwarded",
      "enabled": false
    },
    {
      "case": "real_ip",
      "enabled": true
    }
  ]
}
```

All requested cases are validated before changes are written.

---

# Error Responses

## Attack Not Found

Relevant routes:

```text
GET  /attack/origin-proxy/{attack_id}
POST /attack/origin-proxy/{attack_id}/stop
GET  /attack/origin-proxy/{attack_id}/stream
```

Example response:

```json
{
  "detail": "Attack not found"
}
```

HTTP status:

```text
404
```

---

## Test Case Not Found

Relevant route:

```text
PATCH /attack/origin-proxy/cases
```

Example request:

```json
[
  {
    "case": "invalid_case",
    "enabled": true
  }
]
```

Example response:

```json
{
  "detail": "Origin & Proxy test case 'invalid_case' not found"
}
```

HTTP status:

```text
404
```

No case changes are applied when an invalid case is included.

---

# Complete Frontend Integration Flow

The recommended frontend flow is:

```text
1. GET /attack/origin-proxy/cases
              |
              v
2. Render available test cases
              |
              v
3. PATCH /attack/origin-proxy/cases
              |
              v
4. POST /attack/origin-proxy
              |
              v
         attack_id
              |
       +------+------+
       |             |
       v             v
5. SSE stream    GET status
       |             |
       +------+------+
              |
              v
       Update UI live
              |
       +------+------+
       |             |
       v             v
   Stop if       Completed
   requested         |
       |             |
       v             v
POST /stop     Display findings
```

---

# Recommended UI State

A frontend can maintain state similar to:

```javascript
{
  attackId: null,
  status: "idle",
  plannedRequests: 0,
  attemptedRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  timeouts: 0,
  findings: [],
  error: null
}
```

When the attack starts:

```javascript
status = "running";
attackId = response.attack_id;
```

When an SSE event arrives, update:

```javascript
status
plannedRequests
attemptedRequests
successfulRequests
failedRequests
timeouts
findings
```

When the attack reaches:

```text
completed
failed
stopped
```

close the SSE connection.

---

# JavaScript / Fetch Examples

## 1. Fetch Test Cases

```javascript
const response = await fetch(
  `${API_BASE_URL}/attack/origin-proxy/cases`
);

if (!response.ok) {
  throw new Error(`Failed to fetch cases: ${response.status}`);
}

const cases = await response.json();

console.log(cases);
```

---

## 2. Update Test Cases

```javascript
const response = await fetch(
  `${API_BASE_URL}/attack/origin-proxy/cases`,
  {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify([
      {
        case: "origin",
        enabled: true
      },
      {
        case: "forwarded",
        enabled: false
      }
    ])
  }
);

if (!response.ok) {
  const error = await response.json().catch(() => ({}));
  throw new Error(
    error.detail || `Failed to update cases: ${response.status}`
  );
}

const data = await response.json();

console.log(data);
```

---

## 3. Start Attack

```javascript
const response = await fetch(
  `${API_BASE_URL}/attack/origin-proxy`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      target: {
        base_url: "http://127.0.0.1:8000",
        endpoint: "/test",
        method: "GET",
        path_params: null,
        query_params: null
      },

      request: {
        headers: {},
        auth: null,
        body: null
      },

      attack: {
        requests_per_case: 1,
        delay: 0.2,
        timeout: 5,
        on_failure: "continue"
      }
    })
  }
);

if (!response.ok) {
  const error = await response.json().catch(() => ({}));

  throw new Error(
    error.detail || `Failed to start attack: ${response.status}`
  );
}

const data = await response.json();

const attackId = data.attack_id;

console.log("Attack started:", attackId);
```

---

## 4. Get Attack Status

```javascript
const response = await fetch(
  `${API_BASE_URL}/attack/origin-proxy/${attackId}`
);

if (!response.ok) {
  const error = await response.json().catch(() => ({}));

  throw new Error(
    error.detail || `Failed to fetch attack: ${response.status}`
  );
}

const result = await response.json();

console.log(result);
```

---

# 5. SSE Integration

The stream endpoint uses standard Server-Sent Events.

```javascript
const source = new EventSource(
  `${API_BASE_URL}/attack/origin-proxy/${attackId}/stream`
);

source.onmessage = (event) => {
  const status = JSON.parse(event.data);

  console.log("Attack update:", status);

  // Update frontend state here.
  // Example:
  // setAttackStatus(status.status);
  // setProgress(status.progress);
  // setRequests(status.requests);
  // setFindings(status.findings);

  if (
    status.status === "completed" ||
    status.status === "failed" ||
    status.status === "stopped"
  ) {
    source.close();
  }
};

source.onerror = (error) => {
  console.error("SSE connection error:", error);

  source.close();
};
```

### Important SSE Notes

- `EventSource` uses `GET`.
- Do not send a request body.
- The backend response must be `text/event-stream`.
- The frontend should close the connection on terminal states.
- Keep the `attack_id` associated with the active stream.
- If the browser reloads or the SSE connection is lost, use the normal `GET /{attack_id}` endpoint to recover the current attack state.

---

# 6. Stop Attack from Frontend

```javascript
async function stopAttack(attackId) {
  const response = await fetch(
    `${API_BASE_URL}/attack/origin-proxy/${attackId}/stop`,
    {
      method: "POST"
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    throw new Error(
      error.detail || `Failed to stop attack: ${response.status}`
    );
  }

  return await response.json();
}
```

Example:

```javascript
await stopAttack(attackId);
```

After requesting the stop, continue listening for the final `stopped` state.

---

# Complete Frontend Example

```javascript
const API_BASE_URL = "http://127.0.0.1:8000";

async function startOriginProxyAttack() {
  const payload = {
    target: {
      base_url: "http://127.0.0.1:8000",
      endpoint: "/test",
      method: "GET",
      path_params: null,
      query_params: null
    },

    request: {
      headers: {},
      auth: null,
      body: null
    },

    attack: {
      requests_per_case: 1,
      delay: 0.2,
      timeout: 5,
      on_failure: "continue"
    }
  };

  const response = await fetch(
    `${API_BASE_URL}/attack/origin-proxy`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    throw new Error(
      error.detail || `Failed to start attack: ${response.status}`
    );
  }

  const data = await response.json();

  const attackId = data.attack_id;

  startAttackStream(attackId);

  return data;
}


function startAttackStream(attackId) {
  const source = new EventSource(
    `${API_BASE_URL}/attack/origin-proxy/${attackId}/stream`
  );

  source.onmessage = (event) => {
    const update = JSON.parse(event.data);

    updateAttackUI(update);

    if (
      update.status === "completed" ||
      update.status === "failed" ||
      update.status === "stopped"
    ) {
      source.close();
    }
  };

  source.onerror = () => {
    source.close();

    // If required, fetch the current state using:
    // GET /attack/origin-proxy/{attack_id}
  };

  return source;
}


function updateAttackUI(update) {
  console.log("Status:", update.status);

  if (update.progress) {
    console.log(
      "Progress:",
      update.progress.attempted_requests,
      "/",
      update.progress.planned_requests
    );
  }

  if (update.requests) {
    console.log("Requests:", update.requests);
  }

  if (update.findings) {
    console.log("Findings:", update.findings);
  }
}
```

---

# cURL Examples

## Fetch Cases

```bash
curl http://127.0.0.1:8000/attack/origin-proxy/cases
```

## Start Attack

```bash
curl -X POST \
  http://127.0.0.1:8000/attack/origin-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "target": {
      "base_url": "http://127.0.0.1:8000",
      "endpoint": "/test",
      "method": "GET",
      "path_params": null,
      "query_params": null
    },
    "request": {
      "headers": {},
      "auth": null,
      "body": null
    },
    "attack": {
      "requests_per_case": 1,
      "delay": 0.2,
      "timeout": 5,
      "on_failure": "continue"
    }
  }'
```

## Get Status

```bash
curl \
  http://127.0.0.1:8000/attack/origin-proxy/{attack_id}
```

## Stop Attack

```bash
curl -X POST \
  http://127.0.0.1:8000/attack/origin-proxy/{attack_id}/stop
```

## Stream Attack

```bash
curl -N \
  http://127.0.0.1:8000/attack/origin-proxy/{attack_id}/stream
```

## Update Cases

```bash
curl -X PATCH \
  http://127.0.0.1:8000/attack/origin-proxy/cases \
  -H "Content-Type: application/json" \
  -d '[
    {
      "case": "origin",
      "enabled": true
    },
    {
      "case": "forwarded",
      "enabled": false
    }
  ]'
```

---

# Frontend Integration Checklist

Before integrating the module, make sure the frontend handles all of the following:

- [ ] Configure `API_BASE_URL`.
- [ ] Fetch test cases before displaying the attack configuration UI.
- [ ] Display each case's `name`, `description`, `category`, and `enabled` state.
- [ ] Send case changes through `PATCH /attack/origin-proxy/cases`.
- [ ] Build the attack payload with `target`, `request`, and `attack`.
- [ ] Send `Content-Type: application/json` for JSON requests.
- [ ] Store the returned `attack_id`.
- [ ] Open the SSE stream using that `attack_id`.
- [ ] Update progress from `progress`.
- [ ] Update request statistics from `requests`.
- [ ] Render findings from `findings`.
- [ ] Provide a Stop button while the attack is running.
- [ ] Close SSE on `completed`, `failed`, or `stopped`.
- [ ] Handle `404` responses.
- [ ] Handle network/SSE connection failures.
- [ ] If SSE disconnects, recover the state using `GET /attack/origin-proxy/{attack_id}`.
- [ ] Do not expose sensitive backend credentials in frontend code.

---

# Important Integration Notes

## Authentication

The examples above do not assume an authentication mechanism because the provided API definition does not specify one.

If the backend is later protected by authentication, add the required authentication header to the relevant requests, for example:

```javascript
headers: {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`
}
```

For SSE, browser `EventSource` does **not** provide a standard way to set arbitrary authorization headers. If authenticated SSE is introduced, the frontend/backend authentication strategy must account for this.

---

## CORS

If the frontend and backend run on different origins, the backend must allow the frontend origin through its CORS configuration.

For example:

```text
Frontend:
http://localhost:3000

Backend:
http://localhost:8000
```

The backend must be configured to permit requests from the frontend origin.

---

## Base URL Handling

Do not hardcode the production backend URL throughout the application.

Prefer:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

or the equivalent environment configuration for the frontend framework being used.

Then construct routes using:

```javascript
`${API_BASE_URL}/attack/origin-proxy`
```

---

# Endpoint Summary

| # | Method | Endpoint | Body | Returns |
|---:|---|---|---|---|
| 1 | `POST` | `/attack/origin-proxy` | JSON | `attack_id`, status |
| 2 | `GET` | `/attack/origin-proxy/{attack_id}` | None | Attack status/result |
| 3 | `POST` | `/attack/origin-proxy/{attack_id}/stop` | None | Stop status |
| 4 | `GET` | `/attack/origin-proxy/{attack_id}/stream` | None | SSE events |
| 5 | `GET` | `/attack/origin-proxy/cases` | None | Test-case configuration |
| 6 | `PATCH` | `/attack/origin-proxy/cases` | JSON array | Updated cases |

---

# Route Lifecycle

```text
GET /cases
     |
     v
Select / configure cases
     |
     v
PATCH /cases
     |
     v
POST /attack/origin-proxy
     |
     v
Receive attack_id
     |
     +-----------------------+
     |                       |
     v                       v
GET /{attack_id}/stream   GET /{attack_id}
     |                       |
     v                       v
Live progress             Current state
     |
     +----------+
     |          |
     v          v
  Stop       Complete
     |          |
     v          v
POST /stop   Findings
```

---

## Route Count

The Origin & Proxy attack module exposes **6 routes**:

```text
1. POST   /attack/origin-proxy
2. GET    /attack/origin-proxy/{attack_id}
3. POST   /attack/origin-proxy/{attack_id}/stop
4. GET    /attack/origin-proxy/{attack_id}/stream
5. GET    /attack/origin-proxy/cases
6. PATCH  /attack/origin-proxy/cases
```

This guide is based on the provided Origin & Proxy API specification. fileciteturn0file0
