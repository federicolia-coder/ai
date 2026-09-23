# Tarry AI — Plugin Development

## Overview

Plugins extend Tarry's capabilities by providing new tools. Each plugin consists of:

1. A **manifest** (database entry with name, description, version, permissions, tools)
2. One or more **tool implementations** (Python classes)

## Creating a Plugin

### 1. Define the Tool

Create a new file in `runtime/plugins/`:

```python
from typing import Any
from runtime.tools.base import Tool, ToolDefinition


class MyTool(Tool):
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name="my_tool",
            description="What this tool does",
            parameters={
                "type": "object",
                "properties": {
                    "input": {
                        "type": "string",
                        "description": "Input parameter",
                    }
                },
                "required": ["input"],
            },
            permissions=["my_plugin.use"],
        )

    async def execute(self, params: dict[str, Any]) -> dict[str, Any]:
        input_value = params.get("input", "")
        result = process(input_value)
        return {"result": result}
```

### 2. Register the Tool

In `runtime/api/server.py`, add to the `startup` function:

```python
from runtime.plugins.my_plugin import MyTool
tools.register(MyTool())
```

### 3. Add Database Entry

Add a migration or insert:

```sql
INSERT INTO plugins (name, description, version, permissions, tools)
VALUES (
  'my_plugin',
  'Description of the plugin',
  '1.0.0',
  ARRAY['my_plugin.use'],
  ARRAY['my_tool']
);
```

## Plugin Manifest

| Field | Type | Description |
|-------|------|-------------|
| name | string | Unique identifier |
| description | string | Human-readable description |
| version | string | Semver version |
| permissions | string[] | Required permissions |
| tools | string[] | Tool names provided |
| enabled_by_default | boolean | Auto-enable for new users |

## Tool Interface

Every tool must implement:

- `definition()` → `ToolDefinition` with name, description, JSON Schema parameters, and permissions
- `execute(params)` → `dict` with the tool's result or error

## Permissions

Permissions use a dot-separated format:

- `web.search` — Web search access
- `files.read` — Read user files
- `files.write` — Write user files
- `http.request` — Make HTTP requests
- `shell.execute` — Execute shell commands (dangerous)

Dangerous permissions require explicit user consent.

## Best Practices

- Always validate inputs
- Set timeouts on external calls
- Return structured results
- Handle errors gracefully (return `{"error": "..."}` instead of raising)
- Keep tool descriptions clear for the model to understand when to use them
