import os
from pathlib import Path
from dotenv import load_dotenv

# Search for .env in current dir, parent dir (ThreatLensGo), sibling tui/.env, and root cli-backend
_current_dir = Path(__file__).resolve().parent
_candidates = [
    _current_dir / ".env",
    _current_dir.parent / ".env",
    _current_dir.parent / "ThreatLensGo" / "cli-backend" / ".env",
    _current_dir.parent / "ThreatLensGo" / "tui" / ".env",
    _current_dir.parent / ".env",
]
for _env_path in _candidates:
    if _env_path.exists():
        load_dotenv(dotenv_path=_env_path, override=False)


class Config:
    BASE_URL = os.getenv("BASE_URL", "https://api.codesena.me")
    AUTH_BASE_URL = f"{BASE_URL}/tc-auth"

    DB_PATH = "local.db"
    SQLITE_TIMEOUT = 30.0

    GROQ_URL = "https://api.groq.com/openai/v1"
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GROQ_DEFAULT_MODEL = os.getenv("GROQ_DEFAULT_MODEL", "llama-3.3-70b-versatile")

    OPEN_ROUTER_URL = "https://openrouter.ai/api/v1"
    OPEN_ROUTER_API_KEY = os.getenv("OPEN_ROUTER_API_KEY") or os.getenv("OPENROUTER_API_KEY")
    OPEN_ROUTER_DEFAULT_MODEL = (
        os.getenv("OPEN_ROUTER_DEFAULT_MODEL")
        or os.getenv("LLM_MODEL")
        or "nvidia/nemotron-3-super-120b-a12b:free"
    )

    # Intelligently select active provider based on configured credentials
    if OPEN_ROUTER_API_KEY:
        LLM_PROVIDER_BASE_URL = OPEN_ROUTER_URL
        LLM_PROVIDER_API_KEY = OPEN_ROUTER_API_KEY
        DEFAULT_MODEL = OPEN_ROUTER_DEFAULT_MODEL
    elif GROQ_API_KEY:
        LLM_PROVIDER_BASE_URL = GROQ_URL
        LLM_PROVIDER_API_KEY = GROQ_API_KEY
        DEFAULT_MODEL = GROQ_DEFAULT_MODEL
    else:
        LLM_PROVIDER_BASE_URL = OPEN_ROUTER_URL
        LLM_PROVIDER_API_KEY = None
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
    "openrouter": {
        "url": config.OPEN_ROUTER_URL,
        "api_key": config.OPEN_ROUTER_API_KEY,
        "default_model": config.OPEN_ROUTER_DEFAULT_MODEL,
    },
    "groq": {
        "url": config.GROQ_URL,
        "api_key": config.GROQ_API_KEY,
        "default_model": config.GROQ_DEFAULT_MODEL,
    },
}