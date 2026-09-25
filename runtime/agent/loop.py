import asyncio
import json
import logging
import re
from typing import Any

from runtime.model.provider import ModelProvider
from runtime.tools.base import ToolContext
from runtime.tools.registry import ToolRegistry
from runtime.config.settings import MAX_TOOL_CALLS, TOOL_TIMEOUT

logger = logging.getLogger(__name__)

TOOL_CALL_PATTERN = re.compile(
    r'<tool_call>\s*(\{.*?\})\s*</tool_call>',
    re.DOTALL,
)

# Qwen 2.5 was trained on this exact Hermes-style layout; the model calls tools far more
# reliably with it than with a free-form tool list.
TOOLS_HEADER = """# Tools

You may call one or more functions to assist with the user query.

You are provided with function signatures within <tools></tools> XML tags:
<tools>
{tools}
</tools>

For each function call, return a json object with function name and arguments within <tool_call></tool_call> XML tags:
<tool_call>
{{"name": <function-name>, "arguments": <args-json-object>}}
</tool_call>"""

TOOL_RULES = """Rules for tools:
- If the answer needs a computed number, current information, a file's content or a connected service, call the tool in this same reply. Never announce that you will do it later.
- Use the tool result as the source of truth. Do not invent or change values. If a tool returns an error, tell the user what went wrong.
- Write the final answer in plain text, without LaTeX."""

CALCULATE_EXAMPLE = """Example. User: "Quanto fa il 17,5% di 2.340 €?"
Assistant:
<tool_call>
{"name": "calculate", "arguments": {"expression": "2340 * 0.175"}}
</tool_call>
In calculate expressions use a dot for decimals and * / + - ** only."""

# The model sometimes describes what it is about to do and stops. One reminder is enough to get the call.
ANNOUNCE_PATTERN = re.compile(
    r"\b(voglio|vado a|procedo|lasciami|ora (?:calcol|cerc|legg|controll)|adesso (?:calcol|cerc|legg)|"
    r"calcoler|cercher|legger|controller|let me|i will|i'll)\w*",
    re.IGNORECASE,
)
MATH_QUESTION_PATTERN = re.compile(
    r"\d.*(%|per ?cento|percent|[+*×÷^]|\bx\s*\d)|quanto fa|calcola",
    re.IGNORECASE,
)
NUDGE = "Chiama ora lo strumento adatto usando il formato <tool_call>. Non spiegare prima: scrivi solo la chiamata."

INLINE_FILES_MAX_CHARS = 2000
FORMATTED_RESULT_MAX_CHARS = 2500


def _files_prompt(context: ToolContext, file_tools_enabled: bool) -> str:
    if not context.files:
        return ""
    readable = [f for f in context.files if not f.error]
    total = sum(len(f.text) for f in readable)
    lines = ["The user attached these files to the conversation:"]
    for f in context.files:
        if f.error:
            lines.append(f"- {f.name}: cannot be read ({f.error})")
        else:
            lines.append(f"- {f.name} ({len(f.text)} characters)")
    if not file_tools_enabled:
        lines.append("The Files plugin is disabled, so you cannot read them. Tell the user to enable the 'files' plugin in the Plugin page.")
    elif readable and total <= INLINE_FILES_MAX_CHARS:
        lines.append("Their full content is below, so you do not need read_file:")
        for f in readable:
            lines.append(f"<file name=\"{f.name}\">\n{f.text}\n</file>")
    else:
        lines.append("Use read_file or search_files to read them before answering questions about them.")
    return "\n".join(lines)


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


def _tools_prompt(tool_defs: list[dict[str, Any]]) -> str:
    lines = [
        json.dumps(
            {"type": "function", "function": {"name": td["name"], "description": td["description"], "parameters": td["parameters"]}},
            ensure_ascii=False,
        )
        for td in tool_defs
    ]
    parts = [TOOLS_HEADER.format(tools="\n".join(lines)), TOOL_RULES]
    if any(td["name"] == "calculate" for td in tool_defs):
        parts.append(CALCULATE_EXAMPLE)
    return "\n\n".join(parts)


