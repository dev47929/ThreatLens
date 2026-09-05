from fastapi import APIRouter , HTTPException
from fastapi.responses import RedirectResponse
from config import config
from service.auth_service import oauth_callback , password_login
from pydantic import BaseModel


class PasswordLoginRequest(BaseModel):
    identifier : str 
    password : str 

router = APIRouter()



@router.post("/password/login")
def pass_login(body: PasswordLoginRequest):
   return password_login(identifier=body.identifier, password=body.password)



@router.get("/{provider}/login")
def oauth_login(provider):
    if provider not in ("google","github"):
        raise HTTPException(status_code=404 , detail=f"invalid provider : {provider}")
    return RedirectResponse(
        f"{config.AUTH_BASE_URL}/{provider}/login"
        "?frontend_url=http://localhost:1234"
    )


@router.get("/oauth/callback")
def callback(access_token: str):
    return oauth_callback(access_token=access_token)

