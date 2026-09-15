import uvicorn
from pathlib import Path
from connect import auth
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware


from GIT_MODULE.api import git_router
from SITE_MODULE.api import site_router
from BLOCKCHAIN_MODULE.api import chain_router
from SECURITY_CHAT_MODULE.api import security_chat_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

blockchain_dir = Path("BLOCKCHAIN_MODULE")
chains_dir = blockchain_dir / "chains"
chains_dir.mkdir(parents=True, exist_ok=True)


app.mount(
    "/chains",
    StaticFiles(directory=chains_dir),
    name="chains",
)


auth.include_routes(app)
print("REGISTERING REPO ROUTER", id(app), id(git_router), id(site_router), id(chain_router), id(security_chat_router))
app.include_router(git_router)
app.include_router(site_router)
app.include_router(chain_router)
app.include_router(security_chat_router)



if __name__ == "__main__":
    uvicorn.run(
        "run:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )