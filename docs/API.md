# Tarry AI — API Reference

## Base URL

All API calls go through Supabase Edge Functions:

```
https://<project-ref>.supabase.co/functions/v1
```

## Authentication

All requests require a Supabase JWT token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

For API key authentication (programmatic access):

```
Authorization: Bearer tarry_<key>
```

## Endpoints

### POST /chat

Send a message and get an AI response.

**Request:**

```json
{
  "conversation_id": "uuid",
  "message": "What is 2 + 2?"
}
```

**Response:**

```json
{
  "content": "2 + 2 = 4",
  "token_count": 42,
  "metadata": {
    "tools_used": ["calculate"],
    "input_tokens": 30,
    "output_tokens": 12
  }
}
```

**Errors:**

| Status | Description |
|--------|-------------|
| 401 | Unauthorized |
| 404 | Conversation not found |
| 429 | Token limit reached |
| 502 | AI runtime unavailable |

### Supabase Direct Queries

For CRUD operations, use the Supabase client SDK directly:

#### Conversations

```typescript
// List
const { data } = await supabase
  .from("conversations")
  .select("*")
  .order("updated_at", { ascending: false });

// Create
const { data } = await supabase
  .from("conversations")
  .insert({ user_id, title: "New chat" })
  .select()
  .single();

// Update
await supabase
  .from("conversations")
  .update({ title: "Updated" })
  .eq("id", conversationId);

// Delete
await supabase
  .from("conversations")
  .delete()
  .eq("id", conversationId);
```

#### Usage

```typescript
const { data } = await supabase
  .from("usage")
  .select("*")
  .order("period_start", { ascending: false })
  .limit(1)
  .single();
```

#### Plugins

```typescript
// List all plugins
const { data } = await supabase.from("plugins").select("*");

// Enable plugin
await supabase
  .from("user_plugins")
  .upsert({ user_id, plugin_id, enabled: true });
```

## VPS Runtime API (Private)

These endpoints are not publicly accessible. They are called only by Supabase Edge Functions.

### POST /v1/chat

```json
{
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "Hello"}
  ],
  "tools": ["calculate", "search"],
  "max_tokens": 1024,
  "user_id": "uuid"
}
```

### GET /health

Returns runtime status, model state, and available tools.
