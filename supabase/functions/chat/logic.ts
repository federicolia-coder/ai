export interface PluginRow {
  id: string;
  tools: string[];
  enabled_by_default: boolean;
}

export interface UserPluginRow {
  plugin_id: string;
  enabled: boolean;
}

export interface ConnectorGrant {
  slug: string;
  tools: string[];
  config: Record<string, unknown>;
}

/** A plugin the user never touched follows its default; an explicit choice always wins. */
export function resolvePluginTools(plugins: PluginRow[], userPlugins: UserPluginRow[]): string[] {
  const choice = new Map(userPlugins.map((u) => [u.plugin_id, u.enabled]));
  const tools = new Set<string>();
  for (const p of plugins) {
    const enabled = choice.has(p.id) ? choice.get(p.id)! : p.enabled_by_default;
    if (enabled) for (const t of p.tools ?? []) tools.add(t);
  }
  return [...tools];
}

export function resolveConnectors(grants: ConnectorGrant[]): {
  tools: string[];
  credentials: Record<string, Record<string, string>>;
} {
  const tools = new Set<string>();
  const credentials: Record<string, Record<string, string>> = {};
  for (const g of grants) {
    const cfg: Record<string, string> = {};
    for (const [k, v] of Object.entries(g.config ?? {})) {
      if (typeof v === "string" && v) cfg[k] = v;
    }
    if (Object.keys(cfg).length === 0) continue;
    credentials[g.slug] = cfg;
    for (const t of g.tools ?? []) tools.add(t);
  }
  return { tools: [...tools], credentials };
}

const CONNECTOR_NOTES: Record<string, string> = {
  github:
    "GitHub: per repository, issue e file usa github_repos, github_issues e github_file. Non inventare mai il nome di un repository: se l'utente non lo dice, usa github_repos oppure github_issues senza repo.",
  notion: "Notion: per pagine e appunti usa notion_search e poi notion_page.",
  webhook: "Webhook: usa webhook_send solo quando l'utente chiede esplicitamente di inviare qualcosa.",
};

/** System prompt lines telling the model which of the user's services are connected right now. */
export function connectorPrompt(slugs: string[]): string {
  const notes = slugs.map((slug) => CONNECTOR_NOTES[slug]).filter(Boolean);
  if (notes.length === 0) return "";
  return ["", "L'utente ha collegato questi servizi e puoi accedervi con gli strumenti:", ...notes.map((n) => `- ${n}`)].join("\n");
}

export interface HistoryRow {
  role: string;
  content: string;
}

/**
 * rows: most recent first. Returns chronological history without the message being answered now,
 * which the client stores before calling this function.
 */
export function buildHistory(
  rowsNewestFirst: HistoryRow[],
  currentMessage: string,
  limit: number,
  maxChars = Infinity,
): HistoryRow[] {
  const rows = rowsNewestFirst.filter((m) => m.role === "user" || m.role === "assistant");
  if (rows.length > 0 && rows[0].role === "user" && rows[0].content === currentMessage) {
    rows.shift();
  }
  // Every history character is prompt the CPU model must process before answering: keep the newest that fit.
  const kept: HistoryRow[] = [];
  let used = 0;
  for (const m of rows.slice(0, limit)) {
    if (used + m.content.length > maxChars) break;
    kept.push({ role: m.role, content: m.content });
    used += m.content.length;
  }
  return kept.reverse();
}

export interface AttachmentRow {
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
}

export const MAX_FILES = 5;
export const MAX_TOTAL_BYTES = 6 * 1024 * 1024;

/** Newest first in, chosen files out: images are sent without data (the model can't see them). */
export function selectAttachments(rowsNewestFirst: AttachmentRow[], userId: string): {
  download: AttachmentRow[];
  metadataOnly: AttachmentRow[];
  skipped: AttachmentRow[];
} {
  const download: AttachmentRow[] = [];
  const metadataOnly: AttachmentRow[] = [];
  const skipped: AttachmentRow[] = [];
  let budget = MAX_TOTAL_BYTES;
  for (const row of rowsNewestFirst) {
    if (download.length + metadataOnly.length >= MAX_FILES) break;
    if (!row.storage_path.startsWith(`${userId}/`)) continue;
    if (row.file_type.startsWith("image/")) {
      metadataOnly.push(row);
    } else if (row.file_size <= budget) {
      download.push(row);
      budget -= row.file_size;
    } else {
      skipped.push(row);
    }
  }
  return { download, metadataOnly, skipped };
}

export interface RelayOutcome {
  result: any | null;
  failed: boolean;
}

/**
 * Forwards every chunk of a server-sent-events stream untouched while watching for the final
 * `done` event (the answer to save) or an `error` event. Events may be split across chunks.
 */
export async function relaySse(
  stream: ReadableStream<Uint8Array>,
  send: (chunk: Uint8Array) => Promise<void>,
): Promise<RelayOutcome> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const outcome: RelayOutcome = { result: null, failed: false };

  const consume = (block: string) => {
    for (const line of block.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(line.slice(6));
        if (event.type === "done") outcome.result = event.result;
        if (event.type === "error") outcome.failed = true;
      } catch {
        // Not JSON: skipped here and in the browser alike.
      }
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    await send(value);
    buffer += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      consume(buffer.slice(0, sep));
      buffer = buffer.slice(sep + 2);
    }
  }
  if (buffer.trim()) consume(buffer);
  return outcome;
}
