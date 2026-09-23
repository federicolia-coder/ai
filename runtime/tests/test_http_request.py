import pytest
from runtime.plugins.http_request import HttpRequestTool, _is_private_ip


@pytest.fixture
def http_tool():
    return HttpRequestTool()


@pytest.mark.asyncio
async def test_rejects_non_http_scheme(http_tool):
    result = await http_tool.execute({"url": "ftp://example.com"})
    assert "error" in result


@pytest.mark.asyncio
async def test_rejects_no_scheme(http_tool):
    result = await http_tool.execute({"url": "example.com"})
    assert "error" in result


@pytest.mark.asyncio
async def test_rejects_localhost(http_tool):
    result = await http_tool.execute({"url": "http://localhost:8080"})
    assert "error" in result


@pytest.mark.asyncio
async def test_rejects_127(http_tool):
    result = await http_tool.execute({"url": "http://127.0.0.1"})
    assert "error" in result


@pytest.mark.asyncio
async def test_rejects_private_10(http_tool):
    result = await http_tool.execute({"url": "http://10.0.0.1"})
    assert "error" in result


@pytest.mark.asyncio
async def test_rejects_private_192(http_tool):
    result = await http_tool.execute({"url": "http://192.168.1.1"})
    assert "error" in result


@pytest.mark.asyncio
async def test_rejects_link_local(http_tool):
    result = await http_tool.execute({"url": "http://169.254.169.254"})
    assert "error" in result


@pytest.mark.asyncio
async def test_rejects_invalid_method(http_tool):
    result = await http_tool.execute({"url": "https://example.com", "method": "DELETE"})
    assert "error" in result


@pytest.mark.asyncio
async def test_rejects_empty_url(http_tool):
    result = await http_tool.execute({"url": ""})
    assert "error" in result


def test_private_ip_localhost():
    assert _is_private_ip("127.0.0.1") is True


def test_private_ip_link_local():
    assert _is_private_ip("169.254.169.254") is True


def test_private_ip_10_range():
    assert _is_private_ip("10.0.0.1") is True
