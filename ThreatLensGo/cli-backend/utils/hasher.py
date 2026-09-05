import bcrypt , hashlib

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    """
    return bcrypt.hashpw(
        password.encode(),
        bcrypt.gensalt(),
    ).decode()


def verify_password(
    password: str,
    password_hash: str,
) -> bool:
    """
    Verify a password against its hash.
    """
    return bcrypt.checkpw(
        password.encode(),
        password_hash.encode(),
    )


def simple_hash(value: str) -> str:
    """
    Generate a SHA-256 hash.
    """
    return hashlib.sha256(
        value.encode("utf-8")
    ).hexdigest()


def verify_hash(
    value: str,
    hash_value: str,
) -> bool:
    """
    Verify a value against its SHA-256 hash.
    """
    return simple_hash(value) == hash_value