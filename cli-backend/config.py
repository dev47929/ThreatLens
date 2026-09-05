import os
from dotenv import load_dotenv
load_dotenv()


class Config:
    BASE_URL = os.getenv("BASE_URL", "https://api.codesena.me")
    AUTH_BASE_URL = f"{BASE_URL}/tc-auth"

    DB_PATH = "local.db"
    SQLITE_TIMEOUT = 30.0

    GROQ_URL = "https://api.groq.com/openai/v1"
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GROQ_DEFAULT_MODEL = os.getenv("GROQ_DEFAULT_MODEL")

    OPEN_ROUTER_URL = "https://openrouter.ai/api/v1"
    OPEN_ROUTER_API_KEY = os.getenv("OPEN_ROUTER_API_KEY")
    OPEN_ROUTER_DEFAULT_MODEL = os.getenv("OPEN_ROUTER_DEFAULT_MODEL")

    LLM_PROVIDER_BASE_URL = OPEN_ROUTER_URL
    LLM_PROVIDER_API_KEY = OPEN_ROUTER_API_KEY
    DEFAULT_MODEL = OPEN_ROUTER_DEFAULT_MODEL

    PLAN = {
        "free": 1,
        "pro": 2,
        "proplus": 3,
        "proplus1": 4,
        "proplus2": 5,
    }


config = Config()


PROVIDERS = {
    "groq": {
        "url": config.GROQ_URL,
        "api_key": config.GROQ_API_KEY,
        "default_model": config.GROQ_DEFAULT_MODEL,
    },
    "openrouter": {
        "url": config.OPEN_ROUTER_URL,
        "api_key": config.OPEN_ROUTER_API_KEY,
        "default_model": config.OPEN_ROUTER_DEFAULT_MODEL,
    },
}