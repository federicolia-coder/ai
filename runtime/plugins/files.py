from typing import Any

from runtime.tools.base import AttachedFile, Tool, ToolContext, ToolDefinition

CHUNK_CHARS = 2500
MAX_SEARCH_RESULTS = 15


def _find(files: list[AttachedFile], filename: str) -> AttachedFile | None:
    wanted = (filename or "").strip().lower()
    if not wanted:
        return files[0] if len(files) == 1 else None
    for f in files:
        if f.name.lower() == wanted:
            return f
    for f in files:
        if wanted in f.name.lower():
            return f
    return None


def _names(files: list[AttachedFile]) -> list[str]:
    return [f.name for f in files]


class FileReadTool(Tool):
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name="read_file",
            description="Read the text of a file the user attached to this chat. Long files are returned in parts: pass next_offset to continue.",
            parameters={
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string",
                        "description": "Name of the attached file (optional if only one file is attached)",
                    },
                    "offset": {
                        "type": "integer",
                        "description": "Character position to start reading from (default 0)",
                        "default": 0,
                    },
                },
                "required": [],
            },
            permissions=["files.read"],
        )

    async def execute(self, params: dict[str, Any], context: ToolContext | None = None) -> dict[str, Any]:
        files = context.files if context else []
        if not files:
            return {"error": "No files are attached to this conversation."}

        f = _find(files, str(params.get("filename") or ""))
        if f is None:
            return {"error": "File not found. Specify one of the attached files.", "available_files": _names(files)}
        if f.error:
            return {"filename": f.name, "error": f"Cannot read this file: {f.error}"}

        try:
            offset = max(0, int(params.get("offset") or 0))
        except (TypeError, ValueError):
            offset = 0
        if offset >= len(f.text) and f.text:
            return {"filename": f.name, "error": "Offset is past the end of the file.", "total_chars": len(f.text)}

        chunk = f.text[offset:offset + CHUNK_CHARS]
        end = offset + len(chunk)
        result: dict[str, Any] = {
            "filename": f.name,
            "content": chunk,
            "total_chars": len(f.text),
        }
        if end < len(f.text):
            result["next_offset"] = end
        return result


class FileSearchTool(Tool):
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name="search_files",
            description="Find the lines containing a word or phrase in the files the user attached to this chat.",
            parameters={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Word or phrase to look for"},
                    "filename": {"type": "string", "description": "Optional: search only this file"},
                },
                "required": ["query"],
            },
            permissions=["files.read"],
        )

    async def execute(self, params: dict[str, Any], context: ToolContext | None = None) -> dict[str, Any]:
        query = str(params.get("query") or "").strip().lower()
        if not query:
            return {"error": "Query is required"}

        files = context.files if context else []
        if not files:
            return {"error": "No files are attached to this conversation."}

        target = str(params.get("filename") or "").strip()
        if target:
            f = _find(files, target)
            if f is None:
                return {"error": "File not found.", "available_files": _names(files)}
            candidates = [f]
        else:
            candidates = files

        results = []
        skipped = []
        for f in candidates:
            if f.error:
                skipped.append({"filename": f.name, "reason": f.error})
                continue
            for i, line in enumerate(f.text.splitlines(), 1):
                if query in line.lower():
                    results.append({"file": f.name, "line": i, "content": line.strip()[:200]})
                    if len(results) >= MAX_SEARCH_RESULTS:
                        break
            if len(results) >= MAX_SEARCH_RESULTS:
                break

        out: dict[str, Any] = {"query": query, "results": results, "count": len(results)}
        if skipped:
            out["unreadable_files"] = skipped
        return out
