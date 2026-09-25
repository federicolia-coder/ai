import os
from typing import Any
from urllib.parse import urlparse

import httpx

from runtime.plugins.netutil import is_private_host
from runtime.tools.base import Tool, ToolContext, ToolDefinition

ALLOWED_HOSTS = [h.strip() for h in os.getenv("HTTP_ALLOWED_HOSTS", "").split(",") if h.strip()]
MAX_RESPONSE_SIZE = 50_000


def _is_private_ip(host: str) -> bool:
    return is_private_host(host)


class HttpRequestTool(Tool):
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name="request",
            description="Make an HTTP GET or POST request to a public external API and return the response body.",
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

    async def execute(self, params: dict[str, Any], context: ToolContext | None = None) -> dict[str, Any]:
        url = params.get("url", "")
        method = params.get("method", "GET").upper()
        headers = params.get("headers") or {}
        body = params.get("body")
        if not isinstance(headers, dict):
            return {"error": "headers must be an object"}
        headers = {str(k): str(v) for k, v in headers.items()}

        parsed = urlparse(url)

        if not parsed.scheme or parsed.scheme not in ("http", "https"):
            return {"error": "Only HTTP/HTTPS URLs are allowed"}

        if not parsed.hostname:
            return {"error": "Invalid URL"}

        hostname = parsed.hostname.lower()

        if ALLOWED_HOSTS and hostname not in ALLOWED_HOSTS:
            return {"error": f"Host not in allowlist: {hostname}"}

        if _is_private_ip(hostname):
            return {"error": "Private/internal addresses are not allowed"}

        if method not in ("GET", "POST"):
            return {"error": "Only GET and POST methods are supported"}

        try:
            # Redirects are not followed: each hop would need its own private-address check.
            async with httpx.AsyncClient(timeout=15, follow_redirects=False) as client:
                if method == "GET":
                    resp = await client.get(url, headers=headers)
                else:
                    resp = await client.post(url, headers=headers, json=body)

                if resp.is_redirect:
                    return {
                        "status": resp.status_code,
                        "redirect_to": resp.headers.get("location", ""),
                        "note": "Redirect not followed; request the new URL explicitly if needed.",
                    }
                content = resp.text[:MAX_RESPONSE_SIZE]
                return {
                    "status": resp.status_code,
                    "content_type": resp.headers.get("content-type", ""),
                    "body": content,
                    "truncated": len(resp.text) > MAX_RESPONSE_SIZE,
                }
        except Exception as e:
            return {"error": str(e)}
