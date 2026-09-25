import pytest

from runtime.agent.loop import AgentLoop, _signature
from runtime.model.provider import ModelProvider
from runtime.plugins.calculator import CalculatorTool
from runtime.plugins.connectors.webhook import WebhookSendTool
from runtime.plugins.files import FileReadTool, FileSearchTool
from runtime.tools.base import AttachedFile, ToolContext
from runtime.tools.registry import ToolRegistry


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


def system_prompt(model):
    return model.calls[0][0]["content"]


def test_signature_marks_optional_and_enums():
    schema = {
        "properties": {"repo": {"type": "string"}, "state": {"type": "string", "enum": ["open", "closed"]}},
        "required": ["repo"],
    }
    assert _signature("github_issues", schema) == "github_issues(repo: string, state?: open|closed)"


@pytest.mark.asyncio
async def test_empty_tool_list_exposes_no_tools(registry):
    model = ScriptedModel(["Ciao!"])
    await AgentLoop(model, registry).run([{"role": "system", "content": "S"}, {"role": "user", "content": "hi"}], enabled_tools=[])
    assert "Available tools" not in system_prompt(model)


@pytest.mark.asyncio
async def test_only_enabled_tools_are_described(registry):
    model = ScriptedModel(["ok"])
    await AgentLoop(model, registry).run([{"role": "user", "content": "hi"}], enabled_tools=["calculate"])
    prompt = system_prompt(model)
    assert "calculate(expression: string)" in prompt
    assert "webhook_send" not in prompt


@pytest.mark.asyncio
async def test_disabled_tool_call_is_refused(registry):
    model = ScriptedModel([
        '<tool_call>{"name": "webhook_send", "arguments": {"message": "x"}}</tool_call>',
        "Non posso.",
    ])
    result = await AgentLoop(model, registry).run([{"role": "user", "content": "manda"}], enabled_tools=["calculate"])
    assert result["steps"][0]["status"] == "error"
    assert "not available" in result["steps"][0]["result"]
    assert result["tools_used"] == []


@pytest.mark.asyncio
async def test_tool_call_round_trip(registry):
    model = ScriptedModel([
        '<tool_call>{"name": "calculate", "arguments": {"expression": "6*7"}}</tool_call>',
        "Fa 42.",
    ])
    result = await AgentLoop(model, registry).run([{"role": "user", "content": "6*7?"}], enabled_tools=["calculate"])
    assert result["content"] == "Fa 42."
    assert result["tools_used"] == ["calculate"]
    assert result["steps"][0]["status"] == "ok"
    assert "Result: 42.0" in model.calls[1][-1]["content"]


@pytest.mark.asyncio
async def test_tool_returning_error_is_marked_error(registry):
    model = ScriptedModel([
        '<tool_call>{"name": "read_file", "arguments": {"filename": "x"}}</tool_call>',
        "Nessun file.",
    ])
    result = await AgentLoop(model, registry).run([{"role": "user", "content": "leggi"}], enabled_tools=["read_file"])
    assert result["steps"][0]["status"] == "error"


@pytest.mark.asyncio
async def test_context_reaches_tools(registry):
    ctx = ToolContext(files=[AttachedFile(name="a.txt", mime="text/plain", text="x" * 5000)])
    model = ScriptedModel([
        '<tool_call>{"name": "read_file", "arguments": {"filename": "a.txt"}}</tool_call>',
        "Letto.",
    ])
    result = await AgentLoop(model, registry).run([{"role": "user", "content": "leggi"}], enabled_tools=["read_file"], context=ctx)
    assert result["steps"][0]["status"] == "ok"
    assert "a.txt (5000 characters)" in system_prompt(model)
    assert "Use read_file" in system_prompt(model)


@pytest.mark.asyncio
async def test_small_files_are_inlined(registry):
    ctx = ToolContext(files=[AttachedFile(name="n.txt", mime="text/plain", text="segreto: 1234")])
    model = ScriptedModel(["ok"])
    await AgentLoop(model, registry).run([{"role": "user", "content": "?"}], enabled_tools=["read_file"], context=ctx)
    assert '<file name="n.txt">\nsegreto: 1234\n</file>' in system_prompt(model)


@pytest.mark.asyncio
async def test_files_with_plugin_disabled_tell_user(registry):
    ctx = ToolContext(files=[AttachedFile(name="n.txt", mime="text/plain", text="abc")])
    model = ScriptedModel(["ok"])
    await AgentLoop(model, registry).run([{"role": "user", "content": "?"}], enabled_tools=[], context=ctx)
    prompt = system_prompt(model)
    assert "plugin is disabled" in prompt
    assert "abc" not in prompt


@pytest.mark.asyncio
async def test_unreadable_file_reason_in_prompt(registry):
    ctx = ToolContext(files=[AttachedFile(name="foto.png", mime="image/png", error="è un'immagine")])
    model = ScriptedModel(["ok"])
    await AgentLoop(model, registry).run([{"role": "user", "content": "?"}], enabled_tools=["read_file"], context=ctx)
    assert "foto.png: cannot be read (è un'immagine)" in system_prompt(model)


@pytest.mark.asyncio
async def test_input_messages_are_not_mutated(registry):
    messages = [{"role": "system", "content": "S"}, {"role": "user", "content": "hi"}]
    await AgentLoop(ScriptedModel(["ok"]), registry).run(messages, enabled_tools=["calculate"])
    assert messages[0]["content"] == "S"
