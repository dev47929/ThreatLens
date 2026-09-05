# XSS Attack API Usage Guide

## Overview

The XSS Attack API provides six routes for configuring, starting,
monitoring, stopping, and streaming XSS security tests.

**Base URL**

``` text
http://localhost:1234
```

**API Prefix**

``` text
/attack/xss
```

## Route Summary

  ----------------------------------------------------------------------------------
  Method                  Route                              Purpose
  ----------------------- ---------------------------------- -----------------------
  POST                    `/attack/xss`                      Start an XSS attack

  GET                     `/attack/xss/cases`                Get all XSS test cases

  PATCH                   `/attack/xss/cases`                Enable/disable multiple
                                                             test cases

  GET                     `/attack/xss/{attack_id}`          Get attack status

  POST                    `/attack/xss/{attack_id}/stop`     Stop a running attack

  GET                     `/attack/xss/{attack_id}/stream`   Stream attack status
                                                             using SSE
  ----------------------------------------------------------------------------------

------------------------------------------------------------------------

# 1. Start XSS Attack

**POST `/attack/xss`**

Starts an XSS test using the supplied target, request, and attack
configuration.

### Headers

``` http
Content-Type: application/json
```

### Request Body

``` json
{
  "target": {
    "base_url": "http://localhost:8000",
    "endpoint": "/xss/reflected",
    "method": "GET",
    "path_params": null,
    "query_params": {
      "q": ""
    }
  },
  "request": {
    "headers": {},
    "auth": null,
    "body": {}
  },
  "attack": {
    "requests_per_case": 1,
    "delay": 0.2,
    "timeout": 5,
    "on_failure": "continue"
  }
}
```

### Schema

#### `target`

  Field            Type          Required   Description
  ---------------- ------------- ---------- --------------------------------
  `base_url`       string        Yes        Target application's base URL
  `endpoint`       string        Yes        Target endpoint/path
  `method`         string        Yes        HTTP method used by the target
  `path_params`    object/null   No         Path parameters to test
  `query_params`   object/null   No         Query parameters to test

#### `request`

  Field       Type          Required   Description
  ----------- ------------- ---------- ------------------------------
  `headers`   object        No         Headers sent to the target
  `auth`      object/null   No         Authentication configuration
  `body`      object        No         Request body parameters

#### `attack`

  ---------------------------------------------------------------------------
  Field                 Type              Required          Description
  --------------------- ----------------- ----------------- -----------------
  `requests_per_case`   integer           No                Requests made for
                                                            each enabled case

  `delay`               number            No                Delay between
                                                            requests

  `timeout`             number            No                Request timeout

  `on_failure`          string            No                Failure handling
                                                            policy
  ---------------------------------------------------------------------------

### cURL

``` bash
curl -X POST "http://localhost:1234/attack/xss"   -H "Content-Type: application/json"   -d '{
    "target": {
      "base_url": "http://localhost:8000",
      "endpoint": "/xss/reflected",
      "method": "GET",
      "path_params": null,
      "query_params": {
        "q": ""
      }
    },
    "request": {
      "headers": {},
      "auth": null,
      "body": {}
    },
    "attack": {
      "requests_per_case": 1,
      "delay": 0.2,
      "timeout": 5,
      "on_failure": "continue"
    }
  }'
```

### JavaScript Fetch

``` javascript
const response = await fetch(
  "http://localhost:1234/attack/xss",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      target: {
        base_url: "http://localhost:8000",
        endpoint: "/xss/reflected",
        method: "GET",
        path_params: null,
        query_params: {
          q: ""
        }
      },
      request: {
        headers: {},
        auth: null,
        body: {}
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

const data = await response.json();
console.log(data);
```

### Response

``` json
{
  "attack_id": "80fd6f3b-3d59-4473-8de4-f20502758004",
  "status": "started"
}
```

Save `attack_id`; it is required by the status, stop, and stream routes.

------------------------------------------------------------------------

