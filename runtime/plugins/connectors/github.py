import base64
import re
from typing import Any
from urllib.parse import quote

import httpx

from runtime.plugins.connectors import common
from runtime.tools.base import Tool, ToolContext, ToolDefinition

API = "https://api.github.com"
REPO_RE = re.compile(r"^[A-Za-z0-9-]{1,39}/[A-Za-z0-9._-]{1,100}$")
MAX_FILE_CHARS = 2500


def _headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Tarry",
    }


def _error_for(resp: httpx.Response) -> dict[str, Any]:
    if resp.status_code == 401:
        return {"error": "GitHub rejected the token (expired or revoked). The user must reconnect GitHub."}
    if resp.status_code == 403:
        if resp.headers.get("x-ratelimit-remaining") == "0":
            return {"error": "GitHub rate limit reached. Try again later."}
        return {"error": "The GitHub token does not have permission for this resource."}
    if resp.status_code == 404:
        return {"error": "Not found on GitHub (wrong name, or the token cannot see it)."}
    return {"error": f"GitHub error {resp.status_code}"}


def _repo(params: dict[str, Any]) -> str | None:
    repo = str(params.get("repo") or "").strip().strip("/")
    if repo.startswith("https://github.com/"):
        repo = repo[len("https://github.com/"):].strip("/")
    return repo if REPO_RE.match(repo) else None


async def _get(token: str, path: str, params: dict[str, Any] | None = None) -> httpx.Response:
    async with common.make_client() as client:
        return await client.get(f"{API}{path}", headers=_headers(token), params=params)


async def _not_found(token: str, repo: str) -> dict[str, Any]:
    """The model often guesses repo names; answer with the real ones so it can retry correctly."""
    error: dict[str, Any] = {"error": f"Repository {repo} not found or not visible to the token."}
    resp = await _get(token, "/user/repos", {"sort": "updated", "per_page": 30})
    if resp.status_code == 200:
        error["your_repos"] = [r.get("full_name") for r in resp.json()][:15]
        error["hint"] = "Use one of your_repos, or ask the user which repository they mean."
    return error


def _issue(i: dict[str, Any]) -> dict[str, Any]:
    return {
        "number": i.get("number"),
        "title": common.truncate(i.get("title") or "", 150),
        "state": i.get("state"),
        "author": (i.get("user") or {}).get("login"),
        "comments": i.get("comments"),
        "updated": (i.get("updated_at") or "")[:10],
    }


class GitHubReposTool(Tool):
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name="github_repos",
            description="List the user's GitHub repositories, most recently updated first.",
            parameters={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Optional: only repos whose name contains this text"},
                },
                "required": [],
            },
        )

    async def execute(self, params: dict[str, Any], context: ToolContext | None = None) -> dict[str, Any]:
        token = common.credential(context, "github", "token")
        if not token:
            return common.not_connected("GitHub")
        resp = await _get(token, "/user/repos", {"sort": "updated", "per_page": 30})
        if resp.status_code != 200:
            return _error_for(resp)
        query = str(params.get("query") or "").strip().lower()
        repos = []
        for r in resp.json():
            if query and query not in r.get("full_name", "").lower():
                continue
            repos.append({
                "repo": r.get("full_name"),
                "private": r.get("private"),
                "description": common.truncate(r.get("description") or "", 120),
                "language": r.get("language"),
                "open_issues": r.get("open_issues_count"),
                "updated": (r.get("updated_at") or "")[:10],
            })
        return {"count": len(repos), "repos": repos[:15]}


class GitHubIssuesTool(Tool):
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name="github_issues",
            description=(
                "List GitHub issues (open by default), pull requests excluded. Leave repo empty to list "
                "issues across all the user's repositories. Never guess a repo name."
            ),
            parameters={
                "type": "object",
                "properties": {
                    "repo": {"type": "string", "description": "Optional: repository as owner/name, only if the user named it"},
                    "state": {"type": "string", "enum": ["open", "closed", "all"], "default": "open"},
                },
                "required": [],
            },
        )

    async def execute(self, params: dict[str, Any], context: ToolContext | None = None) -> dict[str, Any]:
        token = common.credential(context, "github", "token")
        if not token:
            return common.not_connected("GitHub")
        state = params.get("state") if params.get("state") in ("open", "closed", "all") else "open"
        raw_repo = str(params.get("repo") or "").strip()
        if not raw_repo:
            # Every issue the token can see in repositories the user owns or belongs to.
            resp = await _get(token, "/user/issues", {"filter": "all", "state": state, "per_page": 50})
            if resp.status_code != 200:
                return _error_for(resp)
            issues = [
                {"repo": (i.get("repository") or {}).get("full_name"), **_issue(i)}
                for i in resp.json()
                if "pull_request" not in i
            ]
            return {"repo": "all", "state": state, "count": len(issues), "issues": issues[:20]}

        repo = _repo(params)
        if not repo:
            return {"error": "repo must be in the form owner/name, or empty for all repositories"}
        resp = await _get(token, f"/repos/{repo}/issues", {"state": state, "per_page": 30})
        if resp.status_code == 404:
            return await _not_found(token, repo)
        if resp.status_code != 200:
            return _error_for(resp)
        issues = [_issue(i) for i in resp.json() if "pull_request" not in i]
        return {"repo": repo, "state": state, "count": len(issues), "issues": issues[:15]}


class GitHubFileTool(Tool):
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name="github_file",
            description="Read a file, or list a folder, in a GitHub repository.",
            parameters={
                "type": "object",
                "properties": {
                    "repo": {"type": "string", "description": "Repository as owner/name (call github_repos if unsure)"},
                    "path": {"type": "string", "description": "File or folder path; empty for the root"},
                },
                "required": ["repo"],
            },
        )

    async def execute(self, params: dict[str, Any], context: ToolContext | None = None) -> dict[str, Any]:
        token = common.credential(context, "github", "token")
        if not token:
            return common.not_connected("GitHub")
        repo = _repo(params)
        if not repo:
            return {"error": "repo must be in the form owner/name"}
        path = str(params.get("path") or "").strip().strip("/")
        if ".." in path.split("/"):
            return {"error": "Invalid path"}
        resp = await _get(token, f"/repos/{repo}/contents/{quote(path)}")
        if resp.status_code == 404 and not path:
            return await _not_found(token, repo)
        if resp.status_code != 200:
            return _error_for(resp)
        data = resp.json()

        if isinstance(data, list):
            entries = [{"name": e.get("name"), "type": e.get("type")} for e in data]
            return {"repo": repo, "path": path or "/", "type": "folder", "entries": entries[:60]}

        if data.get("type") != "file":
            return {"error": f"Unsupported item type: {data.get('type')}"}
        if data.get("encoding") != "base64" or not data.get("content"):
            return {"error": "File too large to read through the API (over 1 MB)."}
        raw = base64.b64decode(data["content"])
        if b"\x00" in raw[:4096]:
            return {"repo": repo, "path": path, "error": "Binary file, cannot show its content."}
        text = raw.decode("utf-8", errors="replace")
        return {
            "repo": repo,
            "path": path,
            "type": "file",
            "size": data.get("size"),
            "content": common.truncate(text, MAX_FILE_CHARS),
            "truncated": len(text) > MAX_FILE_CHARS,
        }
