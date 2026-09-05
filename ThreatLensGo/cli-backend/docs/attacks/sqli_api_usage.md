# SQL Injection Attack API

## Overview

This document describes all SQL Injection Attack API routes, including:

- Route paths
- HTTP methods
- Path parameters
- Request bodies
- Example `fetch()` calls
- Example responses
- Usage instructions
- SSE streaming usage
- SQLi test-case management

Base API prefix:

```text
/attack/sqli
```

The SQLi attack API follows the same lifecycle pattern as the DDoS attack API:

```text
Start Attack
    ↓
Get Status
    ↓
Stream Status (optional)
    ↓
Stop Attack
```

Test cases are managed separately through the `/cases` routes.

---

# 1. View SQLi Test Cases

## Route

```http
GET /attack/sqli/cases
```

## Purpose

Returns the complete current SQLi `cases.json`.

The frontend can use this response directly to render:

- Test-case names
- Descriptions
- Categories
- Enabled/disabled state
- Available probes
- Probe names
- Probe values

## Parameters

No path parameters.

No request body.

## Fetch

```javascript
const response = await fetch("/attack/sqli/cases", {
  method: "GET"
});

const cases = await response.json();

console.log(cases);
```

## Response

The response contains the complete cases configuration.

Example:

```json
{
  "boolean_based": {
    "name": "Boolean-based SQL Injection",
    "description": "Boolean condition probes used to detect differential application behavior.",
    "category": "logic",
    "enabled": true,
    "probes": [
      {
        "name": "boolean_true",
        "value": "' OR '1'='1' -- "
      },
      {
        "name": "boolean_false",
        "value": "' OR '1'='2' -- "
      }
    ]
  },
  "error_based": {
    "name": "Error-based SQL Injection",
    "description": "Malformed SQL input used to identify SQL parser or database error behavior.",
    "category": "error",
    "enabled": true,
    "probes": [
      {
        "name": "single_quote",
        "value": "'"
      }
    ]
  }
}
```

## Frontend usage

```javascript
const cases = await fetch("/attack/sqli/cases")
  .then(response => response.json());

Object.entries(cases).forEach(([caseId, testCase]) => {
  console.log(caseId);
  console.log(testCase.name);
  console.log(testCase.enabled);
  console.log(testCase.probes);
});
```

---

# 2. Enable / Disable Multiple SQLi Test Cases

## Route

```http
PATCH /attack/sqli/cases
```

## Purpose

Updates the `enabled` state of multiple SQLi test cases in a single request.

This is intended for frontend test-case selection.

For example, the frontend can enable:

```text
boolean_based
error_based
union_based
```

and disable:

```text
time_based
numeric_based
```

in one request.

## Parameters

No path parameters.

## Request Body

The request body is an array.

Each item contains:

| Field | Type | Required | Description |
|---|---|---|---|
| `case` | string | Yes | Case ID from `cases.json` |
| `enabled` | boolean | Yes | Whether the case should be executed |

## Example Request

```json
[
  {
    "case": "boolean_based",
    "enabled": true
  },
  {
    "case": "error_based",
    "enabled": true
  },
  {
    "case": "union_based",
    "enabled": true
  },
  {
    "case": "sqlite_specific",
    "enabled": true
  },
  {
    "case": "numeric_based",
    "enabled": false
  },
  {
    "case": "time_based",
    "enabled": false
  }
]
```

## Fetch

```javascript
const response = await fetch("/attack/sqli/cases", {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify([
    {
      case: "boolean_based",
      enabled: true
    },
    {
      case: "error_based",
      enabled: true
    },
    {
      case: "union_based",
      enabled: true
    },
    {
      case: "sqlite_specific",
      enabled: true
    },
    {
      case: "numeric_based",
      enabled: false
    },
    {
      case: "time_based",
      enabled: false
    }
  ])
});

const result = await response.json();

console.log(result);
```

## Response

```json
{
  "updated": [
    {
      "case": "boolean_based",
      "enabled": true
    },
    {
      "case": "error_based",
      "enabled": true
    },
    {
      "case": "union_based",
      "enabled": true
    },
    {
      "case": "sqlite_specific",
      "enabled": true
    },
    {
      "case": "numeric_based",
      "enabled": false
    },
    {
      "case": "time_based",
      "enabled": false
    }
  ]
}
```

## Invalid Case

If the frontend sends a case ID that does not exist:

```json
[
  {
    "case": "does_not_exist",
    "enabled": true
  }
]
```

Response:

```json
{
  "detail": "SQLi test case 'does_not_exist' not found"
}
```

HTTP status:

```text
404 Not Found
```

The route validates all case IDs before saving changes, so a batch request does not partially update the file.

---

# 3. Start SQLi Attack

## Route

```http
POST /attack/sqli
```

## Purpose

Starts a new SQL Injection attack using the supplied target/request/attack configuration.

