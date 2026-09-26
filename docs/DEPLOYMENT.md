# Tarry AI — Deployment

## Architecture

```
tarry.testardstudios.it → Render.com (Frontend)
                                ↓
                           Supabase (Backend)
                                ↓
                           VPS (Runtime)
```

## 1. Supabase Setup

1. Create a new Supabase project
2. Run the migration: `supabase/migrations/00001_initial_schema.sql`
3. Configure Auth providers (email/password)
4. Deploy Edge Functions:
   ```bash
   supabase functions deploy chat
   supabase functions deploy stripe-webhook
   ```
5. Set Edge Function secrets:
   ```bash
   supabase secrets set TARRY_RUNTIME_URL=https://your-runtime-domain
   supabase secrets set TARRY_RUNTIME_SECRET=your-secret
   supabase secrets set STRIPE_SECRET_KEY=sk_...
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   supabase secrets set STRIPE_PRICE_FREE=price_...
   supabase secrets set STRIPE_PRICE_PLUS=price_...
   supabase secrets set STRIPE_PRICE_PRO=price_...
   ```

## 2. Frontend on Render.com

1. Create a new Web Service on Render
2. Connect your repository
3. Build command: `cd apps/web && npm install && npm run build`
4. Start command: `cd apps/web && npm start`
5. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL=https://tarry.testardstudios.it`
6. Add custom domain: `tarry.testardstudios.it`
7. Configure DNS: CNAME to your Render URL

## 3. VPS Runtime

1. SSH into your VPS
2. Install Docker
3. Clone the repository
4. Download a GGUF model (~2B parameters) into `runtime/model/weights/`
   - Recommended: Qwen2.5-1.5B-Instruct or similar
5. Create `.env` with `RUNTIME_SECRET`
6. HTTPS: if ports 80 and 443 are free, add `COMPOSE_PROFILES=https` to `.env` so Caddy gets a
   Let's Encrypt certificate for the runtime. If another web server already owns them, proxy
   `RUNTIME_DOMAIN` to `127.0.0.1:8000` from that server instead.
   Set `RUNTIME_DOMAIN` in `.env` if you use your own domain; the default is
   `85-155-151-119.sslip.io`, which resolves to the VPS IP.
7. Start:
   ```bash
   docker compose up -d --build
   ```
8. Verify: `curl https://$RUNTIME_DOMAIN/health`
9. Point Supabase at HTTPS: `supabase secrets set TARRY_RUNTIME_URL=https://$RUNTIME_DOMAIN`,
   then add `RUNTIME_BIND=127.0.0.1` to `.env` and run `docker compose up -d` so port 8000
   is no longer reachable from outside.

### Without Docker

```bash
cd runtime
pip install -r requirements.txt
export RUNTIME_SECRET=your-secret
export MODEL_PATH=./model/weights/model.gguf
python -m runtime
```

## 4. Stripe Setup

1. Create products and prices for Free, Plus, Pro plans
2. Set up webhook endpoint: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
3. Subscribe to events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`

## 5. DNS

| Record | Type | Value |
|--------|------|-------|
| tarry.testardstudios.it | CNAME | your-render-app.onrender.com |

## Environment Variables Summary

### Frontend (Render)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_APP_URL` | Frontend URL |

### Supabase Edge Functions

| Variable | Description |
|----------|-------------|
| `TARRY_RUNTIME_URL` | VPS runtime URL |
| `TARRY_RUNTIME_SECRET` | Shared secret for VPS auth |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

### VPS Runtime

| Variable | Description |
|----------|-------------|
| `RUNTIME_SECRET` | Auth secret (must match Supabase config) |
| `MODEL_PATH` | Path to GGUF model file |
| `WEB_SEARCH_API_KEY` | Brave Search API key |
