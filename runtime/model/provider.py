from abc import ABC, abstractmethod
from typing import Any


class ModelProvider(ABC):
    @abstractmethod
    def load(self) -> None:
        pass

    @abstractmethod
    def generate(
        self,
        messages: list[dict[str, str]],
        max_tokens: int = 1024,
        temperature: float = 0.7,
        stop: list[str] | None = None,
    ) -> dict[str, Any]:
        pass

    @abstractmethod
    def is_loaded(self) -> bool:
        pass

    @abstractmethod
    def unload(self) -> None:
        pass
