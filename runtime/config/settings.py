import os
from dotenv import load_dotenv

load_dotenv()

RUNTIME_HOST = os.getenv("RUNTIME_HOST", "0.0.0.0")
RUNTIME_PORT = int(os.getenv("RUNTIME_PORT", "8000"))
RUNTIME_SECRET = os.getenv("RUNTIME_SECRET", "")

MODEL_PATH = os.getenv("MODEL_PATH", "./model/weights/model.gguf")
# VPS vCPUs are usually not hyperthread pairs, so default to all of them; override with MODEL_THREADS.
MODEL_THREADS = int(os.getenv("MODEL_THREADS") or os.cpu_count() or 4)
MAX_CONTEXT_LENGTH = int(os.getenv("MAX_CONTEXT_LENGTH", "4096"))
MAX_GENERATION_LENGTH = int(os.getenv("MAX_GENERATION_LENGTH", "1024"))
MAX_CONCURRENT_REQUESTS = int(os.getenv("MAX_CONCURRENT_REQUESTS", "2"))
# Requests allowed to wait for a free slot, and for how long, before Tarry answers "busy".
MAX_QUEUED_REQUESTS = int(os.getenv("MAX_QUEUED_REQUESTS") or 4)
QUEUE_TIMEOUT = int(os.getenv("QUEUE_TIMEOUT") or 30)
MAX_TOOL_CALLS = int(os.getenv("MAX_TOOL_CALLS", "5"))
TOOL_TIMEOUT = int(os.getenv("TOOL_TIMEOUT", "30"))
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT") or 120)

PLAN_TOKEN_LIMITS = {
    "free": 100_000,
    "plus": 2_000_000,
    "pro": 10_000_000,
}
