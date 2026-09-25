export interface StreamStep {
  tool: string;
  args: Record<string, unknown>;
  result: string;
  status: "ok" | "error";
}

export interface DoneResult {
  content: string;
  tools_used?: string[];
  steps?: StreamStep[];
  input_tokens?: number;
  output_tokens?: number;
}

export type StreamEvent =
  | { type: "token"; text: string }
  | { type: "discard" }
  | { type: "step"; step: StreamStep }
  | { type: "done"; result: DoneResult }
  | { type: "error"; error: string };

export interface DraftState {
  content: string;
  steps: StreamStep[];
  done: DoneResult | null;
  error: string | null;
}

export const emptyDraft = (): DraftState => ({ content: "", steps: [], done: null, error: null });

export function applyEvent(state: DraftState, event: StreamEvent): DraftState {
  switch (event.type) {
    case "token":
      return { ...state, content: state.content + event.text };
    case "discard":
      return { ...state, content: "" };
    case "step":
      return { ...state, steps: [...state.steps, event.step] };
    case "done":
      // The final result is authoritative: it may differ from what was streamed.
      return {
        ...state,
        content: event.result.content,
        steps: event.result.steps ?? state.steps,
        done: event.result,
      };
    case "error":
      return { ...state, error: event.error };
    default:
      return state;
  }
}

/** Incremental server-sent-events parser: feed text as it arrives, get complete events back. */
export function createSseParser() {
  let buffer = "";

  function parseBlock(block: string): StreamEvent[] {
    const out: StreamEvent[] = [];
    for (const line of block.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(line.slice(6));
        if (event && typeof event.type === "string") out.push(event as StreamEvent);
      } catch {
        // Heartbeats and malformed lines are ignored.
      }
    }
    return out;
  }

  return {
    feed(text: string): StreamEvent[] {
      buffer += text;
      const events: StreamEvent[] = [];
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        events.push(...parseBlock(buffer.slice(0, sep)));
        buffer = buffer.slice(sep + 2);
      }
      return events;
    },
    end(): StreamEvent[] {
      const rest = buffer;
      buffer = "";
      return rest.trim() ? parseBlock(rest) : [];
    },
  };
}

const ERRORS: Record<string, string> = {
  "Token limit reached": "Hai esaurito i token di questo mese. Puoi passare a Plus o Pro dalle impostazioni.",
  "Too many requests. Please wait a moment.": "Troppi messaggi in poco tempo. Attendi un minuto e riprova.",
  "AI runtime unavailable": "Tarry non è raggiungibile in questo momento. Riprova tra poco.",
  "Conversation not found": "Questa conversazione non esiste più. Aprine una nuova.",
  timeout: "La risposta ha richiesto troppo tempo. Prova con una domanda più breve.",
  incomplete: "La risposta si è interrotta. Riprova.",
  network: "Connessione assente o instabile. Controlla la rete e riprova.",
};

export function errorMessage(code: string | undefined): string {
  return (code && ERRORS[code]) || "Qualcosa è andato storto. Riprova tra poco.";
}
