# Tarry AI

**Your AI, beyond the chat.**

Tarry is a lightweight AI assistant by [TestardStudios](https://testardstudios.it) that goes beyond simple chat — it can use tools, plugins, web search, files, and APIs to help you get things done.

## Architecture

```
User → Render.com (Frontend) → Supabase (Backend) → VPS (AI Runtime)
                                     ↕
                                   Stripe (Billing)
```

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | Next.js + React + TypeScript | UI on Render.com |
| Backend | Supabase (Auth, PostgreSQL, RLS, Edge Functions, Storage) | API, auth, data |
| Runtime | Python + FastAPI + llama.cpp | AI model + tools + plugins |
| Billing | Stripe | Subscriptions + payments |

## Project Structure

```
tarry-ai/
├── apps/web/          # Next.js frontend
├── supabase/
│   ├── functions/     # Edge Functions (chat, stripe-webhook)
│   └── migrations/    # SQL migrations
├── runtime/           # Python AI runtime
│   ├── model/         # Model provider abstraction
│   ├── agent/         # Agent loop
│   ├── tools/         # Tool system
│   ├── plugins/       # Built-in plugins
│   ├── api/           # FastAPI server
│   └── config/        # Settings
├── docs/              # Documentation
├── Dockerfile         # Runtime container
└── docker-compose.yml
```

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.12+
- Supabase account
- Stripe account

### Frontend

```bash
cd apps/web
cp ../../.env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

### Runtime (VPS)

```bash
# Download a ~2B GGUF model into runtime/model/weights/
pip install -r runtime/requirements.txt
python -m runtime
```

### With Docker

```bash
docker compose up
```

## Plans

| Plan | Tokens/month | Price |
|------|-------------|-------|
| Free | 100,000 | €0 |
| Plus | 2,000,000 | €9 |
| Pro | 10,000,000 | €29 |

## Plugins

| Plugin | Description | Permissions |
|--------|-------------|-------------|
| Calculator | Safe math evaluation | — |
| Web Search | Search the web | web.search |
| Files | Upload and read files | files.read, files.write |
| HTTP | Controlled API requests | http.request |

## Documentation

See [`docs/`](docs/) for detailed documentation:

- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Plugin Development](docs/PLUGIN_DEVELOPMENT.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Security](docs/SECURITY.md)

## License

Proprietary — TestardStudios
