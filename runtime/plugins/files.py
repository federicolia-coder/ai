import os
from typing import Any

from runtime.tools.base import Tool, ToolDefinition

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/tarry-uploads")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {
    ".txt", ".md", ".csv", ".json", ".xml", ".html",
    ".py", ".js", ".ts", ".java", ".c", ".cpp", ".go", ".rs",
    ".pdf", ".log", ".yaml", ".yml", ".toml", ".ini", ".cfg",
}


class FileReadTool(Tool):
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name="read_file",
            description="Read the contents of an uploaded file by filename.",
            parameters={
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string",
                        "description": "Name of the file to read",
                    },
                    "max_chars": {
                        "type": "integer",
                        "description": "Maximum characters to return (default 10000)",
                        "default": 10000,
                    },
                },
                "required": ["filename"],
            },
            permissions=["files.read"],
        )

    async def execute(self, params: dict[str, Any]) -> dict[str, Any]:
        filename = os.path.basename(params.get("filename", ""))
        max_chars = min(params.get("max_chars", 10000), 50000)

        if not filename:
            return {"error": "Filename is required"}

        filepath = os.path.join(UPLOAD_DIR, filename)

        if not os.path.isfile(filepath):
            return {"error": f"File not found: {filename}"}

        try:
            with open(filepath, "r", errors="replace") as f:
                content = f.read(max_chars)
            return {
                "filename": filename,
                "content": content,
                "truncated": len(content) >= max_chars,
                "size": os.path.getsize(filepath),
            }
        except Exception as e:
            return {"error": f"Failed to read file: {str(e)}"}


class FileSearchTool(Tool):
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name="search_files",
            description="Search for text within uploaded files.",
            parameters={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Text to search for",
                    },
                    "filename": {
                        "type": "string",
                        "description": "Optional: search only in this file",
                    },
                },
                "required": ["query"],
            },
            permissions=["files.read"],
        )

    async def execute(self, params: dict[str, Any]) -> dict[str, Any]:
        query = params.get("query", "").lower()
        target_file = params.get("filename")

        if not query:
            return {"error": "Query is required"}

        if not os.path.isdir(UPLOAD_DIR):
            return {"results": [], "message": "No files uploaded"}

        results = []
        files_to_search = (
            [target_file] if target_file else os.listdir(UPLOAD_DIR)
        )

        for fname in files_to_search[:20]:
            fname = os.path.basename(fname)
            filepath = os.path.join(UPLOAD_DIR, fname)
            if not os.path.isfile(filepath):
                continue
            try:
                with open(filepath, "r", errors="replace") as f:
                    for i, line in enumerate(f, 1):
                        if query in line.lower():
                            results.append({
                                "file": fname,
                                "line": i,
                                "content": line.strip()[:200],
                            })
                            if len(results) >= 20:
                                break
            except Exception:
                continue
            if len(results) >= 20:
                break

        return {"query": query, "results": results, "count": len(results)}