The enabled test cases are loaded from the current `cases.json`.

## Request Body

```json
{
  "target": {
    "base_url": "http://localhost:8000",
    "endpoint": "/tc-auth/login/password",
    "method": "POST"
  },
  "request": {
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "username": "admin",
      "password": "wrong"
    },
    "auth": null
  },
  "attack": {
    "requests_per_case": 1,
    "delay": 0,
    "timeout": 5,
    "on_failure": "continue"
  }
}
```

## Configuration

### `target`

| Field | Type | Required | Description |
|---|---|---|---|
| `base_url` | string | Yes | Base target URL |
| `endpoint` | string | Yes | Target endpoint |
| `method` | string | No | HTTP method. Default: `POST` |
| `query_params` | object | No | Query-string parameters |
| `path_params` | object | No | Path parameters |

### `request`

| Field | Type | Required | Description |
|---|---|---|---|
| `headers` | object | No | HTTP request headers |
| `body` | object | No | JSON/body parameters to test |
| `auth` | any/null | No | Authentication configuration |

### `attack`

| Field | Type | Required | Description |
|---|---|---|---|
| `requests_per_case` | integer | No | Number of executions per probe |
| `delay` | number | No | Delay between requests |
| `timeout` | number | No | HTTP timeout |
| `on_failure` | string | No | Failure handling policy |

## Fetch

```javascript
const response = await fetch("/attack/sqli", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    target: {
      base_url: "http://localhost:8000",
      endpoint: "/tc-auth/login/password",
      method: "POST"
    },

    request: {
      headers: {
        "Content-Type": "application/json"
      },

      body: {
        username: "admin",
        password: "wrong"
      },

      auth: null
    },

    attack: {
      requests_per_case: 1,
      delay: 0,
      timeout: 5,
      on_failure: "continue"
    }
  })
});

const result = await response.json();

console.log(result);
```

## Response

```json
{
  "attack_id": "7c5c9e3f-...",
  "status": "started"
}
```

Save the returned `attack_id`.

It is required for the status, stream, and stop routes.

---

# 4. Get SQLi Attack Status

## Route

```http
GET /attack/sqli/{attack_id}
```

## Purpose

Returns the current status and statistics of a SQLi attack.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `attack_id` | string | Yes | ID returned by the start route |

## Fetch

```javascript
const attackId = "7c5c9e3f-...";

const response = await fetch(
  `/attack/sqli/${attackId}`,
  {
    method: "GET"
  }
);

const status = await response.json();

console.log(status);
```

## Response

Example:

```json
{
  "attack_id": "7c5c9e3f-...",
  "status": "completed",
  "elapsed_seconds": 1.42,
  "progress": {
    "planned_requests": 76,
    "attempted_requests": 76,
    "active_requests": 0
  },
  "requests": {
    "successful": 76,
    "failed": 0,
    "timeouts": 0,
    "retried": 0
  },
  "performance": {
    "requests_per_second": 53.52,
    "average_latency_ms": 5.84,
    "p50_latency_ms": 5.51,
    "p95_latency_ms": 8.21,
    "p99_latency_ms": 9.14
  },
  "status_codes": {
    "200": 76
  },
  "findings": [
    {
      "case": "boolean_based",
      "parameter": {
        "location": "body",
        "name": "password"
      },
      "probe": "boolean_true",
      "result": {
        "finding": "authentication_bypass",
        "confidence": "high"
      },
      "occurrences": 1
    }
  ],
  "errors": {}
}
```

The exact status fields are determined by the current `SQLInjectionAttack` implementation.

---

# 5. Stop SQLi Attack

## Route

```http
POST /attack/sqli/{attack_id}/stop
```

## Purpose

Requests that a running SQLi attack stop.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `attack_id` | string | Yes | ID of the running attack |

## Request Body

None.

## Fetch

```javascript
const attackId = "7c5c9e3f-...";

const response = await fetch(
  `/attack/sqli/${attackId}/stop`,
  {
    method: "POST"
  }
);

const result = await response.json();

console.log(result);
```

## Response

```json
{
  "attack_id": "7c5c9e3f-...",
  "status": "stopping"
}
```

The attack may still be finishing an in-flight request. Use the status route or stream to observe the final state.

---

# 6. Stream SQLi Attack Status

## Route

```http
GET /attack/sqli/{attack_id}/stream
```

## Purpose

Provides real-time attack status through Server-Sent Events (SSE).

This is the recommended route for a live frontend attack dashboard.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `attack_id` | string | Yes | ID returned by the start route |

## Request Body

None.

## Browser Fetch

For SSE, use `EventSource`.

```javascript
const attackId = "7c5c9e3f-...";

const eventSource = new EventSource(
  `/attack/sqli/${attackId}/stream`
);

eventSource.onmessage = (event) => {

  const status = JSON.parse(event.data);

  console.log(status);

  // Update frontend UI here
};

eventSource.onerror = (error) => {

  console.error("SQLi stream error:", error);

  eventSource.close();
};
```

