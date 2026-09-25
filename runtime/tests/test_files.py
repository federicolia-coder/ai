import pytest

from runtime.plugins.files import CHUNK_CHARS, FileReadTool, FileSearchTool
from runtime.tools.base import AttachedFile, ToolContext


@pytest.fixture
def ctx():
    return ToolContext(files=[
        AttachedFile(name="notes.txt", mime="text/plain", text="hello world\nsecond line\nthird line"),
        AttachedFile(name="data.csv", mime="text/csv", text="name,age\nAlice,30\nBob,25"),
        AttachedFile(name="scan.pdf", mime="application/pdf", error="il PDF non contiene testo selezionabile"),
    ])


@pytest.mark.asyncio
async def test_read_by_exact_name(ctx):
    result = await FileReadTool().execute({"filename": "notes.txt"}, ctx)
    assert result["filename"] == "notes.txt"
    assert "hello world" in result["content"]
    assert "next_offset" not in result


@pytest.mark.asyncio
async def test_read_by_partial_case_insensitive_name(ctx):
    result = await FileReadTool().execute({"filename": "DATA"}, ctx)
    assert result["filename"] == "data.csv"


@pytest.mark.asyncio
async def test_read_single_file_without_name():
    ctx = ToolContext(files=[AttachedFile(name="only.md", mime="text/markdown", text="# Title")])
    result = await FileReadTool().execute({}, ctx)
    assert result["content"] == "# Title"


@pytest.mark.asyncio
async def test_read_without_name_is_ambiguous_with_many_files(ctx):
    result = await FileReadTool().execute({}, ctx)
    assert "error" in result
    assert set(result["available_files"]) == {"notes.txt", "data.csv", "scan.pdf"}


@pytest.mark.asyncio
async def test_read_unreadable_file_reports_reason(ctx):
    result = await FileReadTool().execute({"filename": "scan.pdf"}, ctx)
    assert "testo selezionabile" in result["error"]


@pytest.mark.asyncio
async def test_read_pagination():
    text = "x" * (CHUNK_CHARS * 2 + 10)
    ctx = ToolContext(files=[AttachedFile(name="big.txt", mime="text/plain", text=text)])
    first = await FileReadTool().execute({"filename": "big.txt"}, ctx)
    assert len(first["content"]) == CHUNK_CHARS
    assert first["next_offset"] == CHUNK_CHARS
    second = await FileReadTool().execute({"filename": "big.txt", "offset": first["next_offset"]}, ctx)
    third = await FileReadTool().execute({"filename": "big.txt", "offset": second["next_offset"]}, ctx)
    assert len(third["content"]) == 10
    assert "next_offset" not in third
    past = await FileReadTool().execute({"filename": "big.txt", "offset": 10**9}, ctx)
    assert "error" in past


@pytest.mark.asyncio
async def test_read_with_invalid_offset_falls_back_to_start(ctx):
    result = await FileReadTool().execute({"filename": "notes.txt", "offset": "abc"}, ctx)
    assert result["content"].startswith("hello")


@pytest.mark.asyncio
async def test_no_files_attached():
    assert "error" in await FileReadTool().execute({"filename": "x"}, ToolContext())
    assert "error" in await FileReadTool().execute({"filename": "x"}, None)
    assert "error" in await FileSearchTool().execute({"query": "x"}, ToolContext())


@pytest.mark.asyncio
async def test_search_across_files(ctx):
    result = await FileSearchTool().execute({"query": "alice"}, ctx)
    assert result["count"] == 1
    assert result["results"][0] == {"file": "data.csv", "line": 2, "content": "Alice,30"}
    assert result["unreadable_files"][0]["filename"] == "scan.pdf"


@pytest.mark.asyncio
async def test_search_single_file(ctx):
    result = await FileSearchTool().execute({"query": "line", "filename": "notes.txt"}, ctx)
    assert result["count"] == 2


@pytest.mark.asyncio
async def test_search_unknown_file(ctx):
    result = await FileSearchTool().execute({"query": "a", "filename": "nope.doc"}, ctx)
    assert "error" in result


@pytest.mark.asyncio
async def test_search_requires_query(ctx):
    assert "error" in await FileSearchTool().execute({"query": "  "}, ctx)
