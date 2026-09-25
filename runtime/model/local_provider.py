import logging
from collections.abc import Iterator
from typing import Any

from llama_cpp import Llama

from runtime.config.settings import MODEL_PATH, MAX_CONTEXT_LENGTH, MODEL_THREADS
from runtime.model.provider import ModelProvider

logger = logging.getLogger(__name__)


class LocalModelProvider(ModelProvider):
    def __init__(self):
        self._model: Llama | None = None

    def load(self) -> None:
        logger.info("Loading model from %s", MODEL_PATH)
        self._model = Llama(
            model_path=MODEL_PATH,
            n_ctx=MAX_CONTEXT_LENGTH,
            n_threads=MODEL_THREADS,
            n_threads_batch=MODEL_THREADS,
            n_gpu_layers=0,
            verbose=False,
            chat_format="chatml",
        )
        logger.info("Model loaded successfully")

    def generate(
        self,
        messages: list[dict[str, str]],
        max_tokens: int = 1024,
        temperature: float = 0.7,
        stop: list[str] | None = None,
    ) -> dict[str, Any]:
        if not self._model:
            raise RuntimeError("Model not loaded")

        response = self._model.create_chat_completion(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=0.9,
            min_p=0.05,
            stop=stop or [],
            repeat_penalty=1.05,
            frequency_penalty=0.0,
        )

        choice = response["choices"][0]
        usage = response.get("usage", {})

        return {
            "content": choice["message"]["content"],
            "finish_reason": choice.get("finish_reason", "stop"),
            "input_tokens": usage.get("prompt_tokens", 0),
            "output_tokens": usage.get("completion_tokens", 0),
            "total_tokens": usage.get("total_tokens", 0),
        }

    def stream(
        self,
        messages: list[dict[str, str]],
        max_tokens: int = 1024,
        temperature: float = 0.7,
        usage: dict[str, int] | None = None,
    ) -> Iterator[str]:
        if not self._model:
            raise RuntimeError("Model not loaded")

        chunks = self._model.create_chat_completion(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=0.9,
            min_p=0.05,
            repeat_penalty=1.05,
            stream=True,
        )
        produced = 0
        for chunk in chunks:
            piece = chunk["choices"][0].get("delta", {}).get("content")
            if piece:
                produced += 1
                yield piece
        if usage is not None:
            # Streaming chunks carry no usage; the context now holds prompt + completion tokens.
            usage["output_tokens"] = produced
            usage["input_tokens"] = max(self._model.n_tokens - produced, 0)

    def is_loaded(self) -> bool:
        return self._model is not None

    def unload(self) -> None:
        self._model = None
        logger.info("Model unloaded")
