import hashlib
import hmac
import json
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

import httpx

from runtime.plugins.connectors import common
from runtime.plugins.netutil import is_private_host
from runtime.tools.base import Tool, ToolContext, ToolDefinition

MAX_MESSAGE_CHARS = 4000


def sign(secret: str, body: bytes) -> str:
    return "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


class WebhookSendTool(Tool):
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name="webhook_send",
            description="Send a message to the user's configured webhook. Use ONLY when the user explicitly asks to send something.",
            parameters={
                "type": "object",
                "properties": {"message": {"type": "string", "description": "Text to send"}},
                "required": ["message"],
            },
        )

    async def execute(self, params: dict[str, Any], context: ToolContext | None = None) -> dict[str, Any]:
        url = common.credential(context, "webhook", "url")
        if not url:
            return common.not_connected("The webhook")
        message = str(params.get("message") or "").strip()
        if not message:
            return {"error": "message is required"}
        if len(message) > MAX_MESSAGE_CHARS:
            return {"error": f"message too long (max {MAX_MESSAGE_CHARS} characters)"}

        parsed = urlparse(url)
        if parsed.scheme != "https" or not parsed.hostname:
            return {"error": "The configured webhook URL is not a valid https URL."}
        if is_private_host(parsed.hostname):
            return {"error": "The webhook points to a private or unreachable address."}

        body = json.dumps(
            {"source": "tarry", "event": "message", "message": message, "sent_at": datetime.now(timezone.utc).isoformat()},
            ensure_ascii=False,
        ).encode()
        headers = {"Content-Type": "application/json", "User-Agent": "Tarry-Webhook/1.0"}
        secret = common.credential(context, "webhook", "secret")
        if secret:
            headers["X-Tarry-Signature"] = sign(secret, body)

        try:
            async with common.make_client() as client:
                resp = await client.post(url, content=body, headers=headers)
        except httpx.HTTPError:
            return {"error": "Could not reach the webhook (timeout or connection error)."}

        if 200 <= resp.status_code < 300:
            return {"sent": True, "status": resp.status_code}
        return {"sent": False, "error": f"The webhook responded with status {resp.status_code}"}
