import os
from typing import Any

import httpx

from runtime.tools.base import Tool, ToolDefinition

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

    async def execute(self, params: dict[str, Any]) -> dict[str, Any]:
        query = params.get("query", "")
        count = min(params.get("count", 3), 5)

        if not WEB_SEARCH_API_KEY:
            return {"error": "Web search not configured", "results": []}

        try:
            if WEB_SEARCH_PROVIDER == "brave":
                return await self._brave_search(query, count)
            return {"error": f"Unknown provider: {WEB_SEARCH_PROVIDER}", "results": []}
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
