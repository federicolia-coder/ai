import logging
from typing import Any

from runtime.tools.base import Tool, ToolDefinition

logger = logging.getLogger(__name__)


class ToolRegistry:
    def __init__(self):
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool) -> None:
        defn = tool.definition()
        self._tools[defn.name] = tool
        logger.info("Registered tool: %s", defn.name)

    def get(self, name: str) -> Tool | None:
        return self._tools.get(name)

    def list_definitions(self, enabled: list[str] | None = None) -> list[dict[str, Any]]:
        defs = []
        for name, tool in self._tools.items():
            if enabled is not None and name not in enabled:
                continue
            defn = tool.definition()
            defs.append({
                "name": defn.name,
                "description": defn.description,
                "parameters": defn.parameters,
            })
        return defs

    def available_tools(self) -> list[str]:
        return list(self._tools.keys())
