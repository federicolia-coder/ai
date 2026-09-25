import ast
import operator
from typing import Any

from runtime.tools.base import Tool, ToolContext, ToolDefinition

SAFE_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
}


def safe_eval(node: ast.AST) -> float:
    if isinstance(node, ast.Expression):
        return safe_eval(node.body)
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return float(node.value)
    if isinstance(node, ast.BinOp):
        op_type = type(node.op)
        if op_type not in SAFE_OPS:
            raise ValueError(f"Unsupported operator: {op_type.__name__}")
        left = safe_eval(node.left)
        right = safe_eval(node.right)
        if op_type == ast.Pow and right > 1000:
            raise ValueError("Exponent too large")
        return SAFE_OPS[op_type](left, right)
    if isinstance(node, ast.UnaryOp):
        op_type = type(node.op)
        if op_type not in SAFE_OPS:
            raise ValueError(f"Unsupported operator: {op_type.__name__}")
        return SAFE_OPS[op_type](safe_eval(node.operand))
    raise ValueError(f"Unsupported expression: {ast.dump(node)}")


class CalculatorTool(Tool):
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name="calculate",
            description="Evaluate a mathematical expression safely. Supports +, -, *, /, %, **.",
            parameters={
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "Mathematical expression to evaluate, e.g. '2 + 3 * 4'",
                    }
                },
                "required": ["expression"],
            },
        )

    async def execute(self, params: dict[str, Any], context: ToolContext | None = None) -> dict[str, Any]:
        expression = params.get("expression", "")
        try:
            tree = ast.parse(expression, mode="eval")
            result = safe_eval(tree)
            return {"result": result, "expression": expression}
        except (ValueError, SyntaxError, ZeroDivisionError) as e:
            return {"error": str(e), "expression": expression}
