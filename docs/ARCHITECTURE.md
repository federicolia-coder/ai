# Tarry AI — Architecture

## Overview

Tarry AI follows a three-tier architecture:

1. **Frontend** (Render.com) — React/Next.js SPA
2. **Backend** (Supabase) — Auth, database, API, storage
3. **Runtime** (VPS) — AI model, agent loop, tools, plugins

The browser never communicates directly with the VPS.

## Request Flow

```
Browser → Render.com → Supabase Edge Function → VPS Runtime → Model → Tools/Plugins → Response → Supabase → Render → Browser
```

### Step by Step

1. User sends a message in the frontend
2. Frontend calls Supabase Edge Function (`/functions/v1/chat`)
3. Edge Function verifies auth via Supabase Auth
4. Edge Function checks token usage against limits
5. Edge Function loads conversation history and enabled plugins
6. Edge Function forwards request to VPS Runtime (authenticated)
7. Runtime runs agent loop: model → optional tool calls → final response
8. Edge Function saves assistant message and updates token usage
9. Response returned to frontend

## Components

### Render.com (Frontend)

- Next.js 15 with App Router
- TypeScript + Tailwind CSS
- Supabase client SDK for auth and data
- Deployed as standalone output on Render

### Supabase (Backend)

- **Auth**: Email/password signup, login, sessions
- **PostgreSQL**: Profiles, conversations, messages, usage, subscriptions, API keys, plugins
- **RLS**: Every user table is protected — users access only their own data
- **Edge Functions**: `chat` (main endpoint), `stripe-webhook`
- **Storage**: File uploads with private buckets

### VPS (Runtime)

- Python 3.12 + FastAPI
- llama-cpp-python for model inference
- ~2B parameter model, quantized (GGUF format)
- Agent loop with tool calling
- Concurrency limited via semaphore
- Private API authenticated with shared secret

### Stripe (Billing)

- Checkout sessions for plan upgrades
- Webhook for subscription lifecycle events
- Billing portal for self-service management
- Plans: Free (100K tokens), Plus (2M tokens), Pro (10M tokens)

## Database Schema

Key tables with RLS:

- `profiles` — User profiles (linked to auth.users)
- `conversations` — Chat conversations
- `messages` — Individual messages with role, content, token_count
- `usage` — Token consumption per billing period
- `subscriptions` — Stripe subscription data
- `api_keys` — Hashed API keys
- `plugins` — Available plugins
- `user_plugins` — Per-user plugin configuration

## Security Boundaries

- Frontend ↔ Supabase: Supabase Auth (JWT)
- Supabase ↔ VPS: Shared secret (Bearer token)
- VPS is not publicly accessible
- All user data is RLS-protected
- API keys are hashed (SHA-256)
- Stripe webhooks are signature-verified
