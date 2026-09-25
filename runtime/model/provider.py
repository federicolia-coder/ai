from abc import ABC, abstractmethod
from collections.abc import Iterator
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

    def stream(
        self,
        messages: list[dict[str, str]],
        max_tokens: int = 1024,
        temperature: float = 0.7,
        usage: dict[str, int] | None = None,
    ) -> Iterator[str]:
        """Yield the reply in pieces. Fills `usage` with input/output token counts when done.

        The default emits the whole reply at once; providers that can stream override it.
        """
        result = self.generate(messages=messages, max_tokens=max_tokens, temperature=temperature)
        if usage is not None:
            usage["input_tokens"] = result.get("input_tokens", 0)
            usage["output_tokens"] = result.get("output_tokens", 0)
        content = result.get("content", "")
        if content:
            yield content

    @abstractmethod
    def is_loaded(self) -> bool:
        pass

    @abstractmethod
    def unload(self) -> None:
        pass
