import os
import tempfile
import pytest
from unittest.mock import patch
from runtime.plugins.files import FileReadTool, FileSearchTool


@pytest.fixture
def tmp_upload_dir():
    with tempfile.TemporaryDirectory() as d:
        with open(os.path.join(d, "test.txt"), "w") as f:
            f.write("hello world\nsecond line\nthird line")
        with open(os.path.join(d, "data.csv"), "w") as f:
            f.write("name,age\nAlice,30\nBob,25")
        yield d


@pytest.fixture
def read_tool():
    return FileReadTool()


@pytest.fixture
def search_tool():
    return FileSearchTool()


@pytest.mark.asyncio
async def test_read_file(read_tool, tmp_upload_dir):
    with patch("runtime.plugins.files.UPLOAD_DIR", tmp_upload_dir):
        result = await read_tool.execute({"filename": "test.txt"})
    assert result["filename"] == "test.txt"
    assert "hello world" in result["content"]


@pytest.mark.asyncio
async def test_read_missing_file(read_tool, tmp_upload_dir):
    with patch("runtime.plugins.files.UPLOAD_DIR", tmp_upload_dir):
        result = await read_tool.execute({"filename": "nope.txt"})
    assert "error" in result


@pytest.mark.asyncio
async def test_read_path_traversal(read_tool, tmp_upload_dir):
    with patch("runtime.plugins.files.UPLOAD_DIR", tmp_upload_dir):
        result = await read_tool.execute({"filename": "../../etc/passwd"})
    assert "error" in result


@pytest.mark.asyncio
async def test_search_files(search_tool, tmp_upload_dir):
    with patch("runtime.plugins.files.UPLOAD_DIR", tmp_upload_dir):
        result = await search_tool.execute({"query": "alice"})
    assert result["count"] >= 1
    assert result["results"][0]["file"] == "data.csv"


@pytest.mark.asyncio
async def test_search_no_results(search_tool, tmp_upload_dir):
    with patch("runtime.plugins.files.UPLOAD_DIR", tmp_upload_dir):
        result = await search_tool.execute({"query": "zzzznonexistent"})
    assert result["count"] == 0


@pytest.mark.asyncio
async def test_read_empty_filename(read_tool):
    result = await read_tool.execute({"filename": ""})
    assert "error" in result
