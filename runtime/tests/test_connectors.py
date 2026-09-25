import base64
import hashlib
import hmac
import json

import httpx
import pytest

from runtime.plugins.connectors import common, webhook
from runtime.plugins.connectors.github import GitHubFileTool, GitHubIssuesTool, GitHubReposTool
from runtime.plugins.connectors.notion import NotionPageTool, NotionSearchTool, _page_id
from runtime.plugins.connectors.webhook import WebhookSendTool
from runtime.tools.base import ToolContext

GH = ToolContext(credentials={"github": {"token": "ghp_test"}})
NOTION = ToolContext(credentials={"notion": {"api_key": "secret_test"}})


@pytest.fixture
def mock_http(monkeypatch):
    """Route all connector HTTP calls to a handler; records requests."""
    state = {"handler": None, "requests": []}

    def handler(request: httpx.Request) -> httpx.Response:
        state["requests"].append(request)
        return state["handler"](request)

    def factory(**kwargs):
        return httpx.AsyncClient(transport=httpx.MockTransport(handler), **kwargs)

    monkeypatch.setattr(common, "make_client", factory)
    return state


# ---------- GitHub ----------

@pytest.mark.asyncio
async def test_github_requires_token():
    for tool in (GitHubReposTool(), GitHubIssuesTool(), GitHubFileTool()):
        result = await tool.execute({"repo": "a/b"}, ToolContext())
        assert "not connected" in result["error"]


@pytest.mark.asyncio
async def test_github_repos_lists_and_filters(mock_http):
    mock_http["handler"] = lambda r: httpx.Response(200, json=[
        {"full_name": "fede/tarry", "private": True, "description": "AI", "language": "TS", "open_issues_count": 2, "updated_at": "2026-09-20T10:00:00Z"},
        {"full_name": "fede/other", "private": False, "description": None, "language": None, "open_issues_count": 0, "updated_at": "2026-01-01T00:00:00Z"},
    ])
    result = await GitHubReposTool().execute({"query": "TARRY"}, GH)
    assert result["count"] == 1
    assert result["repos"][0]["repo"] == "fede/tarry"
    assert result["repos"][0]["updated"] == "2026-09-20"
    req = mock_http["requests"][0]
    assert req.headers["Authorization"] == "Bearer ghp_test"
    assert req.url.path == "/user/repos"


@pytest.mark.asyncio
async def test_github_bad_token_message(mock_http):
    mock_http["handler"] = lambda r: httpx.Response(401, json={"message": "Bad credentials"})
    result = await GitHubReposTool().execute({}, GH)
    assert "reconnect" in result["error"]
    assert "ghp_test" not in json.dumps(result)


@pytest.mark.asyncio
async def test_github_rate_limit_message(mock_http):
    mock_http["handler"] = lambda r: httpx.Response(403, headers={"x-ratelimit-remaining": "0"})
    result = await GitHubReposTool().execute({}, GH)
    assert "rate limit" in result["error"]


@pytest.mark.asyncio
async def test_github_issues_excludes_pull_requests(mock_http):
    mock_http["handler"] = lambda r: httpx.Response(200, json=[
        {"number": 1, "title": "Bug", "state": "open", "user": {"login": "a"}, "comments": 3, "updated_at": "2026-09-01T00:00:00Z"},
        {"number": 2, "title": "PR", "state": "open", "user": {"login": "b"}, "pull_request": {}},
    ])
    result = await GitHubIssuesTool().execute({"repo": "https://github.com/fede/tarry/", "state": "bogus"}, GH)
    assert result["repo"] == "fede/tarry"
    assert result["state"] == "open"
    assert [i["number"] for i in result["issues"]] == [1]
    assert mock_http["requests"][0].url.params["state"] == "open"


@pytest.mark.asyncio
@pytest.mark.parametrize("repo", ["", "nope", "a/b/c", "../x", "a b/c"])
async def test_github_rejects_bad_repo(repo, mock_http):
    result = await GitHubIssuesTool().execute({"repo": repo}, GH)
    assert "owner/name" in result["error"]
    assert mock_http["requests"] == []


