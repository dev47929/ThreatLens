from datetime import datetime
from utils.get_helper import to_list_dict
from GIT_MODULE.db import Repo
from connect import session_factory


def upsert_repository(
    account_id: int,
    data: dict,
) -> dict:
    
    db = session_factory()
    repository = data["repository"]
    files = data["files"]
    languages = data["languages"]

    existing = (
        db.query(Repo)
        .filter(
            Repo.url == repository["url"]
        )
        .first()
    )

    if existing is None:

        repo = Repo(
            account_id=account_id,

            url=repository["url"],
            username=repository["username"],
            name=repository["name"],
            default_branch=repository["default_branch"],
            branches=repository["branches"],
            remote_branches=repository["remote_branches"],
            commit_count=repository["commit_count"],

            files_total=files["total"],
            files_by_extension=files["by_extension"],
            total_size=files["total_size"],
            largest_files=files["largest_files"],

            language_files=languages["files"],
            languages=languages["extensions"],

            tags=data["tags"],
        )

        db.add(repo)
        db.commit()
        db.refresh(repo)

        return {
            "status": "created",
            "repo_id": repo.id,
        }

    fields = {
        "account_id": account_id,
        "username": repository["username"],
        "name": repository["name"],
        "default_branch": repository["default_branch"],
        "branches": repository["branches"],
        "remote_branches": repository["remote_branches"],
        "commit_count": repository["commit_count"],
        "files_total": files["total"],
        "files_by_extension": files["by_extension"],
        "total_size": files["total_size"],
        "largest_files": files["largest_files"],
        "language_files": languages["files"],
        "languages": languages["extensions"],
        "tags": data["tags"],
    }

    changed = False

    for field, value in fields.items():
        if getattr(existing, field) != value:
            setattr(existing, field, value)
            changed = True

    if not changed:
        return {
            "status": "already_up_to_date",
            "repo_id": existing.id,
        }

    existing.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(existing)

    return {
        "status": "updated",
        "repo_id": existing.id,
    }


def get_repositories(
    account_id: int,
    repo_id: int | None = None,
    page: int = 1,
    limit: int = 10,
) -> list[dict]:

    db = session_factory()

    query = db.query(Repo)

    if repo_id:
        query = query.filter(Repo.id == repo_id)
    else:
        query = query.filter(Repo.account_id == account_id)

    offset = (page - 1) * limit

    repositories = (
        query
        .offset(offset)
        .limit(limit)
        .all()
    )

    return to_list_dict(repositories)
