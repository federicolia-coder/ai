import os
import re
from typing import Any
from urllib.parse import quote_plus

import httpx

from runtime.tools.base import Tool, ToolContext, ToolDefinition

WEB_SEARCH_API_KEY = os.getenv("WEB_SEARCH_API_KEY", "")
WEB_SEARCH_PROVIDER = os.getenv("WEB_SEARCH_PROVIDER", "brave")


class WebSearchTool(Tool):
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name="search",
            description="Search the web for current information on any topic.",
            parameters={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query",
                    },
                    "count": {
                        "type": "integer",
                        "description": "Number of results (1-5)",
                        "default": 3,
                    },
                },
                "required": ["query"],
            },
            permissions=["web.search"],
        )

    async def execute(self, params: dict[str, Any], context: ToolContext | None = None) -> dict[str, Any]:
        query = params.get("query", "")
        count = min(params.get("count", 3), 5)

        try:
            if WEB_SEARCH_API_KEY and WEB_SEARCH_PROVIDER == "brave":
                return await self._brave_search(query, count)
            return await self._ddg_search(query, count)
        except Exception as e:
            return {"error": str(e), "results": []}

    async def _brave_search(self, query: str, count: int) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                "https://api.search.brave.com/res/v1/web/search",
                params={"q": query, "count": count},
                headers={
                    "Accept": "application/json",
                    "X-Subscription-Token": WEB_SEARCH_API_KEY,
                },
            )
            response.raise_for_status()
            data = response.json()

            results = []
            for item in data.get("web", {}).get("results", [])[:count]:
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "snippet": item.get("description", ""),
                })

            return {"query": query, "results": results}

    async def _ddg_search(self, query: str, count: int) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            response = await client.get(
                "https://html.duckduckgo.com/html/",
                params={"q": query},
                headers={"User-Agent": "Tarry/1.0"},
            )
            response.raise_for_status()
            html = response.text

            results = []
            for match in re.finditer(
                r'<a[^>]+class="result__a"[^>]+href="([^"]*)"[^>]*>(.*?)</a>'
                r'.*?<a[^>]+class="result__snippet"[^>]*>(.*?)</a>',
                html,
                re.DOTALL,
            ):
                url = match.group(1)
                title = re.sub(r"<[^>]+>", "", match.group(2)).strip()
                snippet = re.sub(r"<[^>]+>", "", match.group(3)).strip()
                if url and title:
                    results.append({"title": title, "url": url, "snippet": snippet})
                if len(results) >= count:
                    break

            return {"query": query, "results": results}
