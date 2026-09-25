import json

import pytest

from runtime.agent.loop import NUDGE, AgentLoop, _should_nudge
from runtime.model.provider import ModelProvider
from runtime.plugins.calculator import CalculatorTool
from runtime.plugins.connectors.webhook import WebhookSendTool
from runtime.plugins.files import FileReadTool, FileSearchTool
from runtime.tools.base import AttachedFile, ToolContext
from runtime.tools.registry import ToolRegistry

CALL_6x7 = '<tool_call>\n{"name": "calculate", "arguments": {"expression": "6*7"}}\n</tool_call>'
CALL_PERCENT = '<tool_call>\n{"name": "calculate", "arguments": {"expression": "2340 * 0.175"}}\n</tool_call>'


class ScriptedModel(ModelProvider):
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
        self.calls.append([dict(m) for m in messages])
        return {"content": self.replies.pop(0), "input_tokens": 10, "output_tokens": 5}


@pytest.fixture
def registry():
    r = ToolRegistry()
    for t in (CalculatorTool(), FileReadTool(), FileSearchTool(), WebhookSendTool()):
        r.register(t)
    return r


def system_prompt(model, call=0):
    return model.calls[call][0]["content"]


def run(model, registry, text, tools, context=None):
    return AgentLoop(model, registry).run([{"role": "system", "content": "S"}, {"role": "user", "content": text}], enabled_tools=tools, context=context)


# ---------- prompt ----------

@pytest.mark.asyncio
async def test_empty_tool_list_exposes_no_tools(registry):
    model = ScriptedModel(["Ciao!"])
    await run(model, registry, "hi", [])
    assert "<tools>" not in system_prompt(model)


@pytest.mark.asyncio
async def test_tools_use_qwen_native_layout(registry):
    model = ScriptedModel(["ok"])
    await run(model, registry, "hi", ["calculate"])
    prompt = system_prompt(model)
    assert "<tools>" in prompt and "</tools>" in prompt
    tool_lines = prompt.split("<tools>\n")[1].split("\n</tools>")[0].splitlines()
    declared = [json.loads(line)["function"]["name"] for line in tool_lines]
    assert declared == ["calculate"]
    assert "webhook_send" not in prompt
    assert "2340 * 0.175" in prompt  # percent example only when calculate is enabled


@pytest.mark.asyncio
async def test_calculate_example_absent_without_calculate(registry):
    model = ScriptedModel(["ok"])
    await run(model, registry, "hi", ["read_file"])
    assert "2340 * 0.175" not in system_prompt(model)


# ---------- tool round trip ----------

@pytest.mark.asyncio
async def test_tool_call_round_trip_keeps_native_turns(registry):
    model = ScriptedModel([CALL_6x7, "Fa 42."])
    result = await run(model, registry, "6*7?", ["calculate"])
    assert result["content"] == "Fa 42."
    assert result["tools_used"] == ["calculate"]
    assert result["steps"][0]["status"] == "ok"
    second = model.calls[1]
    assert second[-2] == {"role": "assistant", "content": CALL_6x7}
    assert second[-1] == {"role": "user", "content": "<tool_response>\nResult: 42\n</tool_response>"}


@pytest.mark.asyncio
async def test_disabled_tool_call_is_refused(registry):
    model = ScriptedModel(['<tool_call>{"name": "webhook_send", "arguments": {"message": "x"}}</tool_call>', "Non posso."])
    result = await run(model, registry, "manda", ["calculate"])
    assert result["steps"][0]["status"] == "error"
    assert "not available" in result["steps"][0]["result"]
    assert result["tools_used"] == []


@pytest.mark.asyncio
async def test_tool_returning_error_is_marked_error(registry):
    model = ScriptedModel(['<tool_call>{"name": "read_file", "arguments": {"filename": "x"}}</tool_call>', "Nessun file."])
    result = await run(model, registry, "leggi", ["read_file"])
    assert result["steps"][0]["status"] == "error"


@pytest.mark.asyncio
async def test_tool_call_limit(registry, monkeypatch):
    monkeypatch.setattr("runtime.agent.loop.MAX_TOOL_CALLS", 2)
    model = ScriptedModel([CALL_6x7, CALL_6x7, CALL_6x7, "fine"])
    result = await run(model, registry, "6*7?", ["calculate"])
    assert len(result["steps"]) == 2
    assert "tool_call" not in result["content"]


# ---------- nudge ----------

