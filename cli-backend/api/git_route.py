
from fastapi import APIRouter, HTTPException
import httpx
from pydantic import BaseModel
from service.repo_service import save_commits

router = APIRouter(prefix="/git", tags=["Git"])

class RepoRequest(BaseModel):
    url: str


@router.patch("/build")
def analyze_repo(data: RepoRequest):
    try:
        return save_commits(data.url)
    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text
        try:
            parsed = exc.response.json()
            detail = parsed.get("detail", parsed.get("message", detail))
        except Exception:
            pass
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"Upstream Git analysis error ({exc.response.status_code}): {detail}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Repository analysis failed: {str(exc)}",
        )