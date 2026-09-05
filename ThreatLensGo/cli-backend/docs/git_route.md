# Git API Route

Base URL for local CLI usage:

- http://localhost:1234

This route is defined in `cli-backend/api/git_route.py` and is mounted under the `/git` prefix.

---

## 1) Build and analyze a repository

### PATCH /git/build

Analyzes a repository URL, builds repo metadata, and inserts the commit history into the upstream backend.

#### Parameters

No query parameters.

#### Request body

```json
{
  "url": "https://github.com/owner/repository.git"
}
```

Fields:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| url | string | Yes | Git repository URL to analyze |

#### Response

The response varies depending on whether the repository is newly created, already up to date, or needs only new commits.

Example success payload:

```json
{
  "status": "stored",
  "count": 12
}
```

Example already-up-to-date payload:

```json
{
  "status": "Already upto date",
  "count": null
}
```

The route ultimately calls the repo analysis service and then posts commit data to the backend repository API.

#### Sample fetch

```js
fetch("http://localhost:1234/git/build", {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    url: "https://github.com/owner/repository.git"
  })
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

## Behavior summary

The route:

1. Accepts a repo URL from the request body.
2. Opens the repository locally for analysis.
3. Sends repository structure metadata to the backend.
4. Determines whether there are new commits to insert.
5. Returns the backend result, usually with a `status` and count.

---

## Notes

- The repo flow depends on a valid logged-in session and saved JWT in the CLI environment.
- This endpoint is intended for repository import, metadata analysis, and commit sync rather than direct Git operations.
- The exact upstream response depends on backend repo logic and the repository contents.
