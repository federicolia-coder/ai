import pytest
from runtime.tools.registry import ToolRegistry
from runtime.plugins.calculator import CalculatorTool


@pytest.fixture
def registry():
    r = ToolRegistry()
    r.register(CalculatorTool())
    return r


def test_register_and_get(registry):
    tool = registry.get("calculate")
    assert tool is not None


def test_get_unknown_returns_none(registry):
    assert registry.get("nonexistent") is None


def test_available_tools(registry):
    tools = registry.available_tools()
    assert "calculate" in tools


def test_list_definitions(registry):
    defs = registry.list_definitions()
    assert len(defs) >= 1
    assert defs[0]["name"] == "calculate"


def test_list_definitions_filtered(registry):
    defs = registry.list_definitions(["calculate"])
    assert len(defs) == 1

    defs = registry.list_definitions(["nonexistent"])
    assert len(defs) == 0
