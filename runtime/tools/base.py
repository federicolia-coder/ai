from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

from pydantic import BaseModel


class ToolDefinition(BaseModel):
    name: str
    description: str
    parameters: dict[str, Any]
    permissions: list[str] = []


@dataclass
class AttachedFile:
    name: str
    mime: str
    text: str = ""
    error: str = ""


@dataclass
class ToolContext:
    """Per-request data a tool may need: connector credentials and the user's attached files."""

    credentials: dict[str, dict[str, str]] = field(default_factory=dict)
    files: list[AttachedFile] = field(default_factory=list)


class Tool(ABC):
    @abstractmethod
    def definition(self) -> ToolDefinition:
        pass

    @abstractmethod
    async def execute(self, params: dict[str, Any], context: ToolContext | None = None) -> dict[str, Any]:
        pass