# 2. Get XSS Test Cases

**GET `/attack/xss/cases`**

Returns the complete contents of the configured XSS `cases.json`.

### Parameters

None.

### Request Body

None.

### cURL

``` bash
curl -X GET "http://localhost:1234/attack/xss/cases"   -H "accept: application/json"
```

### JavaScript Fetch

``` javascript
const response = await fetch(
  "http://localhost:1234/attack/xss/cases"
);

const data = await response.json();
console.log(data);
```

### Response

The endpoint returns the entire cases JSON. The exact case IDs and
probes are defined by the current `attack/xss/cases.json`.

Example structure:

``` json
{
  "reflected_basic": {
    "name": "Basic Reflected XSS",
    "description": "Basic reflection test.",
    "category": "reflected",
    "enabled": true,
    "probes": [
      {
        "name": "marker",
        "value": "XSS_THREADLENS_MARKER"
      }
    ]
  }
}
```

------------------------------------------------------------------------

# 3. Enable / Disable Multiple XSS Test Cases

**PATCH `/attack/xss/cases`**

Updates multiple case states in one request.

### Request Body

``` json
[
  {
    "case": "reflected_basic",
    "enabled": true
  },
  {
    "case": "event_handler",
    "enabled": false
  },
  {
    "case": "html_tag",
    "enabled": true
  }
]
```

### `XSSCaseStatus` Schema

``` python
class XSSCaseStatus(BaseModel):
    case: str
    enabled: bool
```

  Field       Type      Required   Description
  ----------- --------- ---------- --------------------------
  `case`      string    Yes        Case key in `cases.json`
  `enabled`   boolean   Yes        New enabled state

### cURL

``` bash
curl -X PATCH "http://localhost:1234/attack/xss/cases"   -H "Content-Type: application/json"   -d '[
    {
      "case": "reflected_basic",
      "enabled": true
    },
    {
      "case": "event_handler",
      "enabled": false
    }
  ]'
```

### JavaScript Fetch

``` javascript
const response = await fetch(
  "http://localhost:1234/attack/xss/cases",
  {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify([
      {
        case: "reflected_basic",
        enabled: true
      },
      {
        case: "event_handler",
        enabled: false
      }
    ])
  }
);

const data = await response.json();
console.log(data);
```

### Response

``` json
{
  "updated": [
    {
      "case": "reflected_basic",
      "enabled": true
    },
    {
      "case": "event_handler",
      "enabled": false
    }
  ]
}
```

The route validates every requested case before modifying the file. If
any case does not exist, no changes are applied.

### Case Not Found

HTTP `404`:

``` json
{
  "detail": "XSS test case 'unknown_case' not found"
}
```

------------------------------------------------------------------------

# 4. Get XSS Attack Status

**GET `/attack/xss/{attack_id}`**

Returns the current status and metrics for an attack.

### Path Parameter

  Parameter     Type     Required   Description
  ------------- -------- ---------- --------------------------------
  `attack_id`   string   Yes        ID returned by the start route

### cURL

``` bash
curl -X GET   "http://localhost:1234/attack/xss/80fd6f3b-3d59-4473-8de4-f20502758004"   -H "accept: application/json"
```

### JavaScript Fetch

``` javascript
const attackId = "80fd6f3b-3d59-4473-8de4-f20502758004";

const response = await fetch(
  `http://localhost:1234/attack/xss/${attackId}`
);

