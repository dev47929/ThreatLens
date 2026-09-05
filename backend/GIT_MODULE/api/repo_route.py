from GIT_MODULE.ai.builder import ai_call_stream
from fastapi import APIRouter, Query, Depends
from GIT_MODULE.repo import Repository
from GIT_MODULE.ai import ai_call 
from GIT_MODULE.ai.builder import ai_call_stream
from fastapi.responses import StreamingResponse
from connect import auth

from GIT_MODULE.service import (
    store_commit_analysis,
    get_commit_analysis,
    upsert_repository,
    get_repositories,
)


from .schema import (
    RepositoryUpsertRequest,
    RepositoryUpsertResponse,
    RepositoryResponse,
    CommitAnalysisRequest,
    CommitAnalysisResponse,
    CommitAnalysisListResponse,
    AICommitAnalysisRequest
)


router = APIRouter(
    prefix="/repo",
    tags=["Repositories"],
)


# REPO ROUTES

@router.post(
    "",
    response_model=RepositoryUpsertResponse,
)
def upsert_repository_api(
    request: RepositoryUpsertRequest,
    account=Depends(auth.deps.get_current),
):
    return upsert_repository(
        account_id=account["account"]["id"],
        data=request.data,
    )


@router.get(
    "",
    response_model=list[RepositoryResponse],
)
def get_repositories_api(
    repo_id: int | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    account=Depends(auth.deps.get_current),
):
    return get_repositories(
        account_id=account["account"]["id"],
        repo_id=repo_id,
        page=page,
        limit=limit,
    )


# COMMITS ROUTES

@router.get(
    "/{repo_id}/commits",
    response_model=CommitAnalysisListResponse,
)
def get_raw_commit_analysis(
    repo_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    account=Depends(auth.deps.get_current),
):
    data = get_commit_analysis(
        repo_id=repo_id,
        page=page,
        limit=limit,
    )

    return {
        "page": page,
        "limit": limit,
        "data": data,
    }


@router.post(
    "/{repo_id}/commits",
    response_model=CommitAnalysisResponse,
)
def store_raw_commit_analysis(
    repo_id: int,
    request: CommitAnalysisRequest,
    account=Depends(auth.deps.get_current),
):
    store_commit_analysis(
        data=request.data,
        repo_id=repo_id,
    )

    return {
        "status": "stored",
        "count": len(request.data),
    }


@router.post("/commit/analysis")
async def ai_commit_analysis(
    request: AICommitAnalysisRequest,
):
    sha = request.analysis["commit"]["sha"]

    repo = Repository(request.url)
    diff = repo.diff(sha)

    if request.stream:
        return StreamingResponse(
            ai_call_stream(
                diffs=diff,
                raw_analysis=request.analysis,
            ),
            media_type="application/x-ndjson",
        )

    response = await ai_call(
        diffs=diff,
        raw_analysis=request.analysis,
    )

    return {
        "diff": diff,
        "response": response,
    }

