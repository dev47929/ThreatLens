# GET `/attack` — Usage Guide

Returns all attacks currently stored in the backend's in-memory attack store.

Results are ordered by `posted_at` in descending order, so the latest attack appears first.

## Endpoint

```http
GET /attack
```

## Authentication

The endpoint requires a valid JWT.

Send the JWT using the `Authorization` header:

```http
Authorization: Bearer <JWT_TOKEN>
```

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `attack_type` | string | No | Filters attacks by attack type. If omitted, all attack types are returned. |

### Allowed `attack_type` Values

The following attack types are supported:

- `ddos`
- `data_burning`
- `xss`
- `sqli`
- `origin_proxy`

### Get all attacks

```http
GET /attack
```

### Filter by attack type

```http
GET /attack?attack_type=ddos
```

```http
GET /attack?attack_type=xss
```

## Response

The endpoint returns a JSON array.

```json
[
  {
    "attack_id": "string",
    "attack_type": "string",
    "posted_at": "datetime",
    "config": {
      "target": {},
      "request": {},
      "attack": {}
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
| `config.target` | object | Target configuration. This uses the common target structure across attack types. |
| `config.request` | object | Request configuration. This uses the common request structure across attack types. |
| `config.attack` | object | Attack-specific configuration. Its fields depend on `attack_type`. |

## Configuration Structure

The outer configuration structure is consistent across attack types:

```text
config
├── target
├── request
└── attack
```

`target` and `request` have the same fields across attack types.

`attack` is attack-specific and may contain different fields depending on the attack type.

For example, a DDoS attack may contain:

```json
{
  "duration": 30,
  "requests": 100,
  "concurrency": 10,
  "delay": 0.2,
  "timeout": 1,
  "retries": 0,
  "on_failure": "continue"
}
```

Another attack type may contain a different set of fields under `config.attack`.

Frontend integrations should therefore treat `config.attack` as attack-type-specific rather than assuming a fixed schema.

## Example Response

```json
[
  {
    "attack_id": "34a354b3-6229-46a3-b672-68eb23e9a9b9",
    "attack_type": "data_burning",
    "posted_at": "2026-09-01T18:19:43.159532+00:00",
    "config": {
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
          "identifier": "example",
          "password": "example"
        }
      },
      "attack": {
        "duration": 30,
        "requests": 10,
        "concurrency": 2,
        "delay": 0.2,
        "timeout": 1,
        "retries": 0,
        "on_failure": "continue"
      }
    }
  },
  {
    "attack_id": "5b3a5c81-05c4-4057-b7e9-e2b7d8845fc0",
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

## JavaScript Fetch

### Get all attacks

```javascript
const jwt = "YOUR_JWT_TOKEN";

const response = await fetch("http://localhost:1234/attack", {
  method: "GET",
  headers: {
    "Accept": "application/json",
    "Authorization": `Bearer ${jwt}`
  }
});

if (!response.ok) {
  throw new Error(`HTTP error: ${response.status}`);
}

const attacks = await response.json();

console.log(attacks);
```

### Filter by attack type

```javascript
const jwt = "YOUR_JWT_TOKEN";
const attackType = "ddos";

const url =
  `http://localhost:1234/attack?attack_type=${encodeURIComponent(attackType)}`;

const response = await fetch(url, {
  method: "GET",
  headers: {
    "Accept": "application/json",
    "Authorization": `Bearer ${jwt}`
  }
});

if (!response.ok) {
  throw new Error(`HTTP error: ${response.status}`);
}

const attacks = await response.json();

console.log(attacks);
```

## Ordering

Results are always sorted by `posted_at` descending:

```text
latest attack
      ↓
newer attack
      ↓
older attack
      ↓
oldest attack
```

The latest attack is therefore the first element of the returned array.

## In-Memory Storage

Attack records are stored only in the backend's in-memory `attacks` dictionary.

They are not persisted in the database.

If the backend process stops or restarts, the stored attack records are lost.

This endpoint therefore represents the attacks currently available in the running backend process.