const data = await response.json();
console.log(data);
```

### Response Schema / Sample

``` json
{
  "attack_id": "80fd6f3b-3d59-4473-8de4-f20502758004",
  "status": "running",
  "elapsed_seconds": 2.01,
  "progress": {
    "planned_requests": 30,
    "attempted_requests": 9,
    "active_requests": 1
  },
  "requests": {
    "successful": 8,
    "failed": 1,
    "timeouts": 0
  },
  "performance": {
    "requests_per_second": 4.2,
    "average_latency_ms": 31.5,
    "p50_latency_ms": 29.1,
    "p95_latency_ms": 52.4,
    "p99_latency_ms": 61.7
  },
  "status_codes": {
    "200": 8
  },
  "findings": [],
  "errors": {}
}
```

Terminal states include:

``` text
completed
failed
stopped
```

### Attack Not Found

HTTP `404`:

``` json
{
  "detail": "Attack not found"
}
```

------------------------------------------------------------------------

# 5. Stop XSS Attack

**POST `/attack/xss/{attack_id}/stop`**

Requests that the selected attack be stopped.

### Path Parameter

  Parameter     Type     Required   Description
  ------------- -------- ---------- --------------------------------
  `attack_id`   string   Yes        ID returned by the start route

### cURL

``` bash
curl -X POST   "http://localhost:1234/attack/xss/80fd6f3b-3d59-4473-8de4-f20502758004/stop"
```

### JavaScript Fetch

``` javascript
const attackId = "80fd6f3b-3d59-4473-8de4-f20502758004";

const response = await fetch(
  `http://localhost:1234/attack/xss/${attackId}/stop`,
  {
    method: "POST"
  }
);

const data = await response.json();
console.log(data);
```

### Response

``` json
{
  "attack_id": "80fd6f3b-3d59-4473-8de4-f20502758004",
  "status": "stopping"
}
```

### Attack Not Found

HTTP `404`:

``` json
{
  "detail": "Attack not found"
}
```

------------------------------------------------------------------------

# 6. Stream XSS Attack Status

**GET `/attack/xss/{attack_id}/stream`**

Streams live attack status using Server-Sent Events (SSE).

### Path Parameter

  Parameter     Type     Required   Description
  ------------- -------- ---------- --------------------------------
  `attack_id`   string   Yes        ID returned by the start route

### Response Content Type

``` text
text/event-stream
```

Each event is formatted as:

``` text
data: <JSON>
```

### cURL

``` bash
curl -N   "http://localhost:1234/attack/xss/80fd6f3b-3d59-4473-8de4-f20502758004/stream"
```

`-N` disables curl buffering so events appear immediately.

### JavaScript Fetch / EventSource

``` javascript
const attackId = "80fd6f3b-3d59-4473-8de4-f20502758004";

const source = new EventSource(
  `http://localhost:1234/attack/xss/${attackId}/stream`
);

source.onmessage = (event) => {
  const status = JSON.parse(event.data);

  console.log("Attack status:", status);

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
};
```

### Example SSE Event

``` text
data: {"attack_id":"80fd6f3b-3d59-4473-8de4-f20502758004","status":"running","elapsed_seconds":2.0,"progress":{"planned_requests":30,"attempted_requests":9,"active_requests":1},"requests":{"successful":9,"failed":0,"timeouts":0},"performance":{"requests_per_second":4.5,"average_latency_ms":20.8,"p50_latency_ms":19.7,"p95_latency_ms":24.8,"p99_latency_ms":25.0},"status_codes":{"200":9},"findings":[],"errors":{}}
```

The final event contains the final attack status.

------------------------------------------------------------------------

# Frontend Integration Flow

Recommended flow:

``` text
GET /attack/xss/cases
        ↓
Display/select test cases
        ↓
PATCH /attack/xss/cases
        ↓
Build XSSConfig
        ↓
POST /attack/xss
        ↓
Receive attack_id
        ↓
GET /attack/xss/{attack_id}/stream
        ↓
Update live progress UI
        ↓
completed / failed / stopped
        ↓
Display final findings
```

## 1. Load Cases

``` javascript
const response = await fetch(
  "http://localhost:1234/attack/xss/cases"
);

