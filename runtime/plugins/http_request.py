import ipaddress
import os
import socket
from typing import Any
from urllib.parse import urlparse

import httpx

from runtime.tools.base import Tool, ToolDefinition

ALLOWED_HOSTS = [h.strip() for h in os.getenv("HTTP_ALLOWED_HOSTS", "").split(",") if h.strip()]
MAX_RESPONSE_SIZE = 50_000


def _is_private_ip(host: str) -> bool:
    try:
        for info in socket.getaddrinfo(host, None, socket.AF_UNSPEC, socket.SOCK_STREAM):
            addr = info[4][0]
            ip = ipaddress.ip_address(addr)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                return True
    except (socket.gaierror, ValueError):
        return True
    return False


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

        hostname = parsed.hostname.lower()

        if ALLOWED_HOSTS and hostname not in ALLOWED_HOSTS:
            return {"error": f"Host not in allowlist: {hostname}"}

        if _is_private_ip(hostname):
            return {"error": "Private/internal addresses are not allowed"}

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
