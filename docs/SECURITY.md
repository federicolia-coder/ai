# Tarry AI — Security

## Authentication

- Supabase Auth handles all user authentication
- Email/password with optional email verification
- JWT tokens for API access
- API keys hashed with SHA-256 (only prefix stored in plaintext)

## Authorization

### Row Level Security (RLS)

Every user-facing table has RLS enabled. Policies ensure:

- Users can only read/write their own data
- `profiles`: read/update own
- `conversations`: full CRUD on own
- `messages`: read/insert own
- `usage`: read own
- `subscriptions`: read own
- `api_keys`: read/insert/delete own
- `user_plugins`: full CRUD on own
- `plugins`: read-only for all (public catalog)

### Server-Side Enforcement

- Token limits checked server-side before every request
- Subscription status verified server-side
- Admin operations use service role key (never exposed to client)

## Network Security

### VPS Protection

- VPS API is not publicly accessible to end users
- Communication: Supabase Edge Functions → VPS via shared secret
- Rate limiting on all VPS endpoints
- Request size limits
- Concurrency limits (semaphore)

### CORS

- Frontend: standard browser CORS
- VPS: no CORS (not browser-accessible)

## Input Validation

- All user inputs validated server-side
- SQL injection prevented by Supabase parameterized queries
- XSS prevented by React's default escaping
- SSRF protection on HTTP plugin (blocks private IPs)

## Plugin Security

- Plugins declare required permissions
- Dangerous permissions require explicit user consent
- Tool execution has timeouts
- Tool output size is limited
- No arbitrary code execution
- Shell plugin disabled by default

## Stripe

- Webhook signatures verified using HMAC-SHA256
- Subscription data managed server-side only
- Client cannot modify plan, token limit, or subscription status

## Secrets Management

- No secrets in client-side code
- Environment variables for all credentials
- `.env.example` provided without real values
- API keys shown only once at creation time

## Rate Limiting

Applied at multiple levels:

- Supabase: built-in rate limiting
- VPS: concurrency semaphore + request timeouts
- Token system: monthly usage limits per plan
- Tools: individual timeouts

## File Security

- Supabase Storage with private buckets
- Access controlled via RLS policies
- File size limits enforced
- MIME type validation
- Filenames sanitized
- Files never auto-executed
