# Usage API Routes

Base URL:

- https://api.codesena.me

These routes are defined in `backend/SITE_MODULE/api/usage_route.py` and are mounted under the `/usage` prefix.

---

## 1) Get account usage

### GET /usage

Returns the current usage record for the authenticated account.

#### Parameters

No query parameters.

#### Request body

No request body.

#### Response

```json
{
  "id": 1,
  "account_id": 3,
  "prompt_tokens": 1200,
  "completion_tokens": 800,
  "plan": "pro"
}
```

The response shape depends on the database model and may include `null` values for some fields.

#### Sample fetch

```js
fetch(`${BASE_URL}/usage`, {
  headers: {
    "Authorization": "Bearer <token>"
  }
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

## 2) Update account usage

### PUT /usage

Updates the usage counters for the authenticated account and optionally sets the plan.

#### Parameters

No query parameters.

#### Request body

```json
{
  "prompt_tokens": 1200,
  "completion_tokens": 800,
  "plan": "pro"
}
```

Fields:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| prompt_tokens | integer | Yes | Prompt usage count |
| completion_tokens | integer | Yes | Completion usage count |
| plan | string | No | Optional plan label, e.g. `free`, `pro`, `proplus` |

#### Response

```json
{
  "status": "usage synced"
}
```

#### Sample fetch

```js
fetch(`${BASE_URL}/usage`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <token>"
  },
  body: JSON.stringify({
    prompt_tokens: 1200,
    completion_tokens: 800,
    plan: "pro"
  })
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

## Notes

- These routes depend on the authenticated account context.
- `Authorization: Bearer <token>` is required for both endpoints.
- The actual usage record is stored in the database and returned by the usage service.