const cases = await response.json();
```

Use each case's `enabled` value to initialize the frontend controls.

## 2. Update Cases

``` javascript
await fetch(
  "http://localhost:1234/attack/xss/cases",
  {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify([
      {
        case: "reflected_basic",
        enabled: true
      },
      {
        case: "event_handler",
        enabled: false
      }
    ])
  }
);
```

## 3. Start Attack

``` javascript
const response = await fetch(
  "http://localhost:1234/attack/xss",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(config)
  }
);

const result = await response.json();
const attackId = result.attack_id;
```

## 4. Subscribe to Status

``` javascript
const source = new EventSource(
  `http://localhost:1234/attack/xss/${attackId}/stream`
);

source.onmessage = (event) => {
  const status = JSON.parse(event.data);

  // Update progress
  // Update request counters
  // Display findings
};
```

## 5. Stop Attack

``` javascript
await fetch(
  `http://localhost:1234/attack/xss/${attackId}/stop`,
  {
    method: "POST"
  }
);
```

------------------------------------------------------------------------

# Error Handling

### 404 --- Attack Not Found

``` json
{
  "detail": "Attack not found"
}
```

### 404 --- Case Not Found

``` json
{
  "detail": "XSS test case 'unknown_case' not found"
}
```

### 500 --- Cases Load Failure

``` json
{
  "detail": "Unable to load XSS cases: <error>"
}
```

### 500 --- Cases Save Failure

``` json
{
  "detail": "Unable to save XSS cases: <error>"
}
```

------------------------------------------------------------------------

# Integration Notes

1.  `attack_id` is returned by `POST /attack/xss` and is required for
    status, stop, and stream operations.
2.  `GET /attack/xss/cases` returns the complete `cases.json`.
3.  `PATCH /attack/xss/cases` accepts an array of `{case, enabled}`
    objects.
4.  Multiple cases can be updated in one PATCH request.
5.  All case names are validated before any case is modified.
6.  The XSS attack uses the enabled test cases from `cases.json`.
7.  The stream endpoint uses Server-Sent Events and returns
    `text/event-stream`.
8.  Close the `EventSource` after `completed`, `failed`, or `stopped`.
9.  The attack registry is in-memory, so attack IDs/statuses belong to
    the running API process.
10. The target configuration is supplied separately for each attack.
11. Targets can be configured with query parameters, path parameters, or
    request-body parameters according to the supplied configuration.
12. For the local reflected-XSS test backend, use:

``` text
http://127.0.0.1:8000/xss/reflected
```

with:

``` json
{
  "method": "GET",
  "query_params": {
    "q": ""
  }
}
```

------------------------------------------------------------------------

# Complete Endpoint Reference

  -----------------------------------------------------------------------------------------------------------
  \#          Method      Endpoint                           Request Body        Parameters    Response
  ----------- ----------- ---------------------------------- ------------------- ------------- --------------
  1           POST        `/attack/xss`                      `XSSConfig`         None          `attack_id`,
                                                                                               `status`

  2           GET         `/attack/xss/cases`                None                None          Complete cases
                                                                                               JSON

  3           PATCH       `/attack/xss/cases`                `XSSCaseStatus[]`   None          Updated cases

  4           GET         `/attack/xss/{attack_id}`          None                `attack_id`   Attack status

  5           POST        `/attack/xss/{attack_id}/stop`     None                `attack_id`   Stop status

  6           GET         `/attack/xss/{attack_id}/stream`   None                `attack_id`   SSE status
                                                                                               stream
  -----------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

# Data Models

## XSSCaseStatus

``` python
class XSSCaseStatus(BaseModel):
    case: str
    enabled: bool
```

## XSSConfig

``` json
{
  "target": {
    "base_url": "string",
    "endpoint": "string",
    "method": "string",
    "path_params": "object | null",
    "query_params": "object | null"
  },
  "request": {
    "headers": "object",
    "auth": "object | null",
    "body": "object"
  },
  "attack": {
    "requests_per_case": "integer",
    "delay": "number",
    "timeout": "number",
    "on_failure": "string"
  }
}
```

This document covers all six XSS API routes and the frontend integration
contract.
