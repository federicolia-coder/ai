import os
from typing import Any
from urllib.parse import urlparse

import httpx

from runtime.tools.base import Tool, ToolDefinition

ALLOWED_HOSTS = [h.strip() for h in os.getenv("HTTP_ALLOWED_HOSTS", "").split(",") if h.strip()]
MAX_RESPONSE_SIZE = 50_000


class HttpRequestTool(Tool):
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name="request",
            description="Make a controlled HTTP request to an external API.",
            parameters={
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "URL to request"},
                    "method": {
                        "type": "string",
                        "enum": ["GET", "POST"],
                        "default": "GET",
                    },
                    "headers": {
                        "type": "object",
                        "description": "Request headers",
                    },
                    "body": {
                        "type": "object",
                        "description": "JSON request body (POST only)",
                    },
                },
                "required": ["url"],
            },
            permissions=["http.request"],
        )

    async def execute(self, params: dict[str, Any]) -> dict[str, Any]:
        url = params.get("url", "")
        method = params.get("method", "GET").upper()
        headers = params.get("headers", {})
        body = params.get("body")

        parsed = urlparse(url)

        if not parsed.scheme or parsed.scheme not in ("http", "https"):
            return {"error": "Only HTTP/HTTPS URLs are allowed"}

        if not parsed.hostname:
            return {"error": "Invalid URL"}

        # SSRF protection
        hostname = parsed.hostname.lower()
        if hostname in ("localhost", "127.0.0.1", "0.0.0.0", "::1"):
            return {"error": "Local addresses are not allowed"}
        if hostname.startswith("10.") or hostname.startswith("192.168.") or hostname.startswith("172."):
            return {"error": "Private network addresses are not allowed"}

        if ALLOWED_HOSTS and hostname not in ALLOWED_HOSTS:
            return {"error": f"Host not in allowlist: {hostname}"}

        if method not in ("GET", "POST"):
            return {"error": "Only GET and POST methods are supported"}

        try:
            async with httpx.AsyncClient(timeout=15, follow_redirects=True, max_redirects=3) as client:
                if method == "GET":
                    resp = await client.get(url, headers=headers)
                else:
                    resp = await client.post(url, headers=headers, json=body)

                content = resp.text[:MAX_RESPONSE_SIZE]
                return {
                    "status": resp.status_code,
                    "headers": dict(resp.headers),
                    "body": content,
                    "truncated": len(resp.text) > MAX_RESPONSE_SIZE,
                }
        except Exception as e:
            return {"error": str(e)}
