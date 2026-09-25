from typing import Any

import httpx

from runtime.tools.base import ToolContext

TIMEOUT = httpx.Timeout(15.0, connect=8.0)


def make_client(**kwargs: Any) -> httpx.AsyncClient:
    """Single construction point so tests can swap in a mock transport."""
    return httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=False, **kwargs)


def credential(context: ToolContext | None, connector: str, key: str) -> str:
    if not context:
        return ""
    value = context.credentials.get(connector, {}).get(key, "")
    return value.strip() if isinstance(value, str) else ""


def not_connected(label: str) -> dict[str, Any]:
    return {"error": f"{label} is not connected. Ask the user to connect it in the Connettori page."}


def truncate(text: str, limit: int) -> str:
    return text if len(text) <= limit else text[:limit] + "…"