@pytest.mark.asyncio
async def test_github_file_content(mock_http):
    content = base64.b64encode("print('ciao')\n".encode()).decode()
    mock_http["handler"] = lambda r: httpx.Response(200, json={"type": "file", "encoding": "base64", "content": content, "size": 14})
    result = await GitHubFileTool().execute({"repo": "fede/tarry", "path": "/src/main.py"}, GH)
    assert result["content"] == "print('ciao')\n"
    assert mock_http["requests"][0].url.path == "/repos/fede/tarry/contents/src/main.py"


@pytest.mark.asyncio
async def test_github_folder_listing(mock_http):
    mock_http["handler"] = lambda r: httpx.Response(200, json=[{"name": "src", "type": "dir"}, {"name": "README.md", "type": "file"}])
    result = await GitHubFileTool().execute({"repo": "fede/tarry"}, GH)
    assert result["type"] == "folder"
    assert result["entries"][1] == {"name": "README.md", "type": "file"}


@pytest.mark.asyncio
async def test_github_binary_file(mock_http):
    content = base64.b64encode(b"\x89PNG\x00\x00").decode()
    mock_http["handler"] = lambda r: httpx.Response(200, json={"type": "file", "encoding": "base64", "content": content})
    result = await GitHubFileTool().execute({"repo": "fede/tarry", "path": "logo.png"}, GH)
    assert "Binary" in result["error"]


@pytest.mark.asyncio
async def test_github_path_traversal(mock_http):
    result = await GitHubFileTool().execute({"repo": "fede/tarry", "path": "../../etc"}, GH)
    assert "error" in result
    assert mock_http["requests"] == []


# ---------- Notion ----------

def test_notion_page_id_parsing():
    raw = "0123456789abcdef0123456789abcdef"
    assert _page_id(raw) == raw
    assert _page_id("01234567-89ab-cdef-0123-456789abcdef") == raw
    assert _page_id(f"https://www.notion.so/My-Page-{raw}?pvs=4") == raw
    assert _page_id("not an id") is None


@pytest.mark.asyncio
async def test_notion_requires_key():
    assert "not connected" in (await NotionSearchTool().execute({"query": "x"}, ToolContext()))["error"]


@pytest.mark.asyncio
async def test_notion_search(mock_http):
    mock_http["handler"] = lambda r: httpx.Response(200, json={"results": [
        {"id": "p1", "url": "https://notion.so/p1", "last_edited_time": "2026-09-01T00:00:00Z",
         "properties": {"Name": {"type": "title", "title": [{"plain_text": "Piano "}, {"plain_text": "Q4"}]}}},
    ]})
    result = await NotionSearchTool().execute({"query": "piano"}, NOTION)
    assert result["pages"][0]["title"] == "Piano Q4"
    req = mock_http["requests"][0]
    assert req.headers["Notion-Version"] == "2022-06-28"
    assert json.loads(req.content)["query"] == "piano"


@pytest.mark.asyncio
async def test_notion_search_empty_explains_sharing(mock_http):
    mock_http["handler"] = lambda r: httpx.Response(200, json={"results": []})
    result = await NotionSearchTool().execute({"query": "x"}, NOTION)
    assert "shared" in result["note"]


@pytest.mark.asyncio
async def test_notion_page_content(mock_http):
    page_id = "0123456789abcdef0123456789abcdef"

    def handler(r):
        if r.url.path.endswith("/children"):
            return httpx.Response(200, json={"results": [
                {"type": "heading_1", "heading_1": {"rich_text": [{"plain_text": "Titolo"}]}},
                {"type": "paragraph", "paragraph": {"rich_text": [{"plain_text": "Testo"}]}},
                {"type": "to_do", "to_do": {"checked": True, "rich_text": [{"plain_text": "Fatto"}]}},
                {"type": "image", "image": {}},
                {"type": "divider", "divider": {}},
            ]})
        return httpx.Response(200, json={"properties": {"title": {"type": "title", "title": [{"plain_text": "Pagina"}]}}})

    mock_http["handler"] = handler
    result = await NotionPageTool().execute({"page_id": page_id}, NOTION)
    assert result["title"] == "Pagina"
    assert result["content"] == "# Titolo\nTesto\n[x] Fatto\n---"


