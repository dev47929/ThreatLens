def get_identifier_type(identifier: str) -> str:
    identifier = identifier.strip()

    if "@" in identifier:
        return "email"

    return "handle"

def normalize_identifier(identifier: str) -> str:
    return identifier.strip().lower()
