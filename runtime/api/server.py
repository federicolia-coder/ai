import asyncio
import json
import logging
import threading
import time
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from runtime.config.settings import (
    RUNTIME_SECRET,
    MAX_CONCURRENT_REQUESTS,
    MAX_GENERATION_LENGTH,
    MAX_QUEUED_REQUESTS,
    QUEUE_TIMEOUT,
    REQUEST_TIMEOUT,
)
from runtime.api.gate import Gate, GateFull
from runtime.model.local_provider import LocalModelProvider
from runtime.model.provider import ModelProvider
from runtime.tools.registry import ToolRegistry
from runtime.plugins.calculator import CalculatorTool
from runtime.plugins.web_search import WebSearchTool
from runtime.plugins.http_request import HttpRequestTool
from runtime.plugins.files import FileReadTool, FileSearchTool
from runtime.plugins.extract import extract_file
from runtime.plugins.connectors.github import GitHubFileTool, GitHubIssuesTool, GitHubReposTool
from runtime.plugins.connectors.notion import NotionPageTool, NotionSearchTool
from runtime.plugins.connectors.webhook import WebhookSendTool
from runtime.tools.base import ToolContext
from runtime.agent.loop import AgentLoop

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Tarry Runtime", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_methods=["POST", "GET"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    # Default handler echoes the rejected input, which may contain credentials.
    errors = [{"loc": list(e.get("loc", [])), "msg": e.get("msg", "")} for e in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": errors})


model: ModelProvider = LocalModelProvider()
tools = ToolRegistry()
agent: AgentLoop | None = None
gate: Gate | None = None


@app.on_event("startup")
async def startup():
    global agent, gate
    tools.register(CalculatorTool())
    tools.register(WebSearchTool())
    tools.register(HttpRequestTool())
    tools.register(FileReadTool())
    tools.register(FileSearchTool())
    tools.register(GitHubReposTool())
    tools.register(GitHubIssuesTool())
    tools.register(GitHubFileTool())
    tools.register(NotionSearchTool())
    tools.register(NotionPageTool())
    tools.register(WebhookSendTool())
    try:
        model.load()
    except Exception as e:
        logger.error("Failed to load model: %s", e)
    agent = AgentLoop(model, tools)
    gate = Gate(MAX_CONCURRENT_REQUESTS, MAX_QUEUED_REQUESTS)


def verify_auth(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer ") or auth[7:] != RUNTIME_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")


MAX_FILES = 5
MAX_FILE_B64_CHARS = 8 * 1024 * 1024


class FilePayload(BaseModel):
    name: str = Field(max_length=255)
    mime: str = Field(default="", max_length=200)
    data: str = Field(default="", max_length=MAX_FILE_B64_CHARS)


class ChatRequest(BaseModel):
    messages: list[dict[str, str]]
    tools: list[str] = Field(default_factory=list)
    max_tokens: int = Field(default=1024, ge=1, le=MAX_GENERATION_LENGTH)
    user_id: str = ""
    credentials: dict[str, dict[str, str]] = Field(default_factory=dict)
    files: list[FilePayload] = Field(default_factory=list, max_length=MAX_FILES)

    def __repr__(self) -> str:
        return f"ChatRequest(user_id={self.user_id!r}, tools={self.tools!r}, files={len(self.files)})"

    __str__ = __repr__


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    tools_available: list[str]
    uptime_seconds: float


start_time = time.time()


@app.get("/health")
async def health():
    return HealthResponse(
        status="ok" if model.is_loaded() else "degraded",
        model_loaded=model.is_loaded(),
        tools_available=tools.available_tools(),
        uptime_seconds=round(time.time() - start_time, 1),
    )


@app.get("/status")
async def status():
    return {"status": "running"}


@app.post("/v1/chat")
async def chat(request: Request, body: ChatRequest):
    verify_auth(request)

    if not model.is_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded")

    if not agent or not gate:
        raise HTTPException(status_code=503, detail="Runtime not initialized")
    if gate.full():
        raise HTTPException(status_code=503, detail="busy")

    # Extraction is CPU-bound (PDF parsing), so keep it off the event loop.
    files = await asyncio.gather(
        *(asyncio.to_thread(extract_file, f.name, f.mime, f.data) for f in body.files)
    )
    context = ToolContext(credentials=body.credentials, files=list(files))

    try:
        async with gate.slot(QUEUE_TIMEOUT):
            async with asyncio.timeout(REQUEST_TIMEOUT):
                result = await agent.run(
                    messages=body.messages,
                    enabled_tools=body.tools,
                    max_tokens=body.max_tokens,
                    context=context,
                )
    except GateFull:
        raise HTTPException(status_code=503, detail="busy")
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Request timed out")
    except Exception as e:
        logger.error("Chat error for user %s: %s", body.user_id, e)
        raise HTTPException(status_code=500, detail="Internal error")

    return result


HEARTBEAT_SECONDS = 10


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


@app.post("/v1/chat/stream")
async def chat_stream(request: Request, body: ChatRequest):
    """Server-sent events: token / discard / step while working, then one done (or error) event."""
    verify_auth(request)

    if not model.is_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded")
    if not agent or not gate:
        raise HTTPException(status_code=503, detail="Runtime not initialized")
    if gate.full():
        raise HTTPException(status_code=503, detail="busy")

    files = await asyncio.gather(
        *(asyncio.to_thread(extract_file, f.name, f.mime, f.data) for f in body.files)
    )
    context = ToolContext(credentials=body.credentials, files=list(files))
    cancel = threading.Event()

    async def produce(queue: asyncio.Queue) -> None:
        try:
            if gate.must_wait():
                await queue.put({"type": "queued", "position": gate.waiting + 1})
            async with gate.slot(QUEUE_TIMEOUT):
                async with asyncio.timeout(REQUEST_TIMEOUT):
                    async for event in agent.run_events(
                        messages=body.messages,
                        enabled_tools=body.tools,
                        max_tokens=body.max_tokens,
                        context=context,
                        cancel=cancel,
                    ):
                        await queue.put(event)
        except GateFull:
            await queue.put({"type": "error", "error": "busy"})
        except asyncio.TimeoutError:
            await queue.put({"type": "error", "error": "timeout"})
        except Exception as e:
            logger.error("Chat stream error for user %s: %s", body.user_id, e)
            await queue.put({"type": "error", "error": "internal"})
        finally:
            await queue.put(None)

    async def events():
        queue: asyncio.Queue = asyncio.Queue()
        task = asyncio.create_task(produce(queue))
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=HEARTBEAT_SECONDS)
                except asyncio.TimeoutError:
                    # Prompt processing on CPU can take a while before the first token; keep proxies from closing.
                    yield ": ping\n\n"
                    continue
                if event is None:
                    break
                yield _sse(event)
        finally:
            # Client gone or stream finished: stop generating tokens nobody will read.
            cancel.set()
            if not task.done():
                task.cancel()

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