@pytest.mark.asyncio
async def test_notion_page_not_shared(mock_http):
    mock_http["handler"] = lambda r: httpx.Response(404, json={})
    result = await NotionPageTool().execute({"page_id": "0123456789abcdef0123456789abcdef"}, NOTION)
    assert "shared" in result["error"]


# ---------- Webhook ----------

@pytest.fixture
def public_host(monkeypatch):
    monkeypatch.setattr(webhook, "is_private_host", lambda host: False)


def hook(url="https://hooks.example.com/x", secret=""):
    creds = {"url": url}
    if secret:
        creds["secret"] = secret
    return ToolContext(credentials={"webhook": creds})


@pytest.mark.asyncio
async def test_webhook_sends_signed_payload(mock_http, public_host):
    mock_http["handler"] = lambda r: httpx.Response(204)
    result = await WebhookSendTool().execute({"message": "Ciao"}, hook(secret="s3cret"))
    assert result == {"sent": True, "status": 204}
    req = mock_http["requests"][0]
    payload = json.loads(req.content)
    assert payload["message"] == "Ciao" and payload["source"] == "tarry"
    expected = "sha256=" + hmac.new(b"s3cret", req.content, hashlib.sha256).hexdigest()
    assert req.headers["X-Tarry-Signature"] == expected


@pytest.mark.asyncio
async def test_webhook_without_secret_has_no_signature(mock_http, public_host):
    mock_http["handler"] = lambda r: httpx.Response(200)
    await WebhookSendTool().execute({"message": "x"}, hook())
    assert "X-Tarry-Signature" not in mock_http["requests"][0].headers


@pytest.mark.asyncio
async def test_webhook_non_2xx(mock_http, public_host):
    mock_http["handler"] = lambda r: httpx.Response(500)
    result = await WebhookSendTool().execute({"message": "x"}, hook())
    assert result["sent"] is False


@pytest.mark.asyncio
async def test_webhook_redirect_is_not_followed(mock_http, public_host):
    mock_http["handler"] = lambda r: httpx.Response(302, headers={"location": "http://169.254.169.254/"})
    result = await WebhookSendTool().execute({"message": "x"}, hook())
    assert result["sent"] is False
    assert len(mock_http["requests"]) == 1


@pytest.mark.asyncio
async def test_webhook_connection_error(mock_http, public_host):
    def boom(r):
        raise httpx.ConnectError("refused")
    mock_http["handler"] = boom
    result = await WebhookSendTool().execute({"message": "x"}, hook())
    assert "reach" in result["error"]


@pytest.mark.asyncio
@pytest.mark.parametrize("url", ["http://hooks.example.com/x", "ftp://x", "https://"])
async def test_webhook_rejects_non_https(url, mock_http):
    result = await WebhookSendTool().execute({"message": "x"}, hook(url=url))
    assert "https" in result["error"]
    assert mock_http["requests"] == []


@pytest.mark.asyncio
@pytest.mark.parametrize("url", ["https://127.0.0.1/x", "https://localhost/x", "https://169.254.169.254/latest", "https://10.1.2.3/"])
async def test_webhook_blocks_private_addresses(url, mock_http):
    result = await WebhookSendTool().execute({"message": "x"}, hook(url=url))
    assert "private" in result["error"]
    assert mock_http["requests"] == []


@pytest.mark.asyncio
async def test_webhook_validates_message(mock_http, public_host):
    assert "required" in (await WebhookSendTool().execute({"message": " "}, hook()))["error"]
    assert "too long" in (await WebhookSendTool().execute({"message": "x" * 5000}, hook()))["error"]
    assert "not connected" in (await WebhookSendTool().execute({"message": "x"}, ToolContext()))["error"]
