# Auth API Routes

Base URL for local CLI usage:

- http://localhost:1234

For production or remote backend usage, the CLI also targets:

- https://api.codesena.me

These routes are defined in `cli-backend/api/auth_route.py` and are mounted at the root of the FastAPI app.

---

## 1) Health check

### GET /pulse

Checks whether the auth service is live.

#### Parameters

No query parameters.

#### Request body

No request body.

#### Response

Example JSON:

```json
{
  "status": "Live",
  "connect": true
}
```

#### Sample fetch

```js
fetch("http://localhost:1234/pulse")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

## 2) Password login

### POST /password/login

Authenticates a user with identifier + password and stores the returned JWT in the CLI database.

#### Parameters

No query parameters.

#### Request body

```json
{
  "identifier": "user@example.com",
  "password": "secret-password"
}
```

#### Response

Example JSON:

```json
{
  "status": "logged in"
}
```

If the upstream auth server does not return an access token, the route raises a `400` error with:

```json
{
  "detail": "login failed"
}
```

#### Sample fetch

```js
fetch("http://localhost:1234/password/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    identifier: "user@example.com",
    password: "secret-password"
  })
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

## 3) OAuth login redirect

### GET /{provider}/login

Starts the OAuth flow for a supported provider.

#### Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| provider | string | Yes | Supported values: `google`, `github` |

#### Request body

No request body.

#### Response

This endpoint returns a redirect response to the configured auth provider.

Example redirect target:

```text
https://api.codesena.me/tc-auth/google/login?frontend_url=http://localhost:1234
```

If an invalid provider is used, the API responds with a `404` and a detail message:

```json
{
  "detail": "invalid provider : microsoft"
}
```

#### Sample fetch

```js
fetch("http://localhost:1234/google/login", {
  method: "GET",
  redirect: "manual"
})
  .then((res) => {
    console.log(res.status);
    console.log(res.headers.get("location"));
  });
```

---

## 4) OAuth callback

### GET /oauth/callback

Completes the OAuth login by accepting the access token, saving it locally, and returning a login confirmation.

#### Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| access_token | string | Yes | OAuth access token returned by the auth provider |

#### Request body

No request body.

#### Response

Example JSON:

```json
{
  "status": "logged in"
}
```

If `access_token` is missing, the route raises a `400` error:

```json
{
  "detail": "unable to verify account"
}
```

#### Sample fetch

```js
fetch("http://localhost:1234/oauth/callback?access_token=example_token")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

## Notes

- `POST /password/login` stores the JWT returned by the external auth server.
- `GET /{provider}/login` is intended to redirect the browser to the provider login page.
- The CLI backend saves the token locally and reuses it for chat and repository-related requests.
