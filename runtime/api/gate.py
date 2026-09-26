import asyncio
from contextlib import asynccontextmanager


class GateFull(Exception):
    """No free slot arrived within the wait budget."""


class Gate:
    """Limits concurrent generations and how many requests may wait for one.

    A CPU model serves one or two answers at a time; without a bound, extra requests pile up
    and all of them time out. Past `max_waiting` the caller is told right away that Tarry is busy.
    """

    def __init__(self, slots: int, max_waiting: int):
        self.slots = max(1, slots)
        self.max_waiting = max(0, max_waiting)
        self.active = 0
        self.waiting = 0
        self._sem = asyncio.Semaphore(self.slots)

    def full(self) -> bool:
        return self.active + self.waiting >= self.slots + self.max_waiting

    def must_wait(self) -> bool:
        return self.active >= self.slots or self.waiting > 0

    @asynccontextmanager
    async def slot(self, wait_timeout: float):
        self.waiting += 1
        try:
            await asyncio.wait_for(self._sem.acquire(), wait_timeout)
        except asyncio.TimeoutError:
            raise GateFull() from None
        finally:
            self.waiting -= 1
        self.active += 1
        try:
            yield
        finally:
            self.active -= 1
            self._sem.release()
