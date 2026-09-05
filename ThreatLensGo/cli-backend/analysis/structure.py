from __future__ import annotations

import json
from typing import Any
from collections import Counter
from dataclasses import dataclass, asdict


@dataclass
class FileStatistics:
    total: int
    by_extension: dict[str, int]
    total_size: int
    largest_files: list[dict[str, Any]]


@dataclass
class LanguageStatistics:
    files: int
    extensions: dict[str, int]


@dataclass
class RepositoryAnalysis:
    repository: dict[str, Any]
    files: FileStatistics
    languages: LanguageStatistics
    tags: list[dict[str, Any]]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2, default=str)


class RepositoryAnalyzer:
    """
    Analyze the current state of a Repository.

    This class consumes the Repository data-access layer. It does not
    clone, update, or close repositories itself.

    Example:

        repo = Repository(url)

        analyzer = RepositoryAnalyzer(repo)

        result = analyzer.analyze()

        print(result.to_dict())

        repo.close()
    """

    # Common source-code extensions. This is intentionally conservative;
    # unknown extensions remain available in the raw file statistics.
    LANGUAGE_MAP = {
        ".py": "Python",
        ".pyw": "Python",
        ".js": "JavaScript",
        ".jsx": "JavaScript",
        ".ts": "TypeScript",
        ".tsx": "TypeScript",
        ".java": "Java",
        ".c": "C",
        ".h": "C",
        ".cpp": "C++",
        ".cc": "C++",
        ".cxx": "C++",
        ".hpp": "C++",
        ".cs": "C#",
        ".go": "Go",
        ".rs": "Rust",
        ".php": "PHP",
        ".rb": "Ruby",
        ".swift": "Swift",
        ".kt": "Kotlin",
        ".kts": "Kotlin",
        ".dart": "Dart",
        ".scala": "Scala",
        ".sh": "Shell",
        ".bash": "Shell",
        ".zsh": "Shell",
        ".ps1": "PowerShell",
        ".sql": "SQL",
        ".html": "HTML",
        ".htm": "HTML",
        ".css": "CSS",
        ".scss": "SCSS",
        ".sass": "Sass",
        ".vue": "Vue",
        ".svelte": "Svelte",
        ".r": "R",
        ".lua": "Lua",
        ".ex": "Elixir",
        ".exs": "Elixir",
        ".erl": "Erlang",
        ".fs": "F#",
        ".fsx": "F#",
        ".m": "Objective-C",
        ".mm": "Objective-C++",
    }

    def __init__(self, repository):
        self.repository = repository

    # ==========================================================
    # PUBLIC
    # ==========================================================

    def analyze(self) -> RepositoryAnalysis:
        """
        Run repository-level analysis.

        This first version focuses on the current repository state:
            - repository metadata
            - tracked files
            - file extensions
            - file sizes
            - language distribution
            - tags

        Commit-history analysis is intentionally kept separate.
        """

        repo_info = self.repository.info_repo()
        files = self.repository.get_files()
        tags = self.repository.info_tags()

        file_statistics = self._analyze_files(files)
        language_statistics = self._analyze_languages(files)

        return RepositoryAnalysis(
            repository=repo_info,
            files=file_statistics,
            languages=language_statistics,
            tags=tags,
        )

    # ==========================================================
    # FILE ANALYSIS
    # ==========================================================

    def _analyze_files(
        self,
        files: list[dict[str, Any]],
    ) -> FileStatistics:
        extension_counts = Counter()
        total_size = 0

        for file in files:
            extension = file.get("extension") or "<no extension>"

            extension_counts[extension] += 1
            total_size += int(file.get("size", 0))

        largest_files = sorted(
            files,
            key=lambda item: int(item.get("size", 0)),
            reverse=True,
        )[:10]

        largest_files = [
            {
                "path": file["path"],
                "size": file["size"],
            }
            for file in largest_files
        ]

        return FileStatistics(
            total=len(files),
            by_extension=dict(
                extension_counts.most_common()
            ),
            total_size=total_size,
            largest_files=largest_files,
        )

    # ==========================================================
    # LANGUAGE ANALYSIS
    # ==========================================================

    def _analyze_languages(
        self,
        files: list[dict[str, Any]],
    ) -> LanguageStatistics:
        language_counts = Counter()

        for file in files:
            extension = file.get("extension")

            if not extension:
                continue

            language = self.LANGUAGE_MAP.get(
                extension.lower()
            )

            if language:
                language_counts[language] += 1

        return LanguageStatistics(
            files=sum(language_counts.values()),
            extensions=dict(
                language_counts.most_common()
            ),
        )