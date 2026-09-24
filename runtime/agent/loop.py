import asyncio
import json
import logging
import re
from typing import Any

from runtime.model.provider import ModelProvider
from runtime.tools.registry import ToolRegistry
from runtime.config.settings import MAX_TOOL_CALLS, TOOL_TIMEOUT

logger = logging.getLogger(__name__)

TOOL_CALL_PATTERN = re.compile(
    r'<tool_call>\s*(\{.*?\})\s*</tool_call>',
    re.DOTALL,
)

TOOL_SYSTEM_PROMPT = """You have access to tools. To use one, write EXACTLY this format:
<tool_call>{"name": "tool_name", "arguments": {"param": "value"}}</tool_call>

After receiving the result, present the information clearly to the user. Use the result data directly — do not invent or guess values.

Available tools:
"""


def _parse_tool_call(text: str) -> tuple[str, dict] | None:
    match = TOOL_CALL_PATTERN.search(text)
    if not match:
        return None
    raw = match.group(1)
    try:
        obj = json.loads(raw)
        name = obj.get("name", "")
        args = obj.get("arguments", {})
        if name:
            return name, args if isinstance(args, dict) else {}
    except json.JSONDecodeError:
        name_match = re.search(r'"name"\s*:\s*"(\w+)"', raw)
        args_match = re.search(r'"arguments"\s*:\s*(\{[^}]*\})', raw)
        if name_match:
            name = name_match.group(1)
            args = {}
            if args_match:
                try:
                    args = json.loads(args_match.group(1))
                except json.JSONDecodeError:
                    pass
            return name, args
    return None


def _format_tool_result(tool_name: str, result: dict) -> str:
    if "error" in result:
        return f"Error: {result['error']}"
    if tool_name == "search":
        results = result.get("results", [])
        if not results:
            return "No results found."
        lines = []
        for r in results:
            lines.append(f"- {r.get('title', '')}: {r.get('snippet', '')}")
        return "\n".join(lines)
    if tool_name == "calculate":
        return f"Result: {result.get('result', 'unknown')}"
    return json.dumps(result)[:400]


class AgentLoop:
    def __init__(self, model: ModelProvider, tools: ToolRegistry):
        self.model = model
        self.tools = tools

    async def run(
        self,
        messages: list[dict[str, str]],
        enabled_tools: list[str] | None = None,
        max_tokens: int = 1024,
    ) -> dict[str, Any]:
        tool_defs = self.tools.list_definitions(enabled_tools)
        tools_used: list[str] = []
        steps: list[dict[str, Any]] = []
        total_input = 0
        total_output = 0
        last_tool_result: str | None = None

        working_messages = list(messages)

        if tool_defs:
            tool_desc = TOOL_SYSTEM_PROMPT
            for td in tool_defs:
                tool_desc += f"\n- {td['name']}: {td['description']}"

            if working_messages and working_messages[0]["role"] == "system":
                working_messages[0]["content"] += "\n\n" + tool_desc
            else:
                working_messages.insert(0, {"role": "system", "content": tool_desc})

        for iteration in range(MAX_TOOL_CALLS + 1):
            result = self.model.generate(
                messages=working_messages,
                max_tokens=max_tokens,
                temperature=0.6,
            )

            total_input += result.get("input_tokens", 0)
            total_output += result.get("output_tokens", 0)
            content = result.get("content", "")

            logger.info("Model output (iter %d): %s", iteration, content[:200])

            parsed = _parse_tool_call(content)
            if not parsed or iteration >= MAX_TOOL_CALLS:
                clean_content = TOOL_CALL_PATTERN.sub("", content).strip()
                if not clean_content and last_tool_result:
                    clean_content = last_tool_result
                return {
                    "content": clean_content or content or "Sorry, I could not generate a response.",
                    "tools_used": tools_used,
                    "steps": steps,
                    "input_tokens": total_input,
                    "output_tokens": total_output,
                    "total_tokens": total_input + total_output,
                }

            tool_name, tool_args = parsed

            tool = self.tools.get(tool_name)
            if not tool:
                tool_result = {"error": f"Unknown tool: {tool_name}"}
                status = "error"
            else:
                try:
                    tool_result = await asyncio.wait_for(
                        tool.execute(tool_args),
                        timeout=TOOL_TIMEOUT,
                    )
                    tools_used.append(tool_name)
                    status = "ok"
                except asyncio.TimeoutError:
                    tool_result = {"error": f"Tool '{tool_name}' timed out"}
                    status = "error"
                except Exception as e:
                    tool_result = {"error": f"Tool '{tool_name}' failed: {str(e)}"}
                    status = "error"

            result_str = json.dumps(tool_result)
            formatted = _format_tool_result(tool_name, tool_result)
            last_tool_result = formatted

            steps.append({
                "tool": tool_name,
                "args": tool_args,
                "result": result_str[:500],
                "status": status,
            })

            clean_assistant = TOOL_CALL_PATTERN.sub("", content).strip()
            if clean_assistant:
                working_messages.append({"role": "assistant", "content": clean_assistant})
            working_messages.append({
                "role": "user",
                "content": f"[Tool result for {tool_name}]\n{formatted}",
            })

        return {
            "content": last_tool_result or "I was unable to complete the request.",
            "tools_used": tools_used,
            "steps": steps,
            "input_tokens": total_input,
            "output_tokens": total_output,
            "total_tokens": total_input + total_output,
        }
