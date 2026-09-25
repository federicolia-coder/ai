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

export interface HistoryRow {
  role: string;
  content: string;
}

/**
 * rows: most recent first. Returns chronological history without the message being answered now,
 * which the client stores before calling this function.
 */
export function buildHistory(rowsNewestFirst: HistoryRow[], currentMessage: string, limit: number): HistoryRow[] {
  const rows = rowsNewestFirst.filter((m) => m.role === "user" || m.role === "assistant");
  if (rows.length > 0 && rows[0].role === "user" && rows[0].content === currentMessage) {
    rows.shift();
  }
  return rows.slice(0, limit).reverse().map((m) => ({ role: m.role, content: m.content }));
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
