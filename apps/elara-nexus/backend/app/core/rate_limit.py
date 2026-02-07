import time
from collections import deque
from dataclasses import dataclass, field


@dataclass(slots=True)
class WindowCounter:
    timestamps: deque[float] = field(default_factory=deque)

    def add_and_check(self, now: float, window_seconds: int, limit: int) -> bool:
        while self.timestamps and now - self.timestamps[0] > window_seconds:
            self.timestamps.popleft()
        if len(self.timestamps) >= limit:
            return False
        self.timestamps.append(now)
        return True


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._buckets: dict[str, WindowCounter] = {}

    def allow(self, key: str, window_seconds: int, limit: int) -> bool:
        counter = self._buckets.setdefault(key, WindowCounter())
        return counter.add_and_check(time.time(), window_seconds, limit)
