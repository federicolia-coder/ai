import pytest

from runtime.agent.loop import NUDGE, AgentLoop, StreamFilter
from runtime.model.provider import ModelProvider
from runtime.plugins.calculator import CalculatorTool
from runtime.tools.registry import ToolRegistry


def run_filter(pieces):
    f = StreamFilter()
    events = []
    for p in pieces:
        events += f.feed(p)
    events += f.finish()
    return f, events


def shown(events):
    text = ""
    for e in events:
        if e["type"] == "token":
            text += e["text"]
        elif e["type"] == "discard":
            text = ""
    return text


def test_plain_answer_streams_everything():
    _, events = run_filter(["Ciao", ", sono ", "Tarry."])
    assert shown(events) == "Ciao, sono Tarry."
    assert all(e["type"] == "token" for e in events)


def test_leading_whitespace_is_not_shown():
    _, events = run_filter(["\n\n", "  Ciao"])
    assert shown(events) == "Ciao"


def test_tool_call_is_never_shown_even_split_across_tokens():
    f, events = run_filter(["<to", "ol_", "call>\n{\"name\": \"calculate\"}", "\n</tool_call>"])
    assert events == []
    assert f.mode == "tool"


def test_text_then_tool_call_discards_the_draft():
    f, events = run_filter(["Adesso calcolo il valore per te. ", "<tool", "_call>{}</tool_call>"])
    assert events[-1] == {"type": "discard"}
    assert shown(events) == ""
    assert f.mode == "tool"


def test_less_than_sign_in_normal_text_is_released():
    _, events = run_filter(["Se x ", "<", " 3 allora va bene."])
    assert shown(events) == "Se x < 3 allora va bene."


def test_text_is_held_back_only_by_tag_length():
    f = StreamFilter()
    text = "Una risposta abbastanza lunga"
    events = f.feed(text)
    assert shown(events) == text[: -(len("<tool_call>") - 1)]
    assert shown(events + f.finish()) == "Una risposta abbastanza lunga"


class ChunkedModel(ModelProvider):
    """Streams each scripted reply two characters at a time."""

    def __init__(self, replies):
        self.replies = list(replies)
        self.calls = []

    def load(self):
        pass

    def is_loaded(self):
        return True

    def unload(self):
        pass

    def generate(self, messages, max_tokens=1024, temperature=0.7, stop=None):
        raise AssertionError("streaming path must not call generate")

    def stream(self, messages, max_tokens=1024, temperature=0.7, usage=None):
        self.calls.append([dict(m) for m in messages])
        reply = self.replies.pop(0)
        if usage is not None:
            usage["input_tokens"], usage["output_tokens"] = 100, len(reply)
        for i in range(0, len(reply), 2):
            yield reply[i:i + 2]


@pytest.fixture
def registry():
    r = ToolRegistry()
    r.register(CalculatorTool())
    return r


async def collect(model, registry, question):
    loop = AgentLoop(model, registry)
    msgs = [{"role": "system", "content": "S"}, {"role": "user", "content": question}]
    return [e async for e in loop.run_events(msgs, ["calculate"])]


@pytest.mark.asyncio
async def test_events_for_a_tool_round_trip(registry):
    model = ChunkedModel([
        '<tool_call>\n{"name": "calculate", "arguments": {"expression": "2340 * 0.175"}}\n</tool_call>',
        "Il 17,5% di 2.340 € è 409,50 €.",
    ])
    events = await collect(model, registry, "Quanto fa il 17,5% di 2.340 €?")
    kinds = [e["type"] for e in events]
    assert kinds[0] == "step"
    assert events[0]["step"]["tool"] == "calculate" and events[0]["step"]["status"] == "ok"
    assert kinds[-1] == "done"
    assert shown(events) == "Il 17,5% di 2.340 € è 409,50 €."
    result = events[-1]["result"]
    assert result["content"] == "Il 17,5% di 2.340 € è 409,50 €."
    assert result["input_tokens"] == 200


@pytest.mark.asyncio
async def test_nudged_announcement_is_discarded_from_the_screen(registry):
    model = ChunkedModel([
        "Voglio calcolare questo valore per te.",
        '<tool_call>{"name": "calculate", "arguments": {"expression": "2340 * 0.175"}}</tool_call>',
        "Fa 409,50 €.",
    ])
    events = await collect(model, registry, "Quanto fa il 17,5% di 2.340 €?")
    kinds = [e["type"] for e in events]
    assert "discard" in kinds
    assert kinds.index("discard") < kinds.index("step")
    assert shown(events) == "Fa 409,50 €."
    assert model.calls[1][-1]["content"] == NUDGE


@pytest.mark.asyncio
async def test_exactly_one_done_event(registry):
    model = ChunkedModel(["Ciao!"])
    events = await collect(model, registry, "ciao")
    assert [e["type"] for e in events].count("done") == 1
    assert events[-1]["result"]["content"] == "Ciao!"


@pytest.mark.asyncio
async def test_generation_runs_off_the_event_loop(registry):
    import asyncio
    import threading

    main = threading.get_ident()
    seen = []

    class ThreadCheck(ChunkedModel):
        def stream(self, *a, **k):
            seen.append(threading.get_ident())
            yield from super().stream(*a, **k)

    await asyncio.wait_for(collect(ThreadCheck(["ok"]), registry, "ciao"), timeout=5)
    assert seen and seen[0] != main
