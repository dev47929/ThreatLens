# Internal Chain API Usage Guide

## Overview

The Internal Chain API manages account-scoped blockchain chains stored as JSON files.

Storage layout:

```text
BLOCKCHAIN_MODULE/
└── chains/
    └── {account_id}/
        └── {chain_id}.json
```

The authenticated user's:

```text
user["account"]["id"]
```

is used to determine the account directory.

The chain ID is reconstructed as:

```text
{chain_name}_{account_id}
```

Example:

```text
chain_name = atharv
account_id = 1
chain_id   = atharv_1
```

---

# Authentication

All authenticated chain-management endpoints use:

```python
user: dict = Depends(auth.deps.get_current)
```

The frontend must send the authentication credentials required by the application.

Example:

```javascript
const response = await fetch(`${API_BASE_URL}/chain`, {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  },
});
```

---

# Endpoint Summary

| Method | Endpoint | Purpose | Request Body |
|---|---|---|---|
| POST | `/chain/build` | Build a chain from configuration | `ChainRequest` object |
| GET | `/chain` | Get all chain IDs for the authenticated account | None |
| GET | `/chain/{chain_id}` | Get paginated chain blocks | None |
| GET | `/chain/{chain_id}/verify` | Verify chain integrity | None |
| POST | `/chain/validate` | Validate a temporary chain without changing storage | Raw chain array |
| POST | `/chain/{chain_id}/replace` | Validate, replace, and commit a chain | Raw chain array |
| DELETE | `/chain/{chain_id}` | Destroy a chain JSON file | None |
| GET | `/chains/{account_id}/{chain_id}.json` | Read a mounted chain JSON directly | None |

---

# 1. Build Chain

## Endpoint

```http
POST /chain/build
```

Builds a chain using the supplied `ChainRequest`.

## Request Body

```json
{
  "chain_name": "atharv",
  "usage": true,
  "repos": [
    {
      "repo_id": 1
    },
    {
      "repo_id": 2
    }
  ],
  "commits": [
    {
      "repo_id": 1,
      "limit": 500
    },
    {
      "repo_id": 2,
      "limit": 100
    }
  ],
  "attacks": [
    {
      "type": "data_burning",
      "limit": 10
    },
    {
      "type": "ddos",
      "limit": 20
    }
  ],
  "custom": [
    {
      "type": "security_summary",
      "data": {
        "hello": "world"
      }
    },
    {
      "type": "deployment_state",
      "data": {
        "hello": "world"
      }
    }
  ]
}
```

## Parameters

### Body

| Field | Type | Required | Description |
|---|---|---|---|
| `chain_name` | string | Yes | Chain name |
| `usage` | boolean | Yes | Chain usage configuration |
| `repos` | array | No | Repository configuration |
| `commits` | array | No | Commit limits per repository |
| `attacks` | array | No | Attack limits by type |
| `custom` | array | No | Custom chain configuration |

### `repos`

```json
[
  {
    "repo_id": 1
  }
]
```

### `commits`

```json
[
  {
    "repo_id": 1,
    "limit": 500
  }
]
```

### `attacks`

```json
[
  {
    "type": "ddos",
    "limit": 20
  }
]
```

### `custom`

```json
[
  {
    "type": "security_summary",
    "data": {
      "hello": "world"
    }
  }
]
```

## Response

```json
{
  "chain_id": "atharv_1"
}
```

## Fetch

```javascript
const response = await fetch(
  `${API_BASE_URL}/chain/build`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      chain_name: "atharv",
      usage: true,
      repos: [
        { repo_id: 1 },
        { repo_id: 2 },
      ],
      commits: [
        { repo_id: 1, limit: 500 },
        { repo_id: 2, limit: 100 },
      ],
      attacks: [
        { type: "data_burning", limit: 10 },
        { type: "ddos", limit: 20 },
      ],
      custom: [
        {
          type: "security_summary",
          data: { hello: "world" },
        },
        {
          type: "deployment_state",
          data: { hello: "world" },
        },
      ],
    }),
  }
);

const data = await response.json();

console.log(data.chain_id);
```

