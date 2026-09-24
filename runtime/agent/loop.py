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
    r'<tool_call>\s*\{[^}]*"name"\s*:\s*"(\w+)"[^}]*"arguments"\s*:\s*(\{[^}]*\})[^}]*\}\s*</tool_call>',
    re.DOTALL,
)

TOOL_SYSTEM_PROMPT = """You can use tools with this format:
<tool_call>{"name": "tool_name", "arguments": {"param": "value"}}</tool_call>

Tools:
"""


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
                temperature=0.3,
            )

            total_input += result.get("input_tokens", 0)
            total_output += result.get("output_tokens", 0)
            content = result.get("content", "")

            tool_match = TOOL_CALL_PATTERN.search(content)
            if not tool_match or iteration >= MAX_TOOL_CALLS:
                clean_content = TOOL_CALL_PATTERN.sub("", content).strip()
                return {
                    "content": clean_content or content,
                    "tools_used": tools_used,
                    "steps": steps,
                    "input_tokens": total_input,
                    "output_tokens": total_output,
                    "total_tokens": total_input + total_output,
                }

            tool_name = tool_match.group(1)
            try:
                tool_args = json.loads(tool_match.group(2))
            except json.JSONDecodeError:
                tool_args = {}

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
            steps.append({
                "tool": tool_name,
                "args": tool_args,
                "result": result_str[:500],
                "status": status,
            })

            working_messages.append({"role": "assistant", "content": content})
            working_messages.append({
                "role": "tool",
                "content": result_str,
            })

        return {
            "content": "I was unable to complete the request within the tool call limit.",
            "tools_used": tools_used,
            "steps": steps,
            "input_tokens": total_input,
            "output_tokens": total_output,
            "total_tokens": total_input + total_output,
        }
