# from tc_auth.auth import Auth
from sqlalchemy import create_engine
from tc_auth import Auth 
from config import config
from tc_auth.db import create_session_factory , Base
# from SITE_MODULE.db import Chat , ChatHistory , Usage


engine = create_engine("postgresql://workspace:admin@localhost:5432/tc_auth", echo=False)

auth = Auth(engine)
session_factory = create_session_factory(engine=engine)


auth.jwt.config(
    secret_key=config.JWT_SECRET_KEY,
    algorithm=config.JWT_ALGORITHM,
    session_duration_days=config.JWT_SESSION_DURATION_DAYS,
    dual_token_mode=False
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
    from BLOCKCHAIN_MODULE.db import  EthereumAnchor
    Base.metadata.create_all(
        bind=engine,
    )


def destroy():
    from SITE_MODULE.db import Chat , ChatHistory , Usage , Attack
    from GIT_MODULE.db import Commit , Repo
    from BLOCKCHAIN_MODULE.db import  EthereumAnchor

    Base.metadata.drop_all(
        bind=engine,
    )

