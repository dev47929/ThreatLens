from __future__ import annotations

import shutil
import tempfile
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse
from utils.normalize import normalize_repo_url

from git import Repo
from git.exc import GitCommandError


@dataclass
class CommitInfo:
    sha: str
    short_sha: str

    author_name: str
    author_email: str

    committer_name: str
    committer_email: str

    authored_at: datetime
    committed_at: datetime

    message: str
    parents: list[str]


class Repository:
    """
    Remote public Git repository interface.

    The repository is cloned into a temporary directory.

    When a Repository object is initialized:
        - a temporary directory is created
        - the repository is cloned into that directory

    The temporary repository is automatically deleted when the
    Repository is closed or when used as a context manager.

    Example:

        with Repository(
            "https://github.com/fastapi/fastapi.git"
        ) as repo:
            print(repo.info_repo())

    Example:

        repo = Repository(
            "https://github.com/fastapi/fastapi.git"
        )

        print(repo.info_repo())

        commits = repo.list_commits(
            branch="main",
            limit=10,
        )

        commit = repo.info_commit(
            commits[0]["sha"]
        )

        changes = repo.diff(
            commits[0]["sha"]
        )

        files = repo.get_files()

        tags = repo.info_tags()

        repo.close()
    """

    def __init__(self, url: str):
        self.url = normalize_repo_url(url)

        self.username, self.repo_name = self._parse_repo_url()

        # Each Repository instance gets its own isolated temporary
        # directory. Nothing is shared between instances.
        self.repo_clone_dir = Path(
            tempfile.mkdtemp(
                prefix="threadlens-repo-"
            )
        )

        self.repo_path = (
            self.repo_clone_dir
            / f"{self.username}-{self.repo_name}"
        )

        self.repo: Repo | None = None

        self._create_repo()

    def __enter__(self) -> "Repository":
        """
        Enter the repository context.
        """

        self._ensure_open()

        return self

    def __exit__(
        self,
        exc_type,
        exc_value,
        traceback,
    ) -> None:
        """
        Automatically close and delete the temporary repository.
        """

        self.close()

    # ==========================================================
    # INTERNAL
    # ==========================================================

    def _parse_repo_url(self) -> tuple[str, str]:
        """
        Extract username and repository name.

        Example:

            https://github.com/fastapi/fastapi.git

        becomes:

            username = fastapi
            repo_name = fastapi
        """

        parsed = urlparse(self.url)

        parts = [
            part
            for part in parsed.path.split("/")
            if part
        ]

        if len(parts) < 2:
            raise ValueError(
                "Invalid GitHub repository URL."
            )

        username = parts[-2]
        repo_name = parts[-1]

        if repo_name.endswith(".git"):
            repo_name = repo_name[:-4]

        if not username or not repo_name:
            raise ValueError(
                "Could not determine repository owner or name."
            )

        return username, repo_name

    def _create_repo(self) -> None:
        """
        Clone the repository into the instance's temporary directory.

        No existing repository is reused. Every Repository instance
        receives a fresh clone.
        """

        try:
            self.repo = Repo.clone_from(
                self.url,
                self.repo_path,
            )

        except Exception:
            # If initialization fails, clean up the temporary directory
            # immediately so failed Repository objects do not leave
            # filesystem state behind.
            self.close()
            raise

    def _ensure_open(self) -> Repo:
        """
        Ensure the repository has not been closed.
        """

        if self.repo is None:
            raise RuntimeError(
                "Repository is closed."
            )

        return self.repo

    @staticmethod
    def _get_default_branch(repo: Repo) -> str:
        """
        Determine the remote's default branch.
        """

        try:
            remote = repo.remote("origin")

            # origin/HEAD -> origin/main
            symbolic = remote.refs.HEAD

            return symbolic.reference.name.split("/")[-1]

        except Exception:
            pass

        try:
            return repo.active_branch.name

        except Exception as exc:
            raise RuntimeError(
                "Could not determine repository default branch."
            ) from exc

    @staticmethod
    def _resolve_commit(
        repo: Repo,
        sha: str,
    ):
        if not sha or not sha.strip():
            raise ValueError(
                "Commit SHA cannot be empty."
            )

        try:
            return repo.commit(sha)

        except Exception as exc:
            raise ValueError(
                f"Commit not found: {sha}"
            ) from exc

    @staticmethod
    def _commit_to_info(commit) -> CommitInfo:
        return CommitInfo(
            sha=commit.hexsha,
            short_sha=commit.hexsha[:7],

            author_name=commit.author.name,
            author_email=commit.author.email,

            committer_name=commit.committer.name,
            committer_email=commit.committer.email,

            authored_at=commit.authored_datetime,
            committed_at=commit.committed_datetime,

            message=commit.message.strip(),

            parents=[
                parent.hexsha
                for parent in commit.parents
            ],
        )

    # ==========================================================
    # REPOSITORY INFO
    # ==========================================================

    def info_repo(self) -> dict:
        """
        Return metadata about the repository.
        """

        repo = self._ensure_open()

        default_branch = self._get_default_branch(repo)

        branches = [
            branch.name
            for branch in repo.branches
        ]

        remote_branches = []

        for ref in repo.remotes.origin.refs:
            if ref.name == "origin/HEAD":
                continue

            remote_branches.append(
                ref.name.removeprefix("origin/")
            )

        commit_count = sum(
            1
            for _ in repo.iter_commits("--all")
        )

        return {
            "url": self.url,

            "username": self.username,
            "name": self.repo_name,

            "default_branch": default_branch,

            "branches": branches,
            "remote_branches": remote_branches,

            "commit_count": commit_count,
        }

    # ==========================================================
    # LIST COMMITS
    # ==========================================================

    def list_commits(
        self,
        branch: str | None = None,
        limit: int | None = None,
    ) -> list[dict]:
        """
        List commits from a branch.

        Args:
            branch:
                Branch to inspect.
                If None, the repository default branch is used.

            limit:
                Maximum number of commits.
                If None, all commits are returned.
        """

        if limit is not None and limit <= 0:
            raise ValueError(
                "limit must be greater than 0."
            )

        repo = self._ensure_open()

        if branch is None:
            branch = self._get_default_branch(repo)

        try:
            commits = repo.iter_commits(
                branch,
                max_count=limit,
            )

        except GitCommandError as exc:
            raise ValueError(
                f"Branch not found: {branch}"
            ) from exc

        return [
            asdict(
                self._commit_to_info(commit)
            )
            for commit in commits
        ]

    # ==========================================================
    # COMMIT INFO
    # ==========================================================

    def info_commit(
        self,
        sha: str,
    ) -> dict:
        """
        Return detailed metadata for a commit.
        """

        repo = self._ensure_open()

        commit = self._resolve_commit(
            repo,
            sha,
        )

        return asdict(
            self._commit_to_info(commit)
        )

    # ==========================================================
    # DIFF
    # ==========================================================

    def diff(
        self,
        sha: str,
    ) -> list[dict]:
        """
        Return file-level changes introduced by a commit.

        For a normal commit:
            parent -> commit

        For a merge commit:
            first parent -> commit

        For the root commit:
            empty tree -> commit
        """

        repo = self._ensure_open()

        commit = self._resolve_commit(
            repo,
            sha,
        )

        # ------------------------------------------------------
        # Normal / merge commit
        # ------------------------------------------------------

        if commit.parents:

            parent = commit.parents[0]

            diffs = parent.diff(
                commit,
                create_patch=True,
            )

        # ------------------------------------------------------
        # Root commit
        # ------------------------------------------------------

        else:

            # Git has a well-known empty tree object. Using it
            # directly avoids passing an unsupported ``input=`` option
            # through GitPython to ``git hash-object``.
            empty_tree_sha = (
                "4b825dc642cb6eb9a060e54bf8d69288fbee4904"
            )

            empty_tree = repo.tree(
                empty_tree_sha
            )

            diffs = empty_tree.diff(
                commit,
                create_patch=True,
            )

        result = []

        for item in diffs:

            patch = item.diff

            if isinstance(patch, bytes):
                patch = patch.decode(
                    "utf-8",
                    errors="replace",
                )

            result.append(
                {
                    "change_type": item.change_type,

                    "old_path": item.a_path,
                    "new_path": item.b_path,

                    "old_mode": (
                        str(item.a_mode)
                        if item.a_mode
                        else None
                    ),

                    "new_mode": (
                        str(item.b_mode)
                        if item.b_mode
                        else None
                    ),

                    "diff": patch,
                }
            )

        return result

    # ==========================================================
    # FILES
    # ==========================================================

    def get_files(self) -> list[dict]:
        """
        Return tracked files in the current repository tree.

        Each file contains:
            - path
            - name
            - extension
            - size
        """

        repo = self._ensure_open()

        try:
            paths = repo.git.ls_files().splitlines()

        except GitCommandError as exc:
            raise RuntimeError(
                "Could not list repository files."
            ) from exc

        result = []

        for relative_path in paths:
            path = self.repo_path / relative_path

            if not path.is_file():
                continue

            suffix = Path(relative_path).suffix.lower()

            result.append(
                {
                    "path": relative_path,
                    "name": Path(relative_path).name,
                    "extension": suffix or None,
                    "size": path.stat().st_size,
                }
            )

        return result

    # ==========================================================
    # FILE CONTENT
    # ==========================================================

    def get_file(
        self,
        path: str,
    ) -> str:
        """
        Return the text content of a tracked repository file.

        The path is interpreted relative to the repository root.
        """

        self._ensure_open()

        if not path or not path.strip():
            raise ValueError(
                "File path cannot be empty."
            )

        relative_path = Path(path)

        if relative_path.is_absolute():
            raise ValueError(
                "File path must be relative to the repository root."
            )

        file_path = (
            self.repo_path / relative_path
        ).resolve()

        repo_root = self.repo_path.resolve()

        try:
            file_path.relative_to(repo_root)

        except ValueError as exc:
            raise ValueError(
                "File path must remain inside the repository."
            ) from exc

        if not file_path.is_file():
            raise FileNotFoundError(
                f"File not found: {path}"
            )

        try:
            return file_path.read_text(
                encoding="utf-8"
            )

        except UnicodeDecodeError as exc:
            raise ValueError(
                f"File is not valid UTF-8 text: {path}"
            ) from exc

    # ==========================================================
    # TAGS
    # ==========================================================

    def info_tags(self) -> list[dict]:
        """
        Return repository tags and the commits they point to.
        """

        repo = self._ensure_open()

        result = []

        for tag in repo.tags:
            result.append(
                {
                    "name": tag.name,
                    "sha": tag.commit.hexsha,
                    "short_sha": tag.commit.hexsha[:7],
                }
            )

        return result

    # ==========================================================
    # CLOSE
    # ==========================================================

    def close(self) -> None:
        """
        Close the repository and delete its entire temporary directory.

        Calling close() more than once is safe.
        """

        if self.repo is not None:
            try:
                self.repo.close()
            except Exception:
                pass

            self.repo = None

        if self.repo_clone_dir.exists():
            shutil.rmtree(
                self.repo_clone_dir,
                ignore_errors=True,
            )