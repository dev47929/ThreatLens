import httpx 
import json
from analysis import (
    CommitAnalyzer,
    RepositoryAnalyzer,
)

from db import get_jwt
from repo import Repository
from config import config
jwt = get_jwt()


def build_repo(repo: Repository, jwt: str):

    if not jwt:
        raise RuntimeError("JWT token not found")

    structure = RepositoryAnalyzer(repo)
    data = structure.analyze().to_dict()

    response = httpx.post(
        f"{config.BASE_URL}/repo",
        json={"data": data},
        headers={
            "Authorization": f"Bearer {jwt}",
        },
        timeout=30.0,
    )

    response.raise_for_status()
    return response.json()


def fetch_latest_commit(repo_id: int, jwt: str):
    if not jwt:
        raise RuntimeError("JWT token not found")
    
    response = httpx.get(
        f"{config.BASE_URL}/repo/{repo_id}/commits?limit=1",
        headers={
            "Authorization": f"Bearer {jwt}",
        },
        timeout=30.0,
    )
    response.raise_for_status()
    res = response.json()
    return res["data"][0]["commit"]["sha"]



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
        return{"status" : "Already upto date"}

    if not jwt:
        raise RuntimeError("JWT token not found")

    response = httpx.post(
        f"{config.BASE_URL}/repo/{repo_id}/commits",
        json={
            "data": commits,
        },
        headers={
            "Authorization": f"Bearer {jwt}",
        },
        timeout=30.0,
    )

    response.raise_for_status()
    return response.json()

def save_commits(url: str):
    repo = Repository(url)
    response = build_repo(repo=repo, jwt=jwt)
    if response["status"] == "created":
        commits= build_commit_insert(repo=repo, sha=None)
        return insert_commits(repo_id=response["repo_id"],commits=commits,jwt=jwt)
    
    elif response["status"] == "already_up_to_date":
        return {
            "status" : "Already upto date",
            "count" : None
        }
    
    else : 
        sha = fetch_latest_commit(repo_id=response["repo_id"], jwt= jwt)
        commits= build_commit_insert(repo=repo, sha=sha)
        return insert_commits(repo_id=response["repo_id"],commits=commits,jwt=jwt)


"""
return of inserst_commits when called api to insert
    return {
        "status": "stored",
        "count": len(request.data),
    }
"""