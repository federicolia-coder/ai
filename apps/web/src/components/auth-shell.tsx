import Link from "next/link";
import { TarryMark } from "@/components/tarry-mark";
import { ChatDemo, type DemoScript } from "@/components/landing/chat-demo";

const sideScript: DemoScript = {
  question: "Quanto fa il 17,5% di 2.340 €?",
  steps: [{ tool: "calculate", label: "Calcolo", detail: "2.340 × 0,175", result: "2.340 × 0,175 = 409,50" }],
  answer: (
    <p>
      Il 17,5% di 2.340 € è <strong>409,50 €</strong>.
    </p>
  ),
};

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8">
        <Link href="/" className="flex w-fit items-center gap-2" aria-label="Tarry, pagina iniziale">
          <TarryMark size={28} />
          <span className="text-base font-semibold tracking-tight">Tarry</span>
        </Link>
        <main className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>
      <aside
        className="hidden items-center justify-center p-12 lg:flex"
        style={{ background: "var(--color-bg-secondary)" }}
        aria-label="Esempio di conversazione"
      >
        <div className="w-full max-w-md">
          <ChatDemo script={sideScript} label="Esempio: un calcolo esatto con la calcolatrice" />
          <p className="mt-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Ogni risposta ti mostra se Tarry ha cercato, calcolato o letto un file.
          </p>
        </div>
      </aside>
    </div>
  );
}

const AUTH_ERRORS: Record<string, string> = {
  "Invalid login credentials": "Email o password non corretti.",
  "Email not confirmed": "Devi prima confermare l'email: apri il link che ti abbiamo inviato.",
  "User already registered": "Esiste già un account con questa email. Prova ad accedere.",
};

export function authErrorMessage(message: string): string {
  if (AUTH_ERRORS[message]) return AUTH_ERRORS[message];
  if (/rate limit/i.test(message)) return "Troppi tentativi. Attendi qualche minuto e riprova.";
  if (/password/i.test(message)) return "La password deve avere almeno 8 caratteri.";
  return "Operazione non riuscita. Riprova tra poco.";
}
