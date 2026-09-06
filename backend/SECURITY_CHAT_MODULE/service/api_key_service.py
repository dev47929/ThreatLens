import json
import os
import secrets
import time
from pathlib import Path
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

KEYS_FILE = Path(__file__).resolve().parent.parent / "streaming_api_keys.json"
DEFAULT_ENV_KEY = os.getenv("STREAMING_API_KEY", "tl_stream_threatlens_secure_live_key_2026")

# In-memory registry of active API keys
_KEY_REGISTRY: dict[str, dict] = {}


def _load_keys_from_disk():
    global _KEY_REGISTRY
    if KEYS_FILE.exists():
        try:
            with open(KEYS_FILE, "r", encoding="utf-8") as f:
                _KEY_REGISTRY = json.load(f)
        except Exception:
            _KEY_REGISTRY = {}

    # Ensure default streaming key exists in registry
    if DEFAULT_ENV_KEY and DEFAULT_ENV_KEY not in _KEY_REGISTRY:
        _KEY_REGISTRY[DEFAULT_ENV_KEY] = {
            "name": "System Default Streaming Key",
            "created_at": int(time.time()),
            "scopes": ["stream:chat", "security:audit"],
            "is_active": True,
        }
        _save_keys_to_disk()


def _save_keys_to_disk():
    try:
        with open(KEYS_FILE, "w", encoding="utf-8") as f:
            json.dump(_KEY_REGISTRY, f, indent=2)
    except Exception:
        pass


# Initialize key store
_load_keys_from_disk()


def create_api_key(name: str = "web-client", scopes: list[str] | None = None) -> dict:
    """Creates a new cryptographically secure streaming API key from scratch."""
    _load_keys_from_disk()
    raw_token = secrets.token_urlsafe(28)
    key = f"tl_stream_{raw_token}"
    scopes = scopes or ["stream:chat"]

    key_record = {
        "name": name,
        "created_at": int(time.time()),
        "scopes": scopes,
        "is_active": True,
    }

    _KEY_REGISTRY[key] = key_record
    _save_keys_to_disk()

    return {
        "api_key": key,
        "name": name,
        "scopes": scopes,
        "created_at": key_record["created_at"],
    }


def validate_api_key(key: str | None) -> bool:
    """Validates if an API key is active and authorized to stream tokens."""
    if not key:
        return False
    
    _load_keys_from_disk()

    # Direct match in registry
    record = _KEY_REGISTRY.get(key)
    if record and record.get("is_active", False):
        return True

    # Check env key match
    if DEFAULT_ENV_KEY and key == DEFAULT_ENV_KEY:
        return True

    return False


def get_client_streaming_key() -> str:
    """Returns a valid streaming API key for the website client."""
    _load_keys_from_disk()
    if DEFAULT_ENV_KEY:
        return DEFAULT_ENV_KEY

    # If none found, generate one
    new_key = create_api_key(name="auto-client")
    return new_key["api_key"]


def list_api_keys() -> list[dict]:
    """Returns non-sensitive metadata for registered keys."""
    _load_keys_from_disk()
    result = []
    for k, meta in _KEY_REGISTRY.items():
        masked = f"{k[:10]}...{k[-4:]}" if len(k) > 14 else "***"
        result.append({
            "key_preview": masked,
            "name": meta.get("name", "Unnamed"),
            "created_at": meta.get("created_at"),
            "scopes": meta.get("scopes", []),
            "is_active": meta.get("is_active", True),
        })
    return result
