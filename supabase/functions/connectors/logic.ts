export interface SchemaField {
  name: string;
  type: "password" | "url" | "text";
  label: string;
  required?: boolean;
}

export type ValidationResult =
  | { ok: true; config: Record<string, string> }
  | { ok: false; error: string };

const MAX_VALUE_LENGTH = 500;

export function validateConfig(
  fields: SchemaField[],
  input: unknown,
): ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Configurazione non valida" };
  }
  const raw = input as Record<string, unknown>;
  const allowed = new Set(fields.map((f) => f.name));
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key)) return { ok: false, error: `Campo non previsto: ${key}` };
  }

  const config: Record<string, string> = {};
  for (const field of fields) {
    const value = raw[field.name];
    if (value !== undefined && value !== null && typeof value !== "string") {
      return { ok: false, error: `${field.label}: valore non valido` };
    }
    const trimmed = (value ?? "").trim();
    if (!trimmed) {
      if (field.required) return { ok: false, error: `${field.label} è obbligatorio` };
      continue;
    }
    if (trimmed.length > MAX_VALUE_LENGTH) {
      return { ok: false, error: `${field.label} è troppo lungo` };
    }
    if (field.type === "url") {
      const err = checkPublicHttpsUrl(trimmed);
      if (err) return { ok: false, error: `${field.label}: ${err}` };
    }
    config[field.name] = trimmed;
  }
  return { ok: true, config };
}

function isPrivateIPv4(host: string): boolean {
  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) {
    return false;
  }
  const [a, b] = parts;
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

export function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return isPrivateIPv4(host);
  if (host.includes(":")) {
    // IPv6 literal: allow only global unicast (2000::/3).
    return !/^[23][0-9a-f]{0,3}:/.test(host);
  }
  return false;
}

export function checkPublicHttpsUrl(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "URL non valido";
  }
  if (url.protocol !== "https:") return "deve iniziare con https://";
  if (url.username || url.password) return "non deve contenere credenziali";
  if (isPrivateHostname(url.hostname)) return "indirizzi privati o locali non sono ammessi";
  return null;
}

export async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type TestResult = { ok: true; account?: string } | { ok: false; error: string };

type Fetch = typeof fetch;

export async function testCredentials(
  slug: string,
  config: Record<string, string>,
  fetchImpl: Fetch = fetch,
): Promise<TestResult> {
  const signal = AbortSignal.timeout(8000);
  try {
    if (slug === "github") {
      const res = await fetchImpl("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "Tarry",
        },
        signal,
      });
      if (res.status === 401) return { ok: false, error: "GitHub ha rifiutato il token: controlla di averlo copiato per intero e che non sia scaduto." };
      if (!res.ok) return { ok: false, error: `GitHub ha risposto con errore ${res.status}. Riprova tra poco.` };
      const user = await res.json();
      return { ok: true, account: typeof user?.login === "string" ? user.login : undefined };
    }

    if (slug === "notion") {
      const res = await fetchImpl("https://api.notion.com/v1/users/me", {
        headers: { Authorization: `Bearer ${config.api_key}`, "Notion-Version": "2022-06-28" },
        signal,
      });
      if (res.status === 401) return { ok: false, error: "Notion ha rifiutato la chiave: usa l'\"Internal Integration Secret\" della tua integrazione." };
      if (!res.ok) return { ok: false, error: `Notion ha risposto con errore ${res.status}. Riprova tra poco.` };
      const me = await res.json();
      const name = me?.bot?.workspace_name ?? me?.name;
      return { ok: true, account: typeof name === "string" ? name : undefined };
    }

    if (slug === "webhook") {
      const body = JSON.stringify({ source: "tarry", event: "test", sent_at: new Date().toISOString() });
      const headers: Record<string, string> = { "Content-Type": "application/json", "User-Agent": "Tarry-Webhook/1.0" };
      if (config.secret) headers["X-Tarry-Signature"] = "sha256=" + (await hmacSha256Hex(config.secret, body));
      const res = await fetchImpl(config.url, { method: "POST", headers, body, redirect: "manual", signal });
      if (res.status >= 300 && res.status < 400) return { ok: false, error: "Il webhook risponde con un redirect: usa l'URL finale." };
      if (!res.ok) return { ok: false, error: `Il webhook ha risposto ${res.status} alla richiesta di prova: deve rispondere 2xx.` };
      return { ok: true, account: new URL(config.url).hostname };
    }

    return { ok: false, error: "Connettore non supportato" };
  } catch (err) {
    if (err instanceof DOMException && (err.name === "TimeoutError" || err.name === "AbortError")) {
      return { ok: false, error: "Il servizio non ha risposto entro 8 secondi." };
    }
    return { ok: false, error: "Impossibile contattare il servizio. Controlla l'indirizzo e riprova." };
  }
}
