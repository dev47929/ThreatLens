import asyncio
import json
import time
import uuid
from pathlib import Path
from statistics import mean, median
from typing import Any

import httpx


BASE_DIR = Path(__file__).resolve().parent
CASES_FILE = BASE_DIR / "cases.json"


class XSSAttack:

    def __init__(self, config: dict):

        self.config = config

        self.target = config["target"]
        self.request = config["request"]
        self.attack = config["attack"]

        self.attack_id = str(uuid.uuid4())

        self.running = False
        self.finished = False

        self.started_at: float | None = None
        self.finished_at: float | None = None

        self.status = "created"

        self.total_requests = 0
        self.attempted_requests = 0

        self.successful_requests = 0
        self.failed_requests = 0
        self.timeout_requests = 0

        self.latencies: list[float] = []
        self.status_codes: dict[str, int] = {}

        self.findings: list[dict[str, Any]] = []
        self.errors: dict[str, int] = {}

        self._task: asyncio.Task | None = None

    # --------------------------------------------------------
    # Load Cases
    # --------------------------------------------------------

    def _load_cases(self) -> dict:

        with open(
            CASES_FILE,
            "r",
            encoding="utf-8",
        ) as file:

            return json.load(file)

    # --------------------------------------------------------
    # Start
    # --------------------------------------------------------

    async def start(self) -> str:

        if self.running:
            return self.attack_id

        self.running = True
        self.status = "running"
        self.started_at = time.perf_counter()

        self._task = asyncio.create_task(
            self._run()
        )

        return self.attack_id

    # --------------------------------------------------------
    # Stop
    # --------------------------------------------------------

    async def stop(self):

        self.running = False

        if self.status == "running":
            self.status = "stopping"

    # --------------------------------------------------------
    # Run
    # --------------------------------------------------------

    async def _run(self):

        try:

            cases = self._load_cases()

            enabled_cases = {
                case_id: case
                for case_id, case in cases.items()
                if case.get("enabled", False)
            }

            self.total_requests = sum(
                len(case.get("probes", []))
                * self.attack.get("requests_per_case", 1)
                for case in enabled_cases.values()
            )

            async with httpx.AsyncClient(
                timeout=self.attack.get("timeout", 5)
            ) as client:

                for case_id, case in enabled_cases.items():

                    if not self.running:
                        break

                    for probe in case.get("probes", []):

                        if not self.running:
                            break

                        for _ in range(
                            self.attack.get(
                                "requests_per_case",
                                1,
                            )
                        ):

                            if not self.running:
                                break

                            await self._execute_probe(
                                client=client,
                                case_id=case_id,
                                case=case,
                                probe=probe,
                            )

                            delay = self.attack.get(
                                "delay",
                                0,
                            )

                            if delay > 0:
                                await asyncio.sleep(delay)

            if self.status == "stopping":
                self.status = "stopped"
            else:
                self.status = "completed"

        except Exception as exc:

            self.status = "failed"

            self.errors["attack"] = (
                self.errors.get("attack", 0) + 1
            )

        finally:

            self.running = False
            self.finished = True
            self.finished_at = time.perf_counter()

    # --------------------------------------------------------
    # Execute Probe
    # --------------------------------------------------------

    async def _execute_probe(
        self,
        client: httpx.AsyncClient,
        case_id: str,
        case: dict,
        probe: dict,
    ):

        self.attempted_requests += 1

        try:

            request_data = self._build_request(
                probe["value"]
            )

            started = time.perf_counter()

            response = await client.request(
                method=self.target.get(
                    "method",
                    "POST",
                ),
                url=self._build_url(),
                headers=self.request.get(
                    "headers",
                    {},
                ),
                params=request_data["params"],
                json=request_data["body"],
            )

            latency = (
                time.perf_counter() - started
            )

            self.latencies.append(latency)

            self.successful_requests += 1

            status_code = str(response.status_code)

            self.status_codes[status_code] = (
                self.status_codes.get(status_code, 0)
                + 1
            )

            self._analyze_response(
                case_id=case_id,
                case=case,
                probe=probe,
                response=response,
            )

        except httpx.TimeoutException:

            self.timeout_requests += 1

            self.errors["timeout"] = (
                self.errors.get("timeout", 0)
                + 1
            )

        except Exception as exc:

            self.failed_requests += 1

            key = type(exc).__name__

            self.errors[key] = (
                self.errors.get(key, 0)
                + 1
            )

    # --------------------------------------------------------
    # Build URL
    # --------------------------------------------------------

    def _build_url(self) -> str:

        base_url = self.target["base_url"].rstrip("/")

        endpoint = self.target["endpoint"]

        return f"{base_url}{endpoint}"

    # --------------------------------------------------------
    # Build Request
    # --------------------------------------------------------

    def _build_request(
        self,
        payload: str,
    ) -> dict:

        query_params = dict(
            self.target.get("query_params") or {}
        )

        path_params = dict(
            self.target.get("path_params") or {}
        )

        body = dict(
            self.request.get("body") or {}
        )

        # Inject only into configured parameters

        for key in query_params:
            query_params[key] = payload

        for key in path_params:
            path_params[key] = payload

        for key in body:
            body[key] = payload

        return {
            "params": query_params,
            "path_params": path_params,
            "body": body,
        }

    # --------------------------------------------------------
    # Analyze Response
    # --------------------------------------------------------

    def _analyze_response(
        self,
        case_id: str,
        case: dict,
        probe: dict,
        response: httpx.Response,
    ):

        response_text = response.text

        payload = probe["value"]

        if payload not in response_text:
            return

        # ----------------------------------------------------
        # Reflection detected
        # ----------------------------------------------------

        finding = {
            "case": case_id,
            "case_name": case.get(
                "name",
                case_id,
            ),
            "probe": probe["name"],
            "finding": "reflected_input",
            "confidence": "medium",
            "evidence": {
                "payload": payload,
                "status_code": response.status_code,
                "reflected": True,
            },
            "occurrences": 1,
        }

        self._add_finding(finding)

        # ----------------------------------------------------
        # Basic executable markup indicators
        # ----------------------------------------------------

        lowered = response_text.lower()

        executable_indicators = [
            "<script",
            "onerror=",
            "onload=",
            "onclick=",
            "<svg",
            "javascript:",
        ]

        if any(
            indicator in lowered
            for indicator in executable_indicators
        ):

            finding = {
                "case": case_id,
                "case_name": case.get(
                    "name",
                    case_id,
                ),
                "probe": probe["name"],
                "finding": "potential_xss",
                "confidence": "high",
                "evidence": {
                    "payload": payload,
                    "status_code": response.status_code,
                    "reflected": True,
                    "executable_markup": True,
                },
                "occurrences": 1,
            }

            self._add_finding(finding)

    # --------------------------------------------------------
    # Add Finding
    # --------------------------------------------------------

    def _add_finding(
        self,
        finding: dict,
    ):

        for existing in self.findings:

            if (
                existing["case"] == finding["case"]
                and existing["probe"] == finding["probe"]
                and existing["finding"]
                == finding["finding"]
            ):

                existing["occurrences"] += 1

                return

        self.findings.append(finding)

    # --------------------------------------------------------
    # Statistics
    # --------------------------------------------------------

    def _performance(self) -> dict:

        if not self.latencies:

            return {
                "requests_per_second": 0,
                "average_latency_ms": 0,
                "p50_latency_ms": 0,
                "p95_latency_ms": 0,
                "p99_latency_ms": 0,
            }

        values = sorted(self.latencies)

        elapsed = (
            (self.finished_at or time.perf_counter())
            - (self.started_at or time.perf_counter())
        )

        def percentile(
            values: list[float],
            percentile_value: float,
        ) -> float:

            if len(values) == 1:
                return values[0]

            index = int(
                round(
                    (percentile_value / 100)
                    * (len(values) - 1)
                )
            )

            return values[index]

        return {
            "requests_per_second": (
                self.attempted_requests / elapsed
                if elapsed > 0
                else 0
            ),
            "average_latency_ms": (
                mean(values) * 1000
            ),
            "p50_latency_ms": (
                median(values) * 1000
            ),
            "p95_latency_ms": (
                percentile(values, 95) * 1000
            ),
            "p99_latency_ms": (
                percentile(values, 99) * 1000
            ),
        }

    # --------------------------------------------------------
    # Status
    # --------------------------------------------------------

    def get_status(self) -> dict:

        elapsed = 0

        if self.started_at:

            end = (
                self.finished_at
                or time.perf_counter()
            )

            elapsed = end - self.started_at

        active_requests = max(
            self.attempted_requests
            - self.successful_requests
            - self.failed_requests
            - self.timeout_requests,
            0,
        )

        return {
            "attack_id": self.attack_id,

            "status": self.status,

            "elapsed_seconds": elapsed,

            "progress": {
                "planned_requests": self.total_requests,
                "attempted_requests": (
                    self.attempted_requests
                ),
                "active_requests": active_requests,
            },

            "requests": {
                "successful": (
                    self.successful_requests
                ),
                "failed": self.failed_requests,
                "timeouts": self.timeout_requests,
            },

            "performance": self._performance(),

            "status_codes": self.status_codes,

            "findings": self.findings,

            "errors": self.errors,
        }

    # --------------------------------------------------------
    # Stream
    # --------------------------------------------------------

    async def stream(
        self,
        interval: float = 1.0,
    ):

        while True:

            yield self.get_status()

            if self.finished:
                break

            await asyncio.sleep(interval)