import asyncio
import copy
import json
import statistics
import time
import uuid

from pathlib import Path
from typing import Any, AsyncGenerator

import httpx


CASES_FILE = Path(__file__).parent / "cases.json"


class SQLInjectionAttack:

    def __init__(self, config: dict[str, Any]) -> None:
        self.config = config

        self.attack_id = str(uuid.uuid4())

        self.target = config["target"]
        self.request = config["request"]
        self.attack = config["attack"]

        self.requests_per_case = self.attack.get(
            "requests_per_case",
            1,
        )

        self.delay = self.attack.get(
            "delay",
            0,
        )

        self.timeout = self.attack.get(
            "timeout",
            5,
        )

        self.on_failure = self.attack.get(
            "on_failure",
            "continue",
        )

        self.status = "pending"

        self.started_at: float | None = None
        self.finished_at: float | None = None

        self.stop_event = asyncio.Event()

        self._task: asyncio.Task | None = None

        self._lock = asyncio.Lock()

        self._results: list[dict[str, Any]] = []

        self._stats = {
            "planned_requests": 0,
            "attempted_requests": 0,
            "successful": 0,
            "failed": 0,
            "timeouts": 0,
            "retried": 0,
        }

        self._status_codes: dict[int, int] = {}

        self._errors: dict[str, int] = {}

        self._latencies: list[float] = []

        self._active_requests = 0

        self._cases = self._load_cases()

        self._calculate_planned_requests()

    # ---------------------------------------------------------
    # CASES
    # ---------------------------------------------------------

    def _load_cases(self) -> dict[str, Any]:

        try:
            with open(
                CASES_FILE,
                "r",
                encoding="utf-8",
            ) as file:
                return json.load(file)

        except Exception as exc:
            raise RuntimeError(
                f"Unable to load SQLi cases: {exc}"
            ) from exc

    def show_cases(self) -> list[dict[str, Any]]:

        return [
            {
                "id": case_id,
                **case,
            }
            for case_id, case in self._cases.items()
            if case.get("enabled", True)
        ]

    # ---------------------------------------------------------
    # TARGET
    # ---------------------------------------------------------

    def _build_url(self) -> str:

        base_url = self.target["base_url"].rstrip("/")

        endpoint = self.target["endpoint"]

        if not endpoint.startswith("/"):
            endpoint = f"/{endpoint}"

        return f"{base_url}{endpoint}"

    def _build_request(
        self,
        parameter_location: str,
        parameter_name: str,
        value: Any,
    ) -> dict[str, Any]:

        target = copy.deepcopy(self.target)
        request = copy.deepcopy(self.request)

        if parameter_location == "query":

            query_params = (
                target.get("query_params")
                or {}
            )

            query_params[parameter_name] = value

            target["query_params"] = query_params

        elif parameter_location == "path":

            path_params = (
                target.get("path_params")
                or {}
            )

            path_params[parameter_name] = value

            target["path_params"] = path_params

        elif parameter_location == "body":

            body = request.get("body")

            if body is None:
                body = {}

            body[parameter_name] = value

            request["body"] = body

        return {
            "target": target,
            "request": request,
        }

    # ---------------------------------------------------------
    # PARAMETERS
    # ---------------------------------------------------------

    def _get_parameters(self):

        parameters = []

        query_params = (
            self.target.get("query_params")
            or {}
        )

        for name, value in query_params.items():

            parameters.append(
                {
                    "location": "query",
                    "name": name,
                    "value": value,
                }
            )

        path_params = (
            self.target.get("path_params")
            or {}
        )

        for name, value in path_params.items():

            parameters.append(
                {
                    "location": "path",
                    "name": name,
                    "value": value,
                }
            )

        body = self.request.get("body")

        if isinstance(body, dict):

            for name, value in body.items():

                parameters.append(
                    {
                        "location": "body",
                        "name": name,
                        "value": value,
                    }
                )

        return parameters

    # ---------------------------------------------------------
    # PLANNING
    # ---------------------------------------------------------

    def _calculate_planned_requests(self):

        parameters = self._get_parameters()

        planned = 0

        for case in self._cases.values():
            if not case.get("enabled", True):
                continue

            # A case can contain multiple probes.  Every probe is
            # executed requests_per_case times for every parameter.
            probes = case.get("probes", [])

            planned += (
                len(parameters)
                * len(probes)
                * self.requests_per_case
            )

        self._stats["planned_requests"] = planned

    # ---------------------------------------------------------
    # URL PATH PARAMETER REPLACEMENT
    # ---------------------------------------------------------

    def _resolve_endpoint(
        self,
        endpoint: str,
        path_params: dict[str, Any] | None,
    ) -> str:

        if not path_params:
            return endpoint

        for name, value in path_params.items():

            endpoint = endpoint.replace(
                "{" + name + "}",
                str(value),
            )

        return endpoint

    # ---------------------------------------------------------
    # REQUEST
    # ---------------------------------------------------------

    async def _send_request(
        self,
        client: httpx.AsyncClient,
        test_request: dict[str, Any],
    ) -> dict[str, Any]:

        target = test_request["target"]
        request = test_request["request"]

        endpoint = self._resolve_endpoint(
            target["endpoint"],
            target.get("path_params"),
        )

        url = (
            target["base_url"].rstrip("/")
            + "/"
            + endpoint.lstrip("/")
        )

        method = target["method"].upper()

        headers = request.get("headers")

        headers = headers or {}

        auth = request.get("auth")

        body = request.get("body")

        query_params = (
            target.get("query_params")
            or {}
        )

        started = time.perf_counter()

        async with self._lock:
            self._active_requests += 1

        try:

            response = await client.request(
                method=method,
                url=url,
                params=query_params,
                headers=headers,
                auth=auth,
                json=body,
            )

            latency = (
                time.perf_counter()
                - started
            ) * 1000

            return {
                "ok": True,
                "status_code": response.status_code,
                "latency_ms": latency,
                "response_size": len(
                    response.content
                ),
                "response_preview": (
                    response.text[:500]
                    if response.text
                    else ""
                ),
                # Keep the complete response internally for analysis.
                # It is intentionally not exposed through get_status().
                "_response_text": response.text,
            }

        except httpx.TimeoutException as exc:

            return {
                "ok": False,
                "timeout": True,
                "error": str(exc),
            }

        except Exception as exc:

            return {
                "ok": False,
                "timeout": False,
                "error": str(exc),
            }

        finally:
            async with self._lock:
                self._active_requests = max(
                    0,
                    self._active_requests - 1,
                )

    # ---------------------------------------------------------
    # RESULT ANALYSIS
    # ---------------------------------------------------------

    def _analyze_result(
        self,
        baseline: dict[str, Any] | None,
        result: dict[str, Any],
        case: dict[str, Any],
    ) -> dict[str, Any]:

        if not result.get("ok"):
            return {
                "finding": "request_failed",
                "confidence": "low",
            }

        status_code = result.get("status_code")

        preview = (
            result.get("response_preview") or ""
        ).lower()

        full_text = (
            result.get("_response_text")
            or result.get("response_preview")
            or ""
        )

        # -----------------------------------------------------
        # Authentication-bypass detection
        # -----------------------------------------------------
        #
        # Prefer explicit JSON success semantics when present.
        # This works with the vulnerable FastAPI test target while
        # remaining generic for other JSON APIs.
        baseline_text = ""
        if baseline:
            baseline_text = (
                baseline.get("_response_text")
                or baseline.get("response_preview")
                or ""
            )

        def _json_object(value: str) -> dict[str, Any] | None:
            try:
                parsed = json.loads(value)
                return parsed if isinstance(parsed, dict) else None
            except (TypeError, ValueError):
                return None

        baseline_json = _json_object(baseline_text)
        result_json = _json_object(full_text)

        if baseline_json is not None and result_json is not None:
            baseline_success = baseline_json.get("success")
            result_success = result_json.get("success")

            if baseline_success is False and result_success is True:
                return {
                    "finding": "authentication_bypass",
                    "confidence": "high",
                }

        # Generic login-success indicators for APIs that do not expose
        # a boolean success field.
        success_markers = (
            "login successful",
            "authentication successful",
            "authenticated",
            "welcome",
        )
        failure_markers = (
            "invalid username",
            "invalid password",
            "invalid credentials",
            "login failed",
            "authentication failed",
            "unauthorized",
        )

        baseline_lower = baseline_text.lower()

        baseline_failed = (
            any(marker in baseline_lower for marker in failure_markers)
            or (
                baseline_json is not None
                and baseline_json.get("success") is False
            )
        )

        result_succeeded = (
            any(marker in full_text.lower() for marker in success_markers)
            or (
                result_json is not None
                and result_json.get("success") is True
            )
        )

        if baseline_failed and result_succeeded:
            return {
                "finding": "authentication_bypass",
                "confidence": "high",
            }

        # -----------------------------------------------------
        # Error-based SQLi detection
        # -----------------------------------------------------

        indicators = [
            "sql syntax",
            "sql error",
            "syntax error",
            "database error",
            "mysql",
            "postgresql",
            "postgres",
            "sqlite",
            "microsoft sql server",
            "ora-",
        ]

        if any(indicator in preview for indicator in indicators):
            return {
                "finding": "possible_sql_error",
                "confidence": "medium",
            }

        # -----------------------------------------------------
        # Generic response behavior change
        # -----------------------------------------------------

        if baseline:
            baseline_status = baseline.get("status_code")

            if (
                status_code is not None
                and baseline_status is not None
                and status_code != baseline_status
            ):
                return {
                    "finding": "response_behavior_changed",
                    "confidence": "low",
                }

            baseline_size = baseline.get("response_size")
            result_size = result.get("response_size")

            if (
                baseline_size is not None
                and result_size is not None
                and baseline_size != result_size
            ):
                # Size-only changes are weak evidence; do not label them
                # as SQLi by themselves.
                return {
                    "finding": "response_behavior_changed",
                    "confidence": "low",
                }

        return {
            "finding": "no_indicator",
            "confidence": "none",
        }

    # ---------------------------------------------------------
    # CASE EXECUTION
    # ---------------------------------------------------------

    async def _run_case(
        self,
        client: httpx.AsyncClient,
        case_id: str,
        case: dict[str, Any],
        parameter: dict[str, Any],
    ):

        location = parameter["location"]
        name = parameter["name"]
        original_value = parameter["value"]

        probes = case.get("probes", [])

        for probe in probes:

            if self.stop_event.is_set():
                return

            baseline_request = self._build_request(
                location,
                name,
                original_value,
            )

            baseline = await self._send_request(
                client,
                baseline_request,
            )

            probe_value = probe["value"]

            test_request = self._build_request(
                location,
                name,
                probe_value,
            )

            for _ in range(
                self.requests_per_case
            ):

                if self.stop_event.is_set():
                    return

                started = time.perf_counter()

                result = await self._send_request(
                    client,
                    test_request,
                )

                elapsed = (
                    time.perf_counter()
                    - started
                ) * 1000

                await self._record_result(
                    case_id=case_id,
                    parameter=parameter,
                    probe=probe,
                    result=result,
                    elapsed_ms=elapsed,
                    baseline=baseline,
                )

                if self.delay > 0:
                    await asyncio.sleep(
                        self.delay
                    )

    # ---------------------------------------------------------
    # RECORDING
    # ---------------------------------------------------------

    async def _record_result(
        self,
        case_id: str,
        parameter: dict[str, Any],
        probe: dict[str, Any],
        result: dict[str, Any],
        elapsed_ms: float,
        baseline: dict[str, Any] | None,
    ):

        async with self._lock:

            self._stats[
                "attempted_requests"
            ] += 1

            self._latencies.append(
                elapsed_ms
            )

            if result.get("timeout"):

                self._stats[
                    "timeouts"
                ] += 1

            elif result.get("ok"):

                self._stats[
                    "successful"
                ] += 1

                status_code = result.get(
                    "status_code"
                )

                if status_code is not None:

                    self._status_codes[
                        status_code
                    ] = (
                        self._status_codes.get(
                            status_code,
                            0,
                        )
                        + 1
                    )

            else:

                self._stats[
                    "failed"
                ] += 1

                error = result.get(
                    "error",
                    "unknown",
                )

                self._errors[
                    error
                ] = (
                    self._errors.get(
                        error,
                        0,
                    )
                    + 1
                )

            analysis = self._analyze_result(
                baseline,
                result,
                self._cases[case_id],
            )

            self._results.append(
                {
                    "case": case_id,
                    "parameter": {
                        "location": parameter[
                            "location"
                        ],
                        "name": parameter[
                            "name"
                        ],
                    },
                    "probe": probe["name"],
                    "result": analysis,
                    "status_code": result.get(
                        "status_code"
                    ),
                    "latency_ms": elapsed_ms,
                }
            )

    # ---------------------------------------------------------
    # RUN
    # ---------------------------------------------------------

    async def run(self) -> dict[str, Any]:

        if self.status == "running":
            return self.get_status()

        self.status = "running"

        self.started_at = time.time()

        timeout = httpx.Timeout(
            self.timeout
        )

        try:

            async with httpx.AsyncClient(
                timeout=timeout,
                follow_redirects=False,
            ) as client:

                parameters = (
                    self._get_parameters()
                )

                for case_id, case in (
                    self._cases.items()
                ):

                    if not case.get(
                        "enabled",
                        True,
                    ):
                        continue

                    for parameter in parameters:

                        if self.stop_event.is_set():
                            break

                        try:

                            await self._run_case(
                                client,
                                case_id,
                                case,
                                parameter,
                            )

                        except Exception as exc:

                            self._errors[
                                str(exc)
                            ] = (
                                self._errors.get(
                                    str(exc),
                                    0,
                                )
                                + 1
                            )

                            if (
                                self.on_failure
                                == "stop"
                            ):
                                raise

                    if self.stop_event.is_set():
                        break

        except asyncio.CancelledError:

            self.stop_event.set()

            self.status = "stopped"

            raise

        except Exception as exc:

            self.status = "failed"

            self._errors[
                str(exc)
            ] = (
                self._errors.get(
                    str(exc),
                    0,
                )
                + 1
            )

        finally:

            if self.status == "running":

                if self.stop_event.is_set():
                    self.status = "stopped"
                else:
                    self.status = "completed"

            self.finished_at = time.time()

        return self.get_status()

    # ---------------------------------------------------------
    # START
    # ---------------------------------------------------------

    async def start(self) -> str:

        if self._task is not None:

            if not self._task.done():

                return self.attack_id

        self.stop_event.clear()

        # A completed attack object can be started again with the same API.
        # Reset run-specific counters/results so each run is self-contained.
        self._results.clear()
        self._latencies.clear()
        self._status_codes.clear()
        self._errors.clear()
        self._active_requests = 0

        for key in self._stats:
            self._stats[key] = 0

        self._calculate_planned_requests()

        self.status = "pending"

        self._task = asyncio.create_task(
            self.run()
        )

        return self.attack_id

    # ---------------------------------------------------------
    # STOP
    # ---------------------------------------------------------

    async def stop(self) -> dict[str, Any]:

        if self.status in {
            "completed",
            "failed",
            "stopped",
        }:

            return self.get_status()

        self.stop_event.set()

        self.status = "stopping"

        return {
            "attack_id": self.attack_id,
            "status": "stopping",
        }

    # ---------------------------------------------------------
    # STATUS
    # ---------------------------------------------------------

    def get_status(self) -> dict[str, Any]:

        now = time.time()

        if self.started_at is None:

            elapsed = 0

        else:

            end = (
                self.finished_at
                if self.finished_at
                else now
            )

            elapsed = end - self.started_at

        latencies = list(
            self._latencies
        )

        average = (
            statistics.mean(latencies)
            if latencies
            else 0
        )

        p50 = self._percentile(
            latencies,
            50,
        )

        p95 = self._percentile(
            latencies,
            95,
        )

        p99 = self._percentile(
            latencies,
            99,
        )

        rps = (
            self._stats[
                "attempted_requests"
            ] / elapsed
            if elapsed > 0
            else 0
        )

        findings = self._build_findings()

        return {
            "attack_id": self.attack_id,

            "status": self.status,

            "elapsed_seconds": elapsed,

            "progress": {
                "planned_requests": (
                    self._stats[
                        "planned_requests"
                    ]
                ),
                "attempted_requests": (
                    self._stats[
                        "attempted_requests"
                    ]
                ),
                "active_requests": self._active_requests,
            },

            "requests": {
                "successful": (
                    self._stats[
                        "successful"
                    ]
                ),
                "failed": (
                    self._stats[
                        "failed"
                    ]
                ),
                "timeouts": (
                    self._stats[
                        "timeouts"
                    ]
                ),
                "retried": (
                    self._stats[
                        "retried"
                    ]
                ),
            },

            "performance": {
                "requests_per_second": rps,
                "average_latency_ms": average,
                "p50_latency_ms": p50,
                "p95_latency_ms": p95,
                "p99_latency_ms": p99,
            },

            "status_codes": dict(
                self._status_codes
            ),

            "findings": findings,

            "errors": dict(
                self._errors
            ),
        }

    # ---------------------------------------------------------
    # FINDINGS
    # ---------------------------------------------------------

    def _build_findings(self):

        # Keep individual request results internally, but expose one
        # finding per unique case/parameter/probe/finding combination.
        # Repeated requests_per_case executions must not create duplicate
        # findings in the status payload.
        deduplicated: dict[
            tuple[str, str, str, str, str],
            dict[str, Any],
        ] = {}

        confidence_rank = {
            "none": 0,
            "low": 1,
            "medium": 2,
            "high": 3,
        }

        for result in self._results:
            finding = result.get("result", {})
            finding_name = finding.get("finding")

            if finding_name in {None, "no_indicator"}:
                continue

            parameter = result.get("parameter", {})

            key = (
                result.get("case", ""),
                parameter.get("location", ""),
                parameter.get("name", ""),
                result.get("probe", ""),
                finding_name,
            )

            existing = deduplicated.get(key)

            if existing is None:
                item = copy.deepcopy(result)
                item["occurrences"] = 1
                deduplicated[key] = item
                continue

            existing["occurrences"] += 1

            old_confidence = existing.get("result", {}).get(
                "confidence", "none"
            )
            new_confidence = finding.get("confidence", "none")

            if confidence_rank.get(new_confidence, 0) > confidence_rank.get(
                old_confidence, 0
            ):
                existing["result"]["confidence"] = new_confidence

        return list(deduplicated.values())

    # ---------------------------------------------------------
    # PERCENTILE
    # ---------------------------------------------------------

    @staticmethod
    def _percentile(
        values: list[float],
        percentile: float,
    ) -> float:

        if not values:
            return 0

        values = sorted(values)

        index = (
            percentile
            / 100
            * (len(values) - 1)
        )

        lower = int(index)

        upper = min(
            lower + 1,
            len(values) - 1,
        )

        fraction = index - lower

        return (
            values[lower]
            + (
                values[upper]
                - values[lower]
            )
            * fraction
        )

    # ---------------------------------------------------------
    # SSE STREAM
    # ---------------------------------------------------------

    async def stream(
        self,
        interval: float = 1.0,
    ) -> AsyncGenerator[
        dict[str, Any],
        None,
    ]:

        try:

            while True:

                yield self.get_status()

                if self.status in {
                    "completed",
                    "failed",
                    "stopped",
                }:
                    break

                await asyncio.sleep(
                    interval
                )

        finally:

            yield self.get_status()