## SSE Response

The server sends events in this format:

```text
data: {"attack_id":"7c5c9e3f-...","status":"running",...}

data: {"attack_id":"7c5c9e3f-...","status":"running",...}

data: {"attack_id":"7c5c9e3f-...","status":"completed",...}
```

Each event contains JSON representing the current attack status.

The stream currently polls the attack status at approximately:

```text
1 second
```

intervals.

---

# 7. Complete Frontend Flow

A typical frontend integration should follow this sequence.

## Step 1 — Load test cases

```javascript
const cases = await fetch("/attack/sqli/cases")
  .then(response => response.json());
```

Display the cases and their current `enabled` state.

---

## Step 2 — User selects cases

Example frontend state:

```javascript
const selectedCases = [
  {
    case: "boolean_based",
    enabled: true
  },
  {
    case: "error_based",
    enabled: true
  },
  {
    case: "union_based",
    enabled: true
  },
  {
    case: "time_based",
    enabled: false
  }
];
```

---

## Step 3 — Save case selection

```javascript
await fetch("/attack/sqli/cases", {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(selectedCases)
});
```

---

## Step 4 — Start attack

```javascript
const response = await fetch("/attack/sqli", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    target: {
      base_url: "http://localhost:8000",
      endpoint: "/tc-auth/login/password",
      method: "POST"
    },

    request: {
      headers: {
        "Content-Type": "application/json"
      },

      body: {
        username: "admin",
        password: "wrong"
      },

      auth: null
    },

    attack: {
      requests_per_case: 1,
      delay: 0,
      timeout: 5,
      on_failure: "continue"
    }
  })
});

const { attack_id } = await response.json();
```

---

## Step 5 — Open live stream

```javascript
const stream = new EventSource(
  `/attack/sqli/${attack_id}/stream`
);

stream.onmessage = (event) => {

  const status = JSON.parse(event.data);

  updateAttackDashboard(status);

  if (
    status.status === "completed" ||
    status.status === "stopped" ||
    status.status === "failed"
  ) {
    stream.close();
  }
};
```

---

## Step 6 — Stop if required

```javascript
await fetch(
  `/attack/sqli/${attack_id}/stop`,
  {
    method: "POST"
  }
);
```

---

# 8. Route Summary

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/attack/sqli/cases` | Get complete SQLi test cases |
| `PATCH` | `/attack/sqli/cases` | Enable/disable multiple cases |
| `POST` | `/attack/sqli` | Start SQLi attack |
| `GET` | `/attack/sqli/{attack_id}` | Get attack status |
| `POST` | `/attack/sqli/{attack_id}/stop` | Stop attack |
| `GET` | `/attack/sqli/{attack_id}/stream` | Stream live attack status |

---

# 9. Error Handling

## Attack Not Found

Routes using `{attack_id}` return:

```http
404 Not Found
```

with:

```json
{
  "detail": "Attack not found"
}
```

## Test Case Not Found

The batch case update route returns:

```http
404 Not Found
```

with:

```json
{
  "detail": "SQLi test case 'invalid_case' not found"
}
```

## Cases File Error

If `cases.json` cannot be loaded:

```http
500 Internal Server Error
```

Example:

```json
{
  "detail": "Unable to load SQLi cases: ..."
}
```

If the cases file cannot be written:

```http
500 Internal Server Error
```

Example:

```json
{
  "detail": "Unable to save SQLi cases: ..."
}
```

---

# 10. Important Frontend Notes

### Case configuration is global

The `/cases` PATCH route modifies the shared `cases.json`.

Therefore:

```text
PATCH /attack/sqli/cases
```

changes which cases will be used by subsequently created attacks.

It is best to configure the cases **before starting an attack**.

### Attack IDs are independent

Each call to:

```http
POST /attack/sqli
```

creates a new attack and receives a unique `attack_id`.

The frontend should store that ID for the lifetime of the attack UI.

### Use SSE for live progress

For a dashboard, prefer:

```text
GET /attack/sqli/{attack_id}/stream
```

instead of repeatedly polling:

```text
GET /attack/sqli/{attack_id}
```

The normal status route is still useful for:

- Initial status
- Refreshing the page
- Recovering after a stream disconnect
- Final status retrieval

---

# 11. Recommended Frontend Architecture

```text
SQLi Page
│
├── Test Cases
│   ├── GET /attack/sqli/cases
│   └── PATCH /attack/sqli/cases
│
├── Attack Configuration
│   └── POST /attack/sqli
│
├── Live Dashboard
│   └── GET /attack/sqli/{id}/stream
│
├── Attack Status
│   └── GET /attack/sqli/{id}
│
└── Stop
    └── POST /attack/sqli/{id}/stop
```

This keeps test-case configuration separate from attack execution while using the same attack lifecycle pattern as the DDoS module.