---

# 2. Get All Chains

## Endpoint

```http
GET /chain
```

Returns all chain IDs stored for the authenticated account.

The backend checks:

```text
BLOCKCHAIN_MODULE/chains/{account_id}/
```

and returns the stem of every `.json` file.

## Parameters

None.

## Response

```json
{
  "chains": [
    "atharv_1",
    "deployment_1",
    "security_1"
  ]
}
```

If no chains exist:

```json
{
  "chains": []
}
```

## Fetch

```javascript
const response = await fetch(
  `${API_BASE_URL}/chain`,
  {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  }
);

const data = await response.json();

console.log(data.chains);
```

---

# 3. Get Chain

## Endpoint

```http
GET /chain/{chain_id}
```

Returns a paginated portion of a chain.

The genesis block is included in every returned page.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `chain_id` | string | Yes | Chain identifier |

Example:

```text
atharv_1
```

## Query Parameters

| Parameter | Type | Default | Minimum | Maximum |
|---|---|---:|---:|---:|
| `page` | integer | 1 | 1 | 100 |
| `limit` | integer | 10 | 1 | 100 |

Example:

```http
GET /chain/atharv_1?page=1&limit=10
```

## Response

```json
[
  {
    "index": 0,
    "type": "genesis",
    "data": {
      "account": {
        "id": 1
      }
    },
    "created_at": "2026-08-31T22:30:00Z",
    "prev": null,
    "current": "..."
  },
  {
    "index": 1,
    "type": "repository_state",
    "data": {},
    "created_at": "2026-08-31T22:31:00Z",
    "prev": "...",
    "current": "..."
  }
]
```

## Fetch

```javascript
const page = 1;
const limit = 10;

const response = await fetch(
  `${API_BASE_URL}/chain/atharv_1?page=${page}&limit=${limit}`,
  {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  }
);

const chain = await response.json();

console.log(chain);
```

---

# 4. Verify Chain

## Endpoint

```http
GET /chain/{chain_id}/verify
```

Verifies the integrity of the requested chain range.

Checks include:

- block's own SHA-256 hash
- block index sequence
- previous-block hash linkage
- genesis block requirements

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `chain_id` | string | Yes | Chain identifier |

## Query Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `target` | integer | 10 | Block/range target depending on mode |
| `mode` | string | `last` | Verification mode |

Allowed `mode` values:

```text
single
from
till
latest
full
last
```

## Examples

### Last blocks

```http
GET /chain/atharv_1/verify?mode=last&target=10
```

### Latest block

```http
GET /chain/atharv_1/verify?mode=latest
```

### Single block

```http
GET /chain/atharv_1/verify?mode=single&target=10
```

### From a block

```http
GET /chain/atharv_1/verify?mode=from&target=10
```

### Through a block

```http
GET /chain/atharv_1/verify?mode=till&target=10
```

### Full chain

```http
GET /chain/atharv_1/verify?mode=full
```

## Successful Response

```json
{
  "status": true,
  "message": "Chain verified successfully"
}
```

## Failed Response

```json
{
  "status": false,
  "message": "Block hash verification failed",
  "failure_type": "current_hash",
  "block_index": 10
}
```

Possible failure types:

```text
current_hash
previous_hash
block_index
```

## Fetch

```javascript
const response = await fetch(
  `${API_BASE_URL}/chain/atharv_1/verify?mode=full`,
  {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  }
);

const result = await response.json();

if (result.status) {
  console.log("Chain is valid");
} else {
  console.error(
    `Verification failed at block ${result.block_index}`
  );
}
```

---

# 5. Validate Temporary Chain

## Endpoint

```http
POST /chain/validate
```

Validates a complete chain supplied by the client.

This endpoint does **not**:

- require a chain ID
- load an existing chain
- modify an existing chain
- commit anything to disk

## Request Body

The request body is a **raw JSON array of blocks**.

Do not wrap the array inside:

```json
{
  "chain": [...]
}
```

Send the array directly.

Example:

```json
[
  {
    "index": 0,
    "type": "genesis",
    "data": {
      "account": {
        "id": 1
      }
    },
    "created_at": "2026-08-31T22:30:00Z",
    "prev": null,
    "current": "..."
  },
  {
    "index": 1,
    "type": "repository_state",
    "data": {},
    "created_at": "2026-08-31T22:31:00Z",
    "prev": "...",
    "current": "..."
  }
]
```

## Block Parameters

| Field | Type | Required | Description |
|---|---|---|---|
| `index` | integer | Yes | Sequential block index |
| `type` | string | Yes | Block type |
| `data` | object | Yes | Block payload |
| `created_at` | string | Yes | UTC creation timestamp |
| `prev` | string/null | Yes | Previous block hash |
| `current` | string | Yes | Current block SHA-256 hash |

## Validation Rules

The chain validation must ensure the supplied chain has the expected structure and integrity.

At minimum:

- chain must be a list
- blocks must have the expected block structure
- genesis must be the first block
- genesis must have `index: 0`
- genesis must have `type: "genesis"`
- genesis must have `prev: null`
- block indexes must be sequential
- every `prev` must match the previous block's `current`
- every `current` hash must match the calculated block hash

Invalid chain data raises a validation error and is not stored.

## Successful Response

```json
{
  "status": true,
  "message": "Chain validation successful"
}
```

## Fetch

```javascript
const temporaryChain = [
  {
    index: 0,
    type: "genesis",
    data: {
      account: {
        id: 1,
      },
    },
    created_at: "2026-08-31T22:30:00Z",
    prev: null,
    current: "...",
  },
  {
    index: 1,
    type: "repository_state",
    data: {},
    created_at: "2026-08-31T22:31:00Z",
    prev: "...",
    current: "...",
  },
];

const response = await fetch(
  `${API_BASE_URL}/chain/validate`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(temporaryChain),
  }
);

const result = await response.json();

console.log(result);
```

---

# 6. Validate, Replace, and Commit

## Endpoint

```http
POST /chain/{chain_id}/replace
```

Validates a complete replacement chain and commits it if valid.

The operation is:

```text
receive new chain
       ↓
validate structure + hashes + links
       ↓
replace InternalChain.chain
       ↓
commit()
       ↓
overwrite existing JSON
```

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `chain_id` | string | Yes | Existing chain identifier |

## Request Body

The body is a **raw JSON array**.

```json
[
  {
    "index": 0,
    "type": "genesis",
    "data": {
      "account": {
        "id": 1
      }
    },
    "created_at": "2026-08-31T22:30:00Z",
    "prev": null,
    "current": "..."
  },
  {
    "index": 1,
    "type": "repository_state",
    "data": {},
    "created_at": "2026-08-31T22:31:00Z",
    "prev": "...",
    "current": "..."
  }
]
```

## Response

The endpoint returns the result of the chain replacement operation.

A successful result should indicate that the replacement succeeded.

Example:

```json
{
  "status": true,
  "message": "Chain replaced successfully"
}
```

## Fetch

```javascript
const newChain = [
  {
    index: 0,
    type: "genesis",
    data: {
      account: {
        id: 1,
      },
    },
    created_at: "2026-08-31T22:30:00Z",
    prev: null,
    current: "...",
  },
  {
    index: 1,
    type: "repository_state",
    data: {},
    created_at: "2026-08-31T22:31:00Z",
    prev: "...",
    current: "...",
  },
];

const response = await fetch(
  `${API_BASE_URL}/chain/atharv_1/replace`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(newChain),
  }
);

const result = await response.json();

console.log(result);
```

The existing JSON file is overwritten only after the supplied chain passes validation.

