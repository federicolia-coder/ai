import re
from typing import Any

import httpx

from runtime.plugins.connectors import common
from runtime.tools.base import Tool, ToolContext, ToolDefinition

API = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"
ID_RE = re.compile(r"([0-9a-f]{32})$")
MAX_PAGE_CHARS = 2500

TEXT_BLOCKS = {
    "paragraph": "",
    "heading_1": "# ",
    "heading_2": "## ",
    "heading_3": "### ",
    "bulleted_list_item": "- ",
    "numbered_list_item": "1. ",
    "to_do": "",
    "quote": "> ",
    "callout": "",
    "toggle": "",
    "code": "",
}


def _headers(key: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {key}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }


def _error_for(resp: httpx.Response) -> dict[str, Any]:
    if resp.status_code == 401:
        return {"error": "Notion rejected the API key. The user must reconnect Notion."}
    if resp.status_code in (403, 404):
        return {"error": "Page not found, or not shared with the Tarry integration in Notion."}
    if resp.status_code == 429:
        return {"error": "Notion rate limit reached. Try again shortly."}
    return {"error": f"Notion error {resp.status_code}"}


def _plain(rich: list[dict[str, Any]] | None) -> str:
    return "".join(r.get("plain_text", "") for r in rich or [])


def _title(page: dict[str, Any]) -> str:
    for prop in (page.get("properties") or {}).values():
        if prop.get("type") == "title":
            return _plain(prop.get("title")) or "(senza titolo)"
    return _plain(page.get("title")) or "(senza titolo)"


def _page_id(raw: str) -> str | None:
    cleaned = raw.strip().split("?")[0].replace("-", "").lower()
    m = ID_RE.search(cleaned)
    return m.group(1) if m else None


class NotionSearchTool(Tool):
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name="notion_search",
            description="Search the user's Notion pages by title. Returns page ids to use with notion_page.",
            parameters={
                "type": "object",
                "properties": {"query": {"type": "string", "description": "Text to search for"}},
                "required": ["query"],
            },
        )

    async def execute(self, params: dict[str, Any], context: ToolContext | None = None) -> dict[str, Any]:
        key = common.credential(context, "notion", "api_key")
        if not key:
            return common.not_connected("Notion")
        query = str(params.get("query") or "").strip()
        body = {
            "query": query,
            "filter": {"property": "object", "value": "page"},
            "page_size": 10,
        }
        async with common.make_client() as client:
            resp = await client.post(f"{API}/search", headers=_headers(key), json=body)
        if resp.status_code != 200:
            return _error_for(resp)
        pages = [
            {"id": p.get("id"), "title": _title(p), "url": p.get("url"), "edited": (p.get("last_edited_time") or "")[:10]}
            for p in resp.json().get("results", [])
        ]
        result: dict[str, Any] = {"query": query, "count": len(pages), "pages": pages}
        if not pages:
            result["note"] = "No pages found. Pages must be shared with the Tarry integration in Notion to be visible."
        return result


class NotionPageTool(Tool):
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name="notion_page",
            description="Read the text content of a Notion page by its id or URL.",
            parameters={
                "type": "object",
                "properties": {"page_id": {"type": "string", "description": "Page id or Notion URL"}},
                "required": ["page_id"],
            },
        )

    async def execute(self, params: dict[str, Any], context: ToolContext | None = None) -> dict[str, Any]:
        key = common.credential(context, "notion", "api_key")
        if not key:
            return common.not_connected("Notion")
        page_id = _page_id(str(params.get("page_id") or ""))
        if not page_id:
            return {"error": "Invalid page id. Use notion_search to find it."}

        async with common.make_client() as client:
            page_resp = await client.get(f"{API}/pages/{page_id}", headers=_headers(key))
            if page_resp.status_code != 200:
                return _error_for(page_resp)
            blocks_resp = await client.get(
                f"{API}/blocks/{page_id}/children", headers=_headers(key), params={"page_size": 100}
            )
        if blocks_resp.status_code != 200:
            return _error_for(blocks_resp)

        lines = []
        for block in blocks_resp.json().get("results", []):
            btype = block.get("type")
            if btype in TEXT_BLOCKS:
                content = block.get(btype) or {}
                text = _plain(content.get("rich_text"))
                if btype == "to_do":
                    text = ("[x] " if content.get("checked") else "[ ] ") + text
                lines.append(TEXT_BLOCKS[btype] + text)
            elif btype == "child_page":
                lines.append(f"[sottopagina: {(block.get('child_page') or {}).get('title', '')}]")
            elif btype == "divider":
                lines.append("---")
        text = "\n".join(lines).strip()
        return {
            "id": page_id,
            "title": _title(page_resp.json()),
            "content": common.truncate(text, MAX_PAGE_CHARS) or "(pagina vuota)",
            "truncated": len(text) > MAX_PAGE_CHARS,
        }
