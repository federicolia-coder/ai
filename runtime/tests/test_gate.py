import asyncio

import pytest

from runtime.api.gate import Gate, GateFull


def test_gate_serialises_and_counts():
    async def main():
        gate = Gate(1, 2)
        order = []

        async def job(name, hold):
            async with gate.slot(1):
                order.append(f"start {name}")
                await asyncio.sleep(hold)
                order.append(f"end {name}")

        first = asyncio.create_task(job("a", 0.05))
        await asyncio.sleep(0.01)
        assert gate.active == 1 and gate.must_wait()
        second = asyncio.create_task(job("b", 0))
        await asyncio.sleep(0.01)
        assert gate.waiting == 1
        assert not gate.full()
        await asyncio.gather(first, second)
        assert order == ["start a", "end a", "start b", "end b"]
        assert gate.active == 0 and gate.waiting == 0 and not gate.must_wait()

    asyncio.run(main())


def test_gate_full_and_wait_timeout():
    async def main():
        gate = Gate(1, 1)
        release = asyncio.Event()

        async def hold():
            async with gate.slot(1):
                await release.wait()

        holder = asyncio.create_task(hold())
        await asyncio.sleep(0.01)
        with pytest.raises(GateFull):
            async with gate.slot(0.01):
                pass
        assert gate.waiting == 0
        waiter = asyncio.create_task(hold())
        await asyncio.sleep(0.01)
        assert gate.full()
        release.set()
        await asyncio.gather(holder, waiter)
        assert gate.active == 0

    asyncio.run(main())


def test_cancelled_waiter_leaves_no_trace():
    async def main():
        gate = Gate(1, 3)
        release = asyncio.Event()

        async def hold():
            async with gate.slot(5):
                await release.wait()

        holder = asyncio.create_task(hold())
        await asyncio.sleep(0.01)
        waiter = asyncio.create_task(hold())
        await asyncio.sleep(0.01)
        waiter.cancel()
        await asyncio.gather(waiter, return_exceptions=True)
        assert gate.waiting == 0
        release.set()
        await holder
        async with gate.slot(0.1):
            assert gate.active == 1

    asyncio.run(main())
