import sys
import types

import pytest
from fastapi.testclient import TestClient

# The real model backend is not needed to test request handling.
sys.modules.setdefault("llama_cpp", types.SimpleNamespace(Llama=object))

from runtime.api import server  # noqa: E402


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(server, "RUNTIME_SECRET", "test-secret")
    captured = {}

    class FakeAgent:
        async def run(self, messages, enabled_tools, max_tokens, context):
            captured.update(enabled_tools=enabled_tools, context=context)
            return {"content": "ok", "tools_used": [], "steps": [], "input_tokens": 1, "output_tokens": 1, "total_tokens": 2}

    monkeypatch.setattr(server, "agent", FakeAgent())
    monkeypatch.setattr(server, "semaphore", __import__("asyncio").Semaphore(1))
    monkeypatch.setattr(server.model, "is_loaded", lambda: True)
    c = TestClient(server.app)
    c.captured = captured
    return c


AUTH = {"Authorization": "Bearer test-secret"}


def test_rejects_bad_secret(client):
    r = client.post("/v1/chat", json={"messages": []}, headers={"Authorization": "Bearer nope"})
    assert r.status_code == 401


def test_empty_tools_stays_empty(client):
    r = client.post("/v1/chat", json={"messages": [{"role": "user", "content": "hi"}], "tools": []}, headers=AUTH)
    assert r.status_code == 200
    assert client.captured["enabled_tools"] == []


def test_credentials_and_files_reach_context(client):
    import base64
    body = {
        "messages": [{"role": "user", "content": "hi"}],
        "tools": ["read_file"],
        "credentials": {"github": {"token": "ghp_x"}},
        "files": [{"name": "a.txt", "mime": "text/plain", "data": base64.b64encode(b"ciao").decode()}],
    }
    r = client.post("/v1/chat", json=body, headers=AUTH)
    assert r.status_code == 200
    ctx = client.captured["context"]
    assert ctx.credentials == {"github": {"token": "ghp_x"}}
    assert ctx.files[0].text == "ciao"


def test_validation_error_does_not_echo_credentials(client):
    body = {"messages": [], "credentials": {"github": {"token": {"nested": "ghp_leak"}}}}
    r = client.post("/v1/chat", json=body, headers=AUTH)
    assert r.status_code == 422
    assert "ghp_leak" not in r.text


def test_max_tokens_limit(client):
    r = client.post("/v1/chat", json={"messages": [], "max_tokens": 999999}, headers=AUTH)
    assert r.status_code == 422


def test_too_many_files(client):
    files = [{"name": f"{i}.txt", "mime": "text/plain", "data": ""} for i in range(6)]
    r = client.post("/v1/chat", json={"messages": [], "files": files}, headers=AUTH)
    assert r.status_code == 422