def test_should_nudge():
    enabled = {"calculate"}
    assert _should_nudge("Voglio calcolare questo valore per te.", "ciao", enabled)
    assert _should_nudge("Let me check that.", "ciao", enabled)
    assert _should_nudge("Circa 405 €.", "Quanto fa il 17,5% di 2.340 €?", enabled)
    assert _should_nudge("x", "calcola 3+4", enabled)
    assert not _should_nudge("Ciao! Come stai?", "ciao", enabled)
    assert not _should_nudge("La riunione è il 25/09.", "quando è la riunione del 25/09?", enabled)
    assert not _should_nudge("Circa 405 €.", "Quanto fa il 17,5% di 2.340 €?", {"search"})


@pytest.mark.asyncio
async def test_announcing_without_calling_gets_one_reminder(registry):
    announce = "Per calcolare usiamo la formula \\[ 2340 \\times 0.175 \\]. Voglio calcolare questo valore per te."
    model = ScriptedModel([announce, CALL_PERCENT, "Il 17,5% di 2.340 € è 409,50 €."])
    result = await run(model, registry, "Quanto fa il 17,5% di 2.340 €?", ["calculate"])
    assert result["content"] == "Il 17,5% di 2.340 € è 409,50 €."
    assert result["tools_used"] == ["calculate"]
    # The reminder was sent once and is not part of the transcript the final answer sees.
    assert model.calls[1][-1] == {"role": "user", "content": NUDGE}
    assert all(m["content"] != NUDGE for m in model.calls[2])
    assert all(announce not in m["content"] for m in model.calls[2])


@pytest.mark.asyncio
async def test_failed_reminder_keeps_original_answer(registry):
    model = ScriptedModel(["Circa 405 €.", "Mi dispiace, non posso."])
    result = await run(model, registry, "Quanto fa il 17,5% di 2.340 €?", ["calculate"])
    assert result["content"] == "Circa 405 €."
    assert len(model.calls) == 2


@pytest.mark.asyncio
async def test_no_reminder_after_a_tool_was_used(registry):
    model = ScriptedModel([CALL_PERCENT, "Voglio dirti che fa 409,50 €."])
    result = await run(model, registry, "Quanto fa il 17,5% di 2.340 €?", ["calculate"])
    assert result["content"] == "Voglio dirti che fa 409,50 €."
    assert len(model.calls) == 2


@pytest.mark.asyncio
async def test_no_reminder_for_small_talk(registry):
    model = ScriptedModel(["Ciao! Sono Tarry."])
    await run(model, registry, "ciao", ["calculate"])
    assert len(model.calls) == 1


# ---------- files ----------

@pytest.mark.asyncio
async def test_context_reaches_tools(registry):
    ctx = ToolContext(files=[AttachedFile(name="a.txt", mime="text/plain", text="x" * 5000)])
    model = ScriptedModel(['<tool_call>{"name": "read_file", "arguments": {"filename": "a.txt"}}</tool_call>', "Letto."])
    result = await run(model, registry, "leggi", ["read_file"], ctx)
    assert result["steps"][0]["status"] == "ok"
    assert "a.txt (5000 characters)" in system_prompt(model)
    assert "Use read_file" in system_prompt(model)


@pytest.mark.asyncio
async def test_small_files_are_inlined(registry):
    ctx = ToolContext(files=[AttachedFile(name="n.txt", mime="text/plain", text="segreto: 1234")])
    model = ScriptedModel(["ok"])
    await run(model, registry, "?", ["read_file"], ctx)
    assert '<file name="n.txt">\nsegreto: 1234\n</file>' in system_prompt(model)


@pytest.mark.asyncio
async def test_files_with_plugin_disabled_tell_user(registry):
    ctx = ToolContext(files=[AttachedFile(name="n.txt", mime="text/plain", text="abc")])
    model = ScriptedModel(["ok"])
    await run(model, registry, "?", [], ctx)
    prompt = system_prompt(model)
    assert "plugin is disabled" in prompt
    assert "abc" not in prompt


@pytest.mark.asyncio
async def test_unreadable_file_reason_in_prompt(registry):
    ctx = ToolContext(files=[AttachedFile(name="foto.png", mime="image/png", error="è un'immagine")])
    model = ScriptedModel(["ok"])
    await run(model, registry, "?", ["read_file"], ctx)
    assert "foto.png: cannot be read (è un'immagine)" in system_prompt(model)


@pytest.mark.asyncio
async def test_input_messages_are_not_mutated(registry):
    messages = [{"role": "system", "content": "S"}, {"role": "user", "content": "hi"}]
    await AgentLoop(ScriptedModel(["ok"]), registry).run(messages, enabled_tools=["calculate"])
    assert messages[0]["content"] == "S"
