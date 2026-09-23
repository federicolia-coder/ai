import asyncio
import logging
import time
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from runtime.config.settings import (
    RUNTIME_SECRET,
    MAX_CONCURRENT_REQUESTS,
    MAX_GENERATION_LENGTH,
)
from runtime.model.local_provider import LocalModelProvider
from runtime.model.provider import ModelProvider
from runtime.tools.registry import ToolRegistry
from runtime.plugins.calculator import CalculatorTool
from runtime.plugins.web_search import WebSearchTool
from runtime.plugins.http_request import HttpRequestTool
from runtime.plugins.files import FileReadTool, FileSearchTool
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

model: ModelProvider = LocalModelProvider()
tools = ToolRegistry()
agent: AgentLoop | None = None
semaphore: asyncio.Semaphore | None = None


@app.on_event("startup")
async def startup():
    global agent, semaphore
    tools.register(CalculatorTool())
    tools.register(WebSearchTool())
    tools.register(HttpRequestTool())
    tools.register(FileReadTool())
    tools.register(FileSearchTool())
    try:
        model.load()
    except Exception as e:
        logger.error("Failed to load model: %s", e)
    agent = AgentLoop(model, tools)
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)


def verify_auth(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer ") or auth[7:] != RUNTIME_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")


class ChatRequest(BaseModel):
    messages: list[dict[str, str]]
    tools: list[str] = Field(default_factory=list)
    max_tokens: int = Field(default=1024, le=MAX_GENERATION_LENGTH)
    user_id: str = ""


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

    if not agent or not semaphore:
        raise HTTPException(status_code=503, detail="Runtime not initialized")

    try:
        async with asyncio.timeout(120):
            async with semaphore:
                result = await agent.run(
                    messages=body.messages,
                    enabled_tools=body.tools if body.tools else None,
                    max_tokens=body.max_tokens,
                )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Request timed out")
    except Exception as e:
        logger.error("Chat error for user %s: %s", body.user_id, e)
        raise HTTPException(status_code=500, detail="Internal error")

    return result