def _last_user_text(messages: list[dict[str, str]]) -> str:
    for m in reversed(messages):
        if m.get("role") == "user":
            return m.get("content", "")
    return ""


def _should_nudge(reply: str, question: str, enabled: set[str]) -> bool:
    if ANNOUNCE_PATTERN.search(reply):
        return True
    return "calculate" in enabled and bool(MATH_QUESTION_PATTERN.search(question))


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
    text = json.dumps(result, ensure_ascii=False)
    if len(text) > FORMATTED_RESULT_MAX_CHARS:
        text = text[:FORMATTED_RESULT_MAX_CHARS] + "…(truncated)"
    return text


class AgentLoop:
    def __init__(self, model: ModelProvider, tools: ToolRegistry):
        self.model = model
        self.tools = tools

    async def run(
        self,
        messages: list[dict[str, str]],
        enabled_tools: list[str],
        max_tokens: int = 1024,
        context: ToolContext | None = None,
    ) -> dict[str, Any]:
        context = context or ToolContext()
        tool_defs = self.tools.list_definitions(enabled_tools)
        enabled_names = {td["name"] for td in tool_defs}
        tools_used: list[str] = []
        steps: list[dict[str, Any]] = []
        total_input = 0
        total_output = 0
        last_tool_result: str | None = None

        working_messages = [dict(m) for m in messages]

        extra_system = []
        if tool_defs:
            extra_system.append(_tools_prompt(tool_defs))
        files_prompt = _files_prompt(context, "read_file" in enabled_names)
        if files_prompt:
            extra_system.append(files_prompt)

        if extra_system:
            addition = "\n\n".join(extra_system)
            if working_messages and working_messages[0]["role"] == "system":
                working_messages[0]["content"] += "\n\n" + addition
            else:
                working_messages.insert(0, {"role": "system", "content": addition})

        question = _last_user_text(messages)
        nudged = False

        for iteration in range(MAX_TOOL_CALLS + 2):
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

            if not parsed and tool_defs and not nudged and not tools_used and _should_nudge(content, question, enabled_names):
                nudged = True
                logger.info("No tool call in a reply that needs one; nudging once")
                # The reminder is not kept in the transcript: the model retries from the same point.
                retry_messages = working_messages + [{"role": "user", "content": NUDGE}]
                retry = self.model.generate(messages=retry_messages, max_tokens=max_tokens, temperature=0.2)
                total_input += retry.get("input_tokens", 0)
                total_output += retry.get("output_tokens", 0)
                retry_content = retry.get("content", "")
                if _parse_tool_call(retry_content):
                    content = retry_content
                    parsed = _parse_tool_call(content)

            if not parsed or len(steps) >= MAX_TOOL_CALLS:
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

            tool = self.tools.get(tool_name) if tool_name in enabled_names else None
            if not tool:
                tool_result = {"error": f"Tool not available: {tool_name}"}
                status = "error"
            else:
                try:
                    tool_result = await asyncio.wait_for(
                        tool.execute(tool_args, context),
                        timeout=TOOL_TIMEOUT,
                    )
                    tools_used.append(tool_name)
                    status = "error" if isinstance(tool_result, dict) and "error" in tool_result else "ok"
                except asyncio.TimeoutError:
                    tool_result = {"error": f"Tool '{tool_name}' timed out"}
                    status = "error"
                except Exception:
                    logger.exception("Tool %s failed", tool_name)
                    tool_result = {"error": f"Tool '{tool_name}' failed unexpectedly"}
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

            # Native layout: the assistant turn keeps its <tool_call>, the result comes back as <tool_response>.
            working_messages.append({"role": "assistant", "content": content.strip()})
            working_messages.append({
                "role": "user",
                "content": f"<tool_response>\n{formatted}\n</tool_response>",
            })

        return {
            "content": last_tool_result or "I was unable to complete the request.",
            "tools_used": tools_used,
            "steps": steps,
            "input_tokens": total_input,
            "output_tokens": total_output,
            "total_tokens": total_input + total_output,
        }
