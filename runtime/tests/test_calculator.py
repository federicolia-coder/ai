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


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "expression,expected",
    [
        ("3480*1.22", 4245.6),
        ("0.1+0.2", 0.3),
        ("1270*0.40", 508),
        ("2340 × 0,175", 409.5),
        ("762 ÷ 2", 381),
        ("10/3", 3.33333333333),
    ],
)
async def test_results_are_tidy_and_italian_notation_is_accepted(calc, expression, expected):
    result = await calc.execute({"expression": expression})
    assert result["result"] == expected


@pytest.mark.asyncio
async def test_ambiguous_thousands_separator_is_rejected(calc):
    result = await calc.execute({"expression": "2.340,5 * 2"})
    assert "error" in result