---

# 7. Destroy Chain

## Endpoint

```http
DELETE /chain/{chain_id}
```

Deletes the chain JSON file belonging to the authenticated account.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `chain_id` | string | Yes | Chain identifier |

Example:

```http
DELETE /chain/atharv_1
```

## Response

Example successful response:

```json
{
  "status": true,
  "message": "Chain destroyed successfully",
  "chain_id": "atharv_1"
}
```

If the chain does not exist:

```json
{
  "status": false,
  "message": "Chain does not exist",
  "chain_id": "atharv_1"
}
```

## Fetch

```javascript
const response = await fetch(
  `${API_BASE_URL}/chain/atharv_1`,
  {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  }
);

const result = await response.json();

console.log(result);
```

---

# 8. Static Chain JSON Mount

The chain JSON directory can also be mounted as a FastAPI static directory.

## FastAPI Configuration

Because the application is started after:

```powershell
cd backend
```

the relative directory is:

```python
blockchain_dir = Path("BLOCKCHAIN_MODULE")
chains_dir = blockchain_dir / "chains"
```

Mount it with:

```python
from pathlib import Path
from fastapi.staticfiles import StaticFiles

blockchain_dir = Path("BLOCKCHAIN_MODULE")
chains_dir = blockchain_dir / "chains"

chains_dir.mkdir(parents=True, exist_ok=True)

app.mount(
    "/chains",
    StaticFiles(directory=chains_dir),
    name="chains",
)
```

## Directory Mapping

Filesystem:

```text
BLOCKCHAIN_MODULE/
└── chains/
    └── 1/
        └── atharv_1.json
```

Static URL:

```text
/chains/1/atharv_1.json
```

Full URL when running locally:

```text
http://localhost:8000/chains/1/atharv_1.json
```

## Static Fetch

```javascript
const response = await fetch(
  `${API_BASE_URL}/chains/1/atharv_1.json`
);

const chain = await response.json();

console.log(chain);
```

## Static URL Construction

If the frontend already knows the account ID and chain ID:

```javascript
const accountId = 1;
const chainId = "atharv_1";

const chainUrl =
  `${API_BASE_URL}/chains/${accountId}/${chainId}.json`;

const response = await fetch(chainUrl);
const chain = await response.json();
```

## Important

The static mount is a direct file server. It does not execute:

```python
auth.deps.get_current
```

and does not perform the same application-level authorization as the `/chain/...` API routes.

Therefore, use the static mount only when direct read access to the mounted JSON files is acceptable.

For account-private blockchain data, prefer the authenticated API:

```http
GET /chain/{chain_id}
```

---

# Chain Block Structure

Every stored block follows this structure:

```json
{
  "index": 0,
  "type": "genesis",
  "data": {},
  "created_at": "2026-08-31T22:30:00Z",
  "prev": null,
  "current": "..."
}
```

## Fields

| Field | Description |
|---|---|
| `index` | Sequential block index |
| `type` | Block type |
| `data` | Block payload |
| `created_at` | UTC block creation timestamp |
| `prev` | Previous block's `current` hash |
| `current` | SHA-256 hash calculated from the block excluding `current` |

The genesis block is always the first block:

```json
{
  "index": 0,
  "type": "genesis",
  "data": {},
  "created_at": "2026-08-31T22:30:00Z",
  "prev": null,
  "current": "..."
}
```

---

# Pagination

The chain read endpoint supports:

```text
page: 1-100
limit: 1-100
```

Defaults:

```text
page = 1
limit = 10
```

Example:

```http
GET /chain/atharv_1?page=2&limit=20
```

The genesis block is returned along with every page.

---

# Verification Modes

| Mode | Purpose |
|---|---|
| `single` | Verify one non-genesis block and its predecessor |
| `from` | Verify from the target block through the latest block |
| `till` | Verify from genesis through the target block |
| `full` | Verify the entire chain |
| `last` | Verify the requested number of latest blocks |
| `latest` | Verify only the latest block and its predecessor |

