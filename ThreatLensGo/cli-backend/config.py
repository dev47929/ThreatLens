import os
from pathlib import Path
from dotenv import load_dotenv

# Search for .env in current dir, parent dir (ThreatLensGo), sibling tui/.env, and root cli-backend
_current_dir = Path(__file__).resolve().parent
_candidates = [
    _current_dir / ".env",
    _current_dir.parent / ".env",
    _current_dir.parent / "tui" / ".env",
    _current_dir.parent.parent / "cli-backend" / ".env",
    _current_dir.parent.parent / ".env",
]
for _env_path in _candidates:
    if _env_path.exists():
        load_dotenv(dotenv_path=_env_path, override=False)


import json

# Check for saved preferences in ~/.threatlensgo/config.json
_threatlens_config_file = Path.home() / ".threatlensgo" / "config.json"
_saved_llm_conf = {}
if _threatlens_config_file.exists():
    try:
        with open(_threatlens_config_file, "r", encoding="utf-8") as _f:
            _user_conf = json.load(_f)
            _saved_llm_conf = _user_conf.get("llm", {})
    except Exception:
        pass


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

    CUSTOM_URL = (
        os.getenv("CUSTOM_LLM_URL")
        or _saved_llm_conf.get("custom_base_url")
        or "http://localhost:11434/v1"
    )
    CUSTOM_API_KEY = (
        os.getenv("CUSTOM_LLM_API_KEY")
        if os.getenv("CUSTOM_LLM_API_KEY") is not None
        else _saved_llm_conf.get("custom_api_key", "")
    )
    CUSTOM_DEFAULT_MODEL = (
        os.getenv("CUSTOM_LLM_MODEL")
        or _saved_llm_conf.get("custom_model")
        or "llama3"
    )

    ACTIVE_PROVIDER = (
        os.getenv("LLM_PROVIDER")
        or _saved_llm_conf.get("provider")
    )

    # Intelligently select active provider based on configured credentials or preference
    if ACTIVE_PROVIDER == "custom" and CUSTOM_URL:
        LLM_PROVIDER_BASE_URL = CUSTOM_URL
        LLM_PROVIDER_API_KEY = CUSTOM_API_KEY
        DEFAULT_MODEL = CUSTOM_DEFAULT_MODEL
    elif ACTIVE_PROVIDER == "groq" and GROQ_API_KEY:
        LLM_PROVIDER_BASE_URL = GROQ_URL
        LLM_PROVIDER_API_KEY = GROQ_API_KEY
        DEFAULT_MODEL = GROQ_DEFAULT_MODEL
    elif ACTIVE_PROVIDER == "openrouter" and OPEN_ROUTER_API_KEY:
        LLM_PROVIDER_BASE_URL = OPEN_ROUTER_URL
        LLM_PROVIDER_API_KEY = OPEN_ROUTER_API_KEY
        DEFAULT_MODEL = OPEN_ROUTER_DEFAULT_MODEL
    elif OPEN_ROUTER_API_KEY:
        LLM_PROVIDER_BASE_URL = OPEN_ROUTER_URL
        LLM_PROVIDER_API_KEY = OPEN_ROUTER_API_KEY
        DEFAULT_MODEL = OPEN_ROUTER_DEFAULT_MODEL
    elif GROQ_API_KEY:
        LLM_PROVIDER_BASE_URL = GROQ_URL
        LLM_PROVIDER_API_KEY = GROQ_API_KEY
        DEFAULT_MODEL = GROQ_DEFAULT_MODEL
    elif _saved_llm_conf.get("custom_base_url"):
        LLM_PROVIDER_BASE_URL = CUSTOM_URL
        LLM_PROVIDER_API_KEY = CUSTOM_API_KEY
        DEFAULT_MODEL = CUSTOM_DEFAULT_MODEL
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
    "custom": {
        "url": config.CUSTOM_URL,
        "api_key": config.CUSTOM_API_KEY,
        "default_model": config.CUSTOM_DEFAULT_MODEL,
    },
}