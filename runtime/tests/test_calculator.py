import pytest
from runtime.plugins.calculator import CalculatorTool


@pytest.fixture
def calc():
    return CalculatorTool()


@pytest.mark.asyncio
async def test_basic_addition(calc):
    result = await calc.execute({"expression": "2 + 3"})
    assert result["result"] == 5.0


@pytest.mark.asyncio
async def test_multiplication(calc):
    result = await calc.execute({"expression": "4 * 5"})
    assert result["result"] == 20.0


@pytest.mark.asyncio
async def test_division(calc):
    result = await calc.execute({"expression": "10 / 3"})
    assert abs(result["result"] - 3.333333) < 0.001


@pytest.mark.asyncio
async def test_power(calc):
    result = await calc.execute({"expression": "2 ** 10"})
    assert result["result"] == 1024.0


@pytest.mark.asyncio
async def test_large_exponent_rejected(calc):
    result = await calc.execute({"expression": "2 ** 1001"})
    assert "error" in result


@pytest.mark.asyncio
async def test_division_by_zero(calc):
    result = await calc.execute({"expression": "1 / 0"})
    assert "error" in result


@pytest.mark.asyncio
async def test_invalid_expression(calc):
    result = await calc.execute({"expression": "import os"})
    assert "error" in result


@pytest.mark.asyncio
async def test_empty_expression(calc):
    result = await calc.execute({"expression": ""})
    assert "error" in result


@pytest.mark.asyncio
async def test_complex_expression(calc):
    result = await calc.execute({"expression": "(2 + 3) * (4 - 1)"})
    assert result["result"] == 15.0


@pytest.mark.asyncio
async def test_negative_numbers(calc):
    result = await calc.execute({"expression": "-5 + 3"})
    assert result["result"] == -2.0
