from abc import ABC, abstractmethod
from typing import Any
from pydantic import BaseModel


class ToolDefinition(BaseModel):
    name: str
    description: str
    parameters: dict[str, Any]
    permissions: list[str] = []


class Tool(ABC):
    @abstractmethod
    def definition(self) -> ToolDefinition:
        pass

    @abstractmethod
    async def execute(self, params: dict[str, Any]) -> dict[str, Any]:
        pass