Examples:

```text
/chain/atharv_1/verify?mode=single&target=10
/chain/atharv_1/verify?mode=from&target=10
/chain/atharv_1/verify?mode=till&target=10
/chain/atharv_1/verify?mode=full
/chain/atharv_1/verify?mode=last&target=10
/chain/atharv_1/verify?mode=latest
```

---

# Frontend Error Handling

Always inspect the HTTP response before assuming the request succeeded.

```javascript
const response = await fetch(url, options);
const data = await response.json();

if (!response.ok) {
  console.error("API error:", data);
  throw new Error("Request failed");
}

return data;
```

FastAPI validation errors can look like:

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": [
        "body",
        "chain_name"
      ],
      "msg": "Field required"
    }
  ]
}
```

For `/chain/{chain_id}`, `page` and `limit` must both be between `1` and `100`.

Invalid examples:

```text
page=0
page=101
limit=0
limit=101
```

---

# Recommended Frontend Flows

## Build and Read

```text
POST /chain/build
       ↓
receive chain_id
       ↓
GET /chain/{chain_id}
```

## List and Read

```text
GET /chain
       ↓
select chain_id
       ↓
GET /chain/{chain_id}?page=1&limit=10
```

## Verify

```text
GET /chain/{chain_id}/verify?mode=full
```

## Validate Before Replace

```text
temporary chain
       ↓
POST /chain/validate
       ↓
valid
       ↓
POST /chain/{chain_id}/replace
       ↓
stored JSON overwritten
```

## Direct Static Read

```text
/chains/{account_id}/{chain_id}.json
```

Use this only where direct static access is appropriate.

## Delete

```text
DELETE /chain/{chain_id}
```

---

# Complete Frontend Helper Example

```javascript
const API_BASE_URL = "http://localhost:8000";
const accessToken = "YOUR_ACCESS_TOKEN";

const headers = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${accessToken}`,
};


async function buildChain(config) {
  const response = await fetch(
    `${API_BASE_URL}/chain/build`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(config),
    }
  );

  return await response.json();
}


async function getChains() {
  const response = await fetch(
    `${API_BASE_URL}/chain`,
    {
      method: "GET",
      headers,
    }
  );

  return await response.json();
}


async function getChain(
  chainId,
  page = 1,
  limit = 10
) {
  const response = await fetch(
    `${API_BASE_URL}/chain/${chainId}?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers,
    }
  );

  return await response.json();
}


async function verifyChain(
  chainId,
  mode = "last",
  target = 10
) {
  const response = await fetch(
    `${API_BASE_URL}/chain/${chainId}/verify?mode=${mode}&target=${target}`,
    {
      method: "GET",
      headers,
    }
  );

  return await response.json();
}


async function validateChain(chain) {
  const response = await fetch(
    `${API_BASE_URL}/chain/validate`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(chain),
    }
  );

  return await response.json();
}


async function replaceChain(
  chainId,
  chain
) {
  const response = await fetch(
    `${API_BASE_URL}/chain/${chainId}/replace`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(chain),
    }
  );

  return await response.json();
}


async function destroyChain(chainId) {
  const response = await fetch(
    `${API_BASE_URL}/chain/${chainId}`,
    {
      method: "DELETE",
      headers,
    }
  );

  return await response.json();
}


async function getStaticChain(
  accountId,
  chainId
) {
  const response = await fetch(
    `${API_BASE_URL}/chains/${accountId}/${chainId}.json`
  );

  return await response.json();
}
```

---

# Quick Reference

```text
POST   /chain/build
GET    /chain
GET    /chain/{chain_id}
GET    /chain/{chain_id}/verify
POST   /chain/validate
POST   /chain/{chain_id}/replace
DELETE /chain/{chain_id}

GET    /chains/{account_id}/{chain_id}.json
```
