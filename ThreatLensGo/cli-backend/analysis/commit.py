
# ============================================================
# COMMIT ANALYSIS
# ============================================================
#
# This module analyzes ONE commit at a time.
#
# Repository data is fetched exclusively through the Repository
# class methods:
#
#   info_commit()
#   diff()
#   get_files()
#   get_file()
#
# The analyzer focuses only on:
#
#   - Commit risk analysis
#   - Secret detection
#   - Sensitive-file detection
#   - Security-code detection
#   - Dependency-change analysis
#   - CI/CD security
#   - Docker/K8s security
#   - Permission/security-mode analysis
#   - Author/committer mismatch
#   - Merge analysis
#   - Suspicious commit patterns
#
# No repository-history-wide analysis is performed here.
# Pass a commit SHA to analyze that commit individually.
# ============================================================

import re
import json
from pathlib import Path
from dataclasses import asdict, dataclass

@dataclass
class Finding:
    category: str
    severity: str
    title: str
    description: str
    path: str | None = None
    evidence: str | None = None


class CommitAnalyzer:
    """
    Analyze a single commit from a Repository instance.

    Example:

        with Repository(
            "https://github.com/fastapi/fastapi.git"
        ) as repo:

            analyzer = CommitAnalyzer(repo)

            result = analyzer.analyze(
                "commit-sha"
            )

            print(result)
    """

    SECRET_PATTERNS = {
        "AWS access key": re.compile(
            r"\bAKIA[0-9A-Z]{16}\b"
        ),
        "GitHub token": re.compile(
            r"\bgh[pousr]_[A-Za-z0-9_]{20,}\b"
        ),
        "Private key": re.compile(
            r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"
        ),
        "Generic secret assignment": re.compile(
            r"(?i)\b(?:api[_-]?key|secret|token|password|passwd)"
            r"\s*[:=]\s*[\"'][^\"'\n]{8,}[\"']"
        ),
        "Bearer token": re.compile(
            r"(?i)\bBearer\s+[A-Za-z0-9._~+/=-]{20,}"
        ),
    }

    SENSITIVE_FILE_PATTERNS = [
        re.compile(
            r"(^|/)\.env(?:\..*)?$",
            re.IGNORECASE,
        ),
        re.compile(
            r"(^|/)(?:id_rsa|id_dsa|id_ecdsa|id_ed25519)$",
            re.IGNORECASE,
        ),
        re.compile(
            r"(^|/)(?:.*\.(?:pem|key|p12|pfx|jks))$",
            re.IGNORECASE,
        ),
        re.compile(
            r"(^|/)(?:credentials?|secrets?|service[-_]?account).*",
            re.IGNORECASE,
        ),
        re.compile(
            r"(^|/)(?:config|settings).*(?:secret|prod|production).*",
            re.IGNORECASE,
        ),
    ]

    SECURITY_FILE_EXTENSIONS = {
        ".py",
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".java",
        ".kt",
        ".go",
        ".rs",
        ".cpp",
        ".c",
        ".h",
        ".hpp",
        ".php",
        ".rb",
        ".cs",
        ".sql",
        ".sh",
        ".bash",
        ".yaml",
        ".yml",
        ".json",
        ".toml",
        ".ini",
        ".conf",
        ".config",
    }

    DEPENDENCY_FILES = {
        "requirements.txt",
        "requirements-dev.txt",
        "pyproject.toml",
        "poetry.lock",
        "pipfile",
        "pipfile.lock",
        "package.json",
        "package-lock.json",
        "npm-shrinkwrap.json",
        "yarn.lock",
        "pnpm-lock.yaml",
        "pom.xml",
        "build.gradle",
        "build.gradle.kts",
        "gradle.properties",
        "go.mod",
        "go.sum",
        "cargo.toml",
        "cargo.lock",
        "composer.json",
        "composer.lock",
        "gemfile",
        "gemfile.lock",
    }

    CICD_PATTERNS = [
        re.compile(r"(^|/)\.github/workflows/.*\.ya?ml$", re.I),
        re.compile(r"(^|/)\.gitlab-ci\.ya?ml$", re.I),
        re.compile(r"(^|/)Jenkinsfile$", re.I),
        re.compile(r"(^|/)azure-pipelines.*\.ya?ml$", re.I),
        re.compile(r"(^|/)bitbucket-pipelines\.ya?ml$", re.I),
        re.compile(r"(^|/)circleci/.*", re.I),
    ]

    DOCKER_PATTERNS = [
        re.compile(r"(^|/)Dockerfile(?:\..*)?$", re.I),
        re.compile(r"(^|/)docker-compose(?:\..*)?\.ya?ml$", re.I),
        re.compile(r"(^|/)compose(?:\..*)?\.ya?ml$", re.I),
    ]

    K8S_PATTERNS = [
        re.compile(r"(^|/)(?:k8s|kubernetes|helm|charts)(/|$)", re.I),
        re.compile(r"\.ya?ml$", re.I),
    ]

    SECURITY_PATTERNS = [
        (
            "SQL injection risk",
            re.compile(
                r"(?i)(?:execute|query|cursor)\s*\([^)]*"
                r"(?:f[\"']|[\"'].*\+.*|format\s*\()"
            ),
        ),
        (
            "Command injection risk",
            re.compile(
                r"(?i)\b(?:os\.system|subprocess\.(?:run|Popen|call)|"
                r"os\.popen)\s*\([^)]*(?:input|request|args|query|param)"
            ),
        ),
        (
            "Unsafe deserialization",
            re.compile(
                r"(?i)\b(?:pickle\.loads?|yaml\.load)\s*\("
            ),
        ),
        (
            "Dynamic code execution",
            re.compile(
                r"(?i)\b(?:eval|exec)\s*\("
            ),
        ),
        (
            "Weak hashing",
            re.compile(
                r"(?i)\b(?:md5|sha1)\s*\("
            ),
        ),
        (
            "TLS verification disabled",
            re.compile(
                r"(?i)(?:verify\s*=\s*False|CERT_NONE)"
            ),
        ),
        (
            "Debug mode enabled",
            re.compile(
                r"(?i)\b(?:debug|DEBUG)\s*[:=]\s*(?:True|true|1)"
            ),
        ),
        (
            "Wildcard CORS",
            re.compile(
                r"(?i)(?:allow_origins|origins)\s*[:=].*[\"']\*[\"']"
            ),
        ),
        (
            "Hard-coded authorization",
            re.compile(
                r"(?i)\b(?:is_admin|role)\s*==?\s*[\"']admin[\"']"
            ),
        ),
    ]

    def __init__(self, repository):
        self.repository = repository

    # ==========================================================
    # PUBLIC API
    # ==========================================================


    def analyze(self, sha: str) -> dict:
        """
        Analyze exactly one commit identified by SHA.
        """

        commit = self.repository.info_commit(sha)
        diffs = self.repository.diff(sha)

        changed_paths = self._changed_paths(diffs)

        findings: list[Finding] = []

        findings.extend(
            self._analyze_author_committer(commit)
        )

        findings.extend(
            self._analyze_merge(commit, diffs)
        )

        findings.extend(
            self._analyze_sensitive_files(diffs)
        )

        findings.extend(
            self._analyze_permissions(diffs)
        )

        findings.extend(
            self._analyze_secrets(diffs)
        )

        findings.extend(
            self._analyze_security_code(diffs)
        )

        findings.extend(
            self._analyze_dependencies(diffs)
        )

        findings.extend(
            self._analyze_cicd(diffs)
        )

        findings.extend(
            self._analyze_docker_k8s(diffs)
        )

        findings.extend(
            self._analyze_commit_risk(
                commit,
                diffs,
                changed_paths,
            )
        )

        findings.extend(
            self._analyze_suspicious_patterns(
                commit,
                diffs,
            )
        )

        score = self._risk_score(findings)

        return {
            "commit": commit,
            "summary": {
                "risk_score": score,
                "risk_level": self._risk_level(score),
                "files_changed": len(changed_paths),
                "findings": len(findings),
                "critical": self._count(
                    findings,
                    "critical",
                ),
                "high": self._count(
                    findings,
                    "high",
                ),
                "medium": self._count(
                    findings,
                    "medium",
                ),
                "low": self._count(
                    findings,
                    "low",
                ),
            },
            "findings": [
                asdict(finding)
                for finding in findings
            ],
        }
    
    def analyze_json(self, sha: str) -> str:
        return json.dumps(
            self.analyze(sha),
            indent=2,
            default=str,
        )

    # ==========================================================
    # AUTHOR / COMMITTER
    # ==========================================================

    @staticmethod
    def _analyze_author_committer(
        commit: dict,
    ) -> list[Finding]:

        if (
            commit["author_name"]
            == commit["committer_name"]
            and commit["author_email"]
            == commit["committer_email"]
        ):
            return []

        return [
            Finding(
                category="author_committer_mismatch",
                severity="medium",
                title="Author and committer differ",
                description=(
                    "The commit author and committer metadata "
                    "do not match."
                ),
                evidence=(
                    f"author={commit['author_name']} "
                    f"<{commit['author_email']}>; "
                    f"committer={commit['committer_name']} "
                    f"<{commit['committer_email']}>"
                ),
            )
        ]

    # ==========================================================
    # MERGE
    # ==========================================================

    @staticmethod
    def _analyze_merge(
        commit: dict,
        diffs: list[dict],
    ) -> list[Finding]:

        parents = commit["parents"]

        if len(parents) <= 1:
            return []

        return [
            Finding(
                category="merge_analysis",
                severity="low",
                title="Merge commit",
                description=(
                    "This commit has multiple parents and is "
                    "therefore a merge commit. The Repository.diff "
                    "method compares it against the first parent."
                ),
                evidence=(
                    f"parents={len(parents)}, "
                    f"files_changed={len(diffs)}"
                ),
            )
        ]

    # ==========================================================
    # SENSITIVE FILES
    # ==========================================================

    def _analyze_sensitive_files(
        self,
        diffs: list[dict],
    ) -> list[Finding]:

        findings = []

        for item in diffs:
            paths = {
                item.get("old_path"),
                item.get("new_path"),
            }

            for path in paths:
                if not path:
                    continue

                if self._matches_any(
                    path,
                    self.SENSITIVE_FILE_PATTERNS,
                ):
                    findings.append(
                        Finding(
                            category="sensitive_file",
                            severity="high",
                            title="Sensitive file changed",
                            description=(
                                "The commit adds, modifies, "
                                "or removes a path that commonly "
                                "contains sensitive information."
                            ),
                            path=path,
                            evidence=(
                                f"change_type={item['change_type']}"
                            ),
                        )
                    )

        return findings

    # ==========================================================
    # SECRETS
    # ==========================================================

    def _analyze_secrets(
        self,
        diffs: list[dict],
    ) -> list[Finding]:

        findings = []

        for item in diffs:

            patch = item.get("diff") or ""

            added_lines = [
                line[1:]
                for line in patch.splitlines()
                if line.startswith("+")
                and not line.startswith("+++")
            ]

            content = "\n".join(
                added_lines
            )

            for name, pattern in self.SECRET_PATTERNS.items():

                match = pattern.search(content)

                if not match:
                    continue

                evidence = self._redact(
                    match.group(0)
                )

                findings.append(
                    Finding(
                        category="secret_detection",
                        severity="critical",
                        title=f"Possible {name}",
                        description=(
                            "A pattern resembling a credential "
                            "or secret was detected in added code."
                        ),
                        path=item.get("new_path"),
                        evidence=evidence,
                    )
                )

        return findings

    # ==========================================================
    # SECURITY CODE
    # ==========================================================

    def _analyze_security_code(
        self,
        diffs: list[dict],
    ) -> list[Finding]:

        findings = []

        for item in diffs:

            patch = item.get("diff") or ""

            added_lines = [
                line[1:]
                for line in patch.splitlines()
                if line.startswith("+")
                and not line.startswith("+++")
            ]

            content = "\n".join(
                added_lines
            )

            for title, pattern in self.SECURITY_PATTERNS:

                match = pattern.search(content)

                if not match:
                    continue

                findings.append(
                    Finding(
                        category="security_code",
                        severity="high",
                        title=title,
                        description=(
                            "A security-sensitive coding pattern "
                            "was introduced or modified by the commit."
                        ),
                        path=item.get("new_path"),
                        evidence=self._redact(
                            match.group(0)
                        ),
                    )
                )

        return findings

    # ==========================================================
    # DEPENDENCIES
    # ==========================================================

    def _analyze_dependencies(
        self,
        diffs: list[dict],
    ) -> list[Finding]:

        findings = []

        for item in diffs:

            path = item.get("new_path") or item.get("old_path")

            if not path:
                continue

            filename = Path(path).name.lower()

            if filename not in self.DEPENDENCY_FILES:
                continue

            change_type = item["change_type"]

            severity = (
                "medium"
                if change_type in {"A", "M"}
                else "low"
            )

            findings.append(
                Finding(
                    category="dependency_change",
                    severity=severity,
                    title="Dependency file changed",
                    description=(
                        "A dependency or lock file changed. "
                        "The commit should be reviewed for newly "
                        "introduced packages, version changes, "
                        "or dependency removal."
                    ),
                    path=path,
                    evidence=(
                        f"change_type={change_type}"
                    ),
                )
            )

        return findings

    # ==========================================================
    # CI/CD
    # ==========================================================

    def _analyze_cicd(
        self,
        diffs: list[dict],
    ) -> list[Finding]:

        findings = []

        for item in diffs:

            path = item.get("new_path") or item.get("old_path")

            if not path:
                continue

            if not self._matches_any(
                path,
                self.CICD_PATTERNS,
            ):
                continue

            findings.append(
                Finding(
                    category="cicd_security",
                    severity="medium",
                    title="CI/CD configuration changed",
                    description=(
                        "A CI/CD configuration file changed. "
                        "Review workflow permissions, secrets, "
                        "third-party actions, shell commands, "
                        "and deployment credentials."
                    ),
                    path=path,
                    evidence=(
                        f"change_type={item['change_type']}"
                    ),
                )
            )

            patch = item.get("diff") or ""

            dangerous_patterns = [
                (
                    "Unpinned GitHub Action",
                    re.compile(
                        r"(?i)uses:\s*[^@\s]+@(?:main|master|latest)"
                    ),
                ),
                (
                    "Broad workflow permissions",
                    re.compile(
                        r"(?i)permissions:\s*write-all"
                    ),
                ),
                (
                    "Potential secret exposure",
                    re.compile(
                        r"(?i)echo\s+.*\$\{\{\s*secrets\."
                    ),
                ),
            ]

            for title, pattern in dangerous_patterns:

                match = pattern.search(patch)

                if not match:
                    continue

                findings.append(
                    Finding(
                        category="cicd_security",
                        severity="high",
                        title=title,
                        description=(
                            "A potentially unsafe CI/CD pattern "
                            "was detected in the changed workflow."
                        ),
                        path=path,
                        evidence=self._redact(
                            match.group(0)
                        ),
                    )
                )

        return findings

    # ==========================================================
    # DOCKER / KUBERNETES
    # ==========================================================

    def _analyze_docker_k8s(
        self,
        diffs: list[dict],
    ) -> list[Finding]:

        findings = []

        for item in diffs:

            path = item.get("new_path") or item.get("old_path")

            if not path:
                continue

            patch = item.get("diff") or ""

            if self._matches_any(
                path,
                self.DOCKER_PATTERNS,
            ):

                findings.append(
                    Finding(
                        category="docker_security",
                        severity="medium",
                        title="Docker configuration changed",
                        description=(
                            "Docker configuration changed. "
                            "Review image provenance, user privileges, "
                            "secrets, exposed ports, and filesystem access."
                        ),
                        path=path,
                        evidence=(
                            f"change_type={item['change_type']}"
                        ),
                    )
                )

                docker_patterns = [
                    (
                        "Docker runs as root",
                        re.compile(
                            r"(?im)^\s*USER\s+root\s*$"
                        ),
                    ),
                    (
                        "Privileged container",
                        re.compile(
                            r"(?i)\bprivileged\s*:\s*true\b"
                        ),
                    ),
                    (
                        "Host filesystem mount",
                        re.compile(
                            r"(?i)(?:/var/run/docker.sock|"
                            r"/etc|/root):"
                        ),
                    ),
                ]

                for title, pattern in docker_patterns:

                    match = pattern.search(patch)

                    if match:
                        findings.append(
                            Finding(
                                category="docker_security",
                                severity="high",
                                title=title,
                                description=(
                                    "A potentially dangerous Docker "
                                    "security configuration was detected."
                                ),
                                path=path,
                                evidence=self._redact(
                                    match.group(0)
                                ),
                            )
                        )

            if self._matches_any(
                path,
                self.K8S_PATTERNS,
            ):

                findings.append(
                    Finding(
                        category="kubernetes_security",
                        severity="medium",
                        title="Kubernetes configuration changed",
                        description=(
                            "A Kubernetes-related manifest changed. "
                            "Review container privileges, service "
                            "accounts, RBAC, host access, and exposed services."
                        ),
                        path=path,
                        evidence=(
                            f"change_type={item['change_type']}"
                        ),
                    )
                )

                k8s_patterns = [
                    (
                        "Privileged Kubernetes container",
                        re.compile(
                            r"(?i)privileged\s*:\s*true"
                        ),
                    ),
                    (
                        "Host network enabled",
                        re.compile(
                            r"(?i)hostNetwork\s*:\s*true"
                        ),
                    ),
                    (
                        "Host PID enabled",
                        re.compile(
                            r"(?i)hostPID\s*:\s*true"
                        ),
                    ),
                    (
                        "Host path mount",
                        re.compile(
                            r"(?i)hostPath\s*:"
                        ),
                    ),
                    (
                        "Cluster-admin RBAC",
                        re.compile(
                            r"(?i)cluster-admin"
                        ),
                    ),
                ]

                for title, pattern in k8s_patterns:

                    match = pattern.search(patch)

                    if match:
                        findings.append(
                            Finding(
                                category="kubernetes_security",
                                severity="high",
                                title=title,
                                description=(
                                    "A potentially dangerous Kubernetes "
                                    "security configuration was detected."
                                ),
                                path=path,
                                evidence=self._redact(
                                    match.group(0)
                                ),
                            )
                        )

        return findings

    # ==========================================================
    # FILE PERMISSIONS / MODES
    # ==========================================================

    @staticmethod
    def _analyze_permissions(
        diffs: list[dict],
    ) -> list[Finding]:

        findings = []

        for item in diffs:

            old_mode = item.get("old_mode")
            new_mode = item.get("new_mode")

            if not old_mode or not new_mode:
                continue

            if old_mode == new_mode:
                continue

            try:
                old_permissions = int(
                    old_mode,
                    8,
                )

                new_permissions = int(
                    new_mode,
                    8,
                )

            except ValueError:
                continue

            old_exec = bool(
                old_permissions & 0o111
            )

            new_exec = bool(
                new_permissions & 0o111
            )

            if not old_exec and new_exec:

                findings.append(
                    Finding(
                        category="permission_analysis",
                        severity="medium",
                        title="File became executable",
                        description=(
                            "The commit changes the file mode so that "
                            "one or more executable permission bits are set."
                        ),
                        path=item.get("new_path"),
                        evidence=(
                            f"{old_mode} -> {new_mode}"
                        ),
                    )
                )

            if (
                new_permissions & 0o002
            ):

                findings.append(
                    Finding(
                        category="permission_analysis",
                        severity="high",
                        title="World-writable permission",
                        description=(
                            "The resulting file mode grants write "
                            "permission to others."
                        ),
                        path=item.get("new_path"),
                        evidence=(
                            f"{old_mode} -> {new_mode}"
                        ),
                    )
                )

        return findings

    # ==========================================================
    # COMMIT RISK
    # ==========================================================

    @staticmethod
    def _analyze_commit_risk(
        commit: dict,
        diffs: list[dict],
        changed_paths: list[str],
    ) -> list[Finding]:

        findings = []

        added = sum(
            1
            for item in diffs
            if item["change_type"] == "A"
        )

        deleted = sum(
            1
            for item in diffs
            if item["change_type"] == "D"
        )

        renamed = sum(
            1
            for item in diffs
            if item["change_type"] == "R"
        )

        if len(changed_paths) >= 20:
            findings.append(
                Finding(
                    category="commit_risk",
                    severity="medium",
                    title="Large commit",
                    description=(
                        "The commit changes a large number of files, "
                        "which increases review complexity."
                    ),
                    evidence=(
                        f"files={len(changed_paths)}"
                    ),
                )
            )

        if added >= 10:
            findings.append(
                Finding(
                    category="commit_risk",
                    severity="low",
                    title="Many files added",
                    description=(
                        "The commit adds many files and may deserve "
                        "additional review."
                    ),
                    evidence=f"added_files={added}",
                )
            )

        if deleted >= 10:
            findings.append(
                Finding(
                    category="commit_risk",
                    severity="medium",
                    title="Many files deleted",
                    description=(
                        "The commit deletes many files and may have "
                        "a significant impact."
                    ),
                    evidence=f"deleted_files={deleted}",
                )
            )

        if renamed >= 10:
            findings.append(
                Finding(
                    category="commit_risk",
                    severity="low",
                    title="Many files renamed",
                    description=(
                        "The commit contains many renames, which "
                        "can make review and change tracking harder."
                    ),
                    evidence=f"renamed_files={renamed}",
                )
            )

        if not commit["message"].strip():
            findings.append(
                Finding(
                    category="commit_risk",
                    severity="medium",
                    title="Empty commit message",
                    description=(
                        "The commit has no descriptive message."
                    ),
                )
            )

        return findings

    # ==========================================================
    # SUSPICIOUS COMMIT PATTERNS
    # ==========================================================

    @staticmethod
    def _analyze_suspicious_patterns(
        commit: dict,
        diffs: list[dict],
    ) -> list[Finding]:

        findings = []

        message = commit["message"].strip()

        suspicious_messages = [
            (
                "WIP commit",
                re.compile(
                    r"(?i)^\s*(?:wip|work in progress)\b"
                ),
            ),
            (
                "Temporary/debug commit",
                re.compile(
                    r"(?i)\b(?:temporary|temp|debug|test only)\b"
                ),
            ),
            (
                "Force-related commit",
                re.compile(
                    r"(?i)\b(?:force|forced|bypass)\b"
                ),
            ),
            (
                "Security-sensitive bypass wording",
                re.compile(
                    r"(?i)\b(?:disable security|skip auth|"
                    r"bypass auth|disable verification)\b"
                ),
            ),
        ]

        for title, pattern in suspicious_messages:

            if pattern.search(message):

                findings.append(
                    Finding(
                        category="suspicious_commit_pattern",
                        severity="low",
                        title=title,
                        description=(
                            "The commit message contains wording "
                            "that may warrant additional review."
                        ),
                        evidence=message[:300],
                    )
                )

        patch_text = "\n".join(
            item.get("diff") or ""
            for item in diffs
        )

        suspicious_code_patterns = [
            (
                "Authentication bypass pattern",
                re.compile(
                    r"(?i)(?:skip|disable|bypass).{0,40}"
                    r"(?:auth|authentication|authorization)"
                ),
            ),
            (
                "TLS verification bypass",
                re.compile(
                    r"(?i)(?:verify\s*=\s*False|CERT_NONE)"
                ),
            ),
        ]

        for title, pattern in suspicious_code_patterns:

            match = pattern.search(patch_text)

            if match:

                findings.append(
                    Finding(
                        category="suspicious_commit_pattern",
                        severity="high",
                        title=title,
                        description=(
                            "The changed patch contains a pattern "
                            "that may indicate a security control bypass."
                        ),
                        evidence=CommitAnalyzer._redact(
                            match.group(0)
                        ),
                    )
                )

        return findings

    # ==========================================================
    # HELPERS
    # ==========================================================

    @staticmethod
    def _changed_paths(
        diffs: list[dict],
    ) -> list[str]:

        paths = set()

        for item in diffs:

            if item.get("old_path"):
                paths.add(
                    item["old_path"]
                )

            if item.get("new_path"):
                paths.add(
                    item["new_path"]
                )

        return sorted(paths)

    @staticmethod
    def _matches_any(
        value: str,
        patterns,
    ) -> bool:

        return any(
            pattern.search(value)
            for pattern in patterns
        )

    @staticmethod
    def _redact(
        value: str,
    ) -> str:

        if not value:
            return value

        if len(value) <= 12:
            return "[REDACTED]"

        return (
            value[:6]
            + "..."
            + value[-4:]
        )

    @staticmethod
    def _count(
        findings: list[Finding],
        severity: str,
    ) -> int:

        return sum(
            finding.severity == severity
            for finding in findings
        )

    @staticmethod
    def _risk_score(
        findings: list[Finding],
    ) -> int:

        weights = {
            "critical": 40,
            "high": 20,
            "medium": 8,
            "low": 2,
        }

        score = sum(
            weights.get(
                finding.severity,
                0,
            )
            for finding in findings
        )

        return min(
            score,
            100,
        )

    @staticmethod
    def _risk_level(
        score: int,
    ) -> str:

        if score >= 80:
            return "critical"

        if score >= 50:
            return "high"

        if score >= 20:
            return "medium"

        return "low"


__all__ = [
    "CommitAnalyzer",
    "Finding",
]