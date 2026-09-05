from urllib.parse import urlsplit


def normalize_repo_url(url: str) -> str:
    url = url.strip()

    if not url:
        raise ValueError("Repository URL cannot be empty")

    # Remove leading slashes from shorthand input
    url = url.lstrip("/")

    # GitHub shorthand: user/repo
    if "://" not in url and not url.startswith(
        ("github.com/", "www.github.com/")
    ):
        parts = url.split("/")

        if len(parts) < 2:
            raise ValueError("Invalid GitHub repository URL")

        username = parts[0]
        repository = parts[1]

        if repository.endswith(".git"):
            repository = repository[:-4]

        return f"https://github.com/{username}/{repository}"

    # Full GitHub URL
    if "://" not in url:
        url = f"https://{url}"

    parts = urlsplit(url)

    path = parts.path.strip("/")
    segments = path.split("/")

    if len(segments) < 2:
        raise ValueError("Invalid GitHub repository URL")

    username = segments[0]
    repository = segments[1]

    if repository.endswith(".git"):
        repository = repository[:-4]

    return f"https://github.com/{username}/{repository}"