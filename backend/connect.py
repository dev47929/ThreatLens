# from tc_auth.auth import Auth
from sqlalchemy import create_engine
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from tc_auth import Auth 
from fastapi import FastAPI
from config import config
from tc_auth.db import create_session_factory , Base
# from SITE_MODULE.db import Chat , ChatHistory , Usage


engine = create_engine("postgresql://workspace:admin@localhost:5432/tc_auth", echo=False)

app = FastAPI()
auth = Auth(engine, app)
session_factory = create_session_factory(engine=engine)


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

auth.jwt.config(
    secret_key=config.JWT_SECRET_KEY,
    algorithm=config.JWT_ALGORITHM,
    session_duration_days=config.JWT_SESSION_DURATION_DAYS,
)


auth.email.config(
    host=config.EMAIL_HOST,
    port=config.EMAIL_PORT,
    username=config.EMAIL_USERNAME,
    password=config.EMAIL_PASSWORD,
    sender=config.EMAIL_SENDER,
    use_tls=config.EMAIL_USE_TLS,
)


auth.google.config(
    client_id=config.GOOGLE_CLIENT_ID,
    client_secret=config.GOOGLE_CLIENT_SECRET,
    redirect_uri=config.GOOGLE_REDIRECT_URI,
)


auth.github.config(
    client_id=config.GITHUB_CLIENT_ID,
    client_secret=config.GITHUB_CLIENT_SECRET,
    redirect_uri=config.GITHUB_REDIRECT_URI,
)


def init():
    from SITE_MODULE.db import Chat , ChatHistory , Usage , Attack
    from GIT_MODULE.db import Commit , Repo
    Base.metadata.create_all(
        bind=engine,
    )


def destroy():
    from SITE_MODULE.db import Chat , ChatHistory , Usage , Attack
    from GIT_MODULE.db import Commit , Repo
    Base.metadata.drop_all(
        bind=engine,
    )

