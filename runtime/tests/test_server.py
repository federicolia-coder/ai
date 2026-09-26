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
    monkeypatch.setattr(server, "gate", server.Gate(1, 2))
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


def _parse_sse(text):
    import json as _json
    events = []
    for block in text.split("\n\n"):
        for line in block.splitlines():
            if line.startswith("data: "):
                events.append(_json.loads(line[6:]))
    return events


@pytest.fixture
def stream_client(monkeypatch):
    monkeypatch.setattr(server, "RUNTIME_SECRET", "test-secret")

    class FakeStreamingAgent:
        async def run_events(self, messages, enabled_tools, max_tokens, context, cancel):
            yield {"type": "step", "step": {"tool": "calculate", "args": {}, "result": "{}", "status": "ok"}}
            yield {"type": "token", "text": "Fa "}
            yield {"type": "token", "text": "42."}
            yield {"type": "done", "result": {"content": "Fa 42.", "tools_used": ["calculate"], "steps": [], "input_tokens": 1, "output_tokens": 2, "total_tokens": 3}}

    monkeypatch.setattr(server, "agent", FakeStreamingAgent())
    monkeypatch.setattr(server, "gate", server.Gate(1, 2))
    monkeypatch.setattr(server.model, "is_loaded", lambda: True)
    return TestClient(server.app)


def test_stream_emits_sse_events_in_order(stream_client):
    r = stream_client.post("/v1/chat/stream", json={"messages": [{"role": "user", "content": "6*7"}]}, headers=AUTH)
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/event-stream")
    events = _parse_sse(r.text)
    assert [e["type"] for e in events] == ["step", "token", "token", "done"]
    assert events[-1]["result"]["content"] == "Fa 42."


def test_stream_requires_auth(stream_client):
    r = stream_client.post("/v1/chat/stream", json={"messages": []}, headers={"Authorization": "Bearer nope"})
    assert r.status_code == 401


def test_stream_reports_agent_failure_as_error_event(stream_client, monkeypatch):
    class Broken:
        async def run_events(self, **kwargs):
            raise RuntimeError("boom")
            yield  # pragma: no cover

    monkeypatch.setattr(server, "agent", Broken())
    r = stream_client.post("/v1/chat/stream", json={"messages": []}, headers=AUTH)
    events = _parse_sse(r.text)
    assert events == [{"type": "error", "error": "internal"}]
    assert "boom" not in r.text


def test_busy_when_queue_is_full(stream_client, monkeypatch):
    gate = server.Gate(1, 0)
    gate.active = 1
    monkeypatch.setattr(server, "gate", gate)
    r = stream_client.post("/v1/chat/stream", json={"messages": []}, headers=AUTH)
    assert r.status_code == 503
    assert r.json()["detail"] == "busy"
    r = stream_client.post("/v1/chat", json={"messages": []}, headers=AUTH)
    assert r.status_code == 503


def test_stream_announces_queue_then_times_out(stream_client, monkeypatch):
    gate = server.Gate(1, 3)
    gate.active = 1  # a slot is taken...
    gate._sem = __import__("asyncio").Semaphore(0)  # ...and never frees up
    monkeypatch.setattr(server, "gate", gate)
    monkeypatch.setattr(server, "QUEUE_TIMEOUT", 0.05)
    r = stream_client.post("/v1/chat/stream", json={"messages": []}, headers=AUTH)
    assert _parse_sse(r.text) == [{"type": "queued", "position": 1}, {"type": "error", "error": "busy"}]
    assert gate.waiting == 0
