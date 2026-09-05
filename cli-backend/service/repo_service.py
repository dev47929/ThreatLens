import httpx 
import json
from analysis import (
    CommitAnalyzer,
    RepositoryAnalyzer,
)

from fastapi import HTTPException
from db import get_jwt
from repo import Repository
from config import config


def build_repo(repo: Repository, jwt: str):
    if not jwt:
        raise HTTPException(
            status_code=401,
            detail="JWT token not found. Please authenticate first via /password/login or OAuth.",
        )

    structure = RepositoryAnalyzer(repo)
    data = structure.analyze().to_dict()

    response = httpx.post(
        f"{config.BASE_URL}/repo",
        json={"data": data},
        headers={
            "Authorization": f"Bearer {jwt}",
        },
        timeout=60.0,
    )

    response.raise_for_status()
    return response.json()


def fetch_latest_commit(repo_id: int, jwt: str) -> str | None:
    if not jwt:
        raise HTTPException(
            status_code=401,
            detail="JWT token not found",
        )
    
    response = httpx.get(
        f"{config.BASE_URL}/repo/{repo_id}/commits?limit=1",
        headers={
            "Authorization": f"Bearer {jwt}",
        },
        timeout=30.0,
    )
    response.raise_for_status()
    res = response.json()
    data = res.get("data", [])
    if not data or not isinstance(data, list):
        return None
    return data[0].get("commit", {}).get("sha")



def build_commit_insert(repo: Repository, sha: str | None):
    commits = repo.list_commits()
    analyzer = CommitAnalyzer(repo)

    if sha is None:
        commits_to_analyze = commits

    else:
        for index, commit in enumerate(commits):
            if commit["sha"] == sha:
                commits_to_analyze = commits[:index]
                break
        else:
            return None

        if not commits_to_analyze:
            return None

    return [
        json.loads(
            analyzer.analyze_json(commit["sha"])
        )
        for commit in commits_to_analyze
    ]


def insert_commits(repo_id: int, commits: list[dict], jwt: str):
    if not commits:
        return {"status": "Already upto date"}

    if not jwt:
        raise HTTPException(
            status_code=401,
            detail="JWT token not found",
        )

    response = httpx.post(
        f"{config.BASE_URL}/repo/{repo_id}/commits",
        json={
            "data": commits,
        },
        headers={
            "Authorization": f"Bearer {jwt}",
        },
        timeout=60.0,
    )

    response.raise_for_status()
    return response.json()


def save_commits(url: str):
    jwt = get_jwt()
    if not jwt:
        raise HTTPException(
            status_code=401,
            detail="JWT token not found in local session. Please authenticate first.",
        )

    repo = Repository(url)
    try:
        response = build_repo(repo=repo, jwt=jwt)
        status = response.get("status")

        if status == "created":
            commits = build_commit_insert(repo=repo, sha=None)
            return insert_commits(repo_id=response["repo_id"], commits=commits, jwt=jwt)
        
        elif status == "already_up_to_date":
            return {
                "status": "Already upto date",
                "count": None,
            }
        
        else:
            sha = fetch_latest_commit(repo_id=response["repo_id"], jwt=jwt)
            commits = build_commit_insert(repo=repo, sha=sha)
            return insert_commits(repo_id=response["repo_id"], commits=commits, jwt=jwt)
    finally:
        repo.close()


"""
return of inserst_commits when called api to insert
    return {
        "status": "stored",
        "count": len(request.data),
    }
"""