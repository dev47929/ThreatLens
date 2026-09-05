import uvicorn

from connect import app
from GIT_MODULE.api import git_router
from SITE_MODULE.api import site_router
from BLOCKCHAIN_MODULE.api import chain_router



def create_app():
    print("REGISTERING REPO ROUTER", id(app), id(git_router), id(site_router), id(chain_router))
    app.include_router(git_router)
    app.include_router(site_router)
    app.include_router(chain_router)
    return app


if __name__ == "__main__":
    create_app()

    uvicorn.run(
        "run:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )