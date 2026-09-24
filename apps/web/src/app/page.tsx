import Link from "next/link";

function TarryLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" fill="var(--color-accent)" />
      <circle cx="11" cy="14" r="2.5" fill="white" />
      <circle cx="11.5" cy="13.5" r="0.8" fill="white" opacity="0.9" />
      <circle cx="21" cy="14" r="2.5" fill="var(--color-violet)" />
      <circle cx="21.5" cy="13.5" r="0.8" fill="white" opacity="0.9" />
      <path d="M11 21c2.5 3 7.5 3 10 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const features = [
  {
    title: "Calcoli",
    desc: "Risolvi espressioni matematiche in tempo reale.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="2" width="14" height="16" rx="2" />
        <path d="M7 7h6M10 4v6" />
        <circle cx="7" cy="14" r="0.5" fill="currentColor" />
        <circle cx="10" cy="14" r="0.5" fill="currentColor" />
        <circle cx="13" cy="14" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Ricerca web",
    desc: "Cerca informazioni aggiornate direttamente dal web.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="9" cy="9" r="6" />
        <path d="M13.5 13.5L17 17" />
      </svg>
    ),
  },
  {
    title: "Plugin",
    desc: "Architettura modulare. Installa ed estendi le capacita.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="14" height="14" rx="3" />
        <circle cx="10" cy="10" r="3" />
      </svg>
    ),
  },
  {
    title: "API",
    desc: "Integra Tarry nel tuo workflow con chiavi personali.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 5L3 10l4 5" />
        <path d="M13 5l4 5-4 5" />
        <line x1="12" y1="4" x2="8" y2="16" />
      </svg>
    ),
  },
];

const plans = [
  {
    name: "Free",
    tokens: "100K",
    price: "0",
    features: ["100.000 token/mese", "Plugin base", "5 conversazioni"],
  },
  {
    name: "Plus",
    tokens: "2M",
    price: "9",
    highlight: true,
    features: [
      "2.000.000 token/mese",
      "Tutti i plugin",
      "Conversazioni illimitate",
      "Upload file",
      "API access",
    ],
  },
  {
    name: "Pro",
    tokens: "10M",
    price: "29",
    features: [
      "10.000.000 token/mese",
      "Tutti i plugin",
      "Tutto illimitato",
      "Supporto prioritario",
      "Integrazioni custom",
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <TarryLogo size={28} />
          <span className="text-lg font-bold tracking-tight">Tarry</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost text-sm">
            Accedi
          </Link>
          <Link href="/signup" className="btn-primary text-sm">
            Inizia gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-8"
          style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-text)", border: "1px solid var(--color-accent)" }}>
          <TarryLogo size={16} />
          <span className="font-medium">AI Assistant by TestardStudios</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl leading-tight">
          La tua AI,{" "}
          <span style={{ color: "var(--color-accent-text)" }}>oltre la chat</span>
        </h1>
        <p
          className="mt-5 text-lg max-w-xl mx-auto"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Un assistente AI che usa strumenti, plugin e ricerca web.
          Leggero, estensibile, tuo.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary px-6 py-2.5 text-base">
            Prova Tarry
          </Link>
          <a href="#plans" className="btn-secondary px-6 py-2.5">
            Vedi i piani
          </a>
        </div>
      </section>

      {/* Features */}
      <section
        className="py-20 border-t"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-bg-secondary)",
        }}
      >
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-sm font-medium text-center mb-2" style={{ color: "var(--color-accent-text)" }}>
            Funzionalita
          </p>
          <h2 className="text-2xl font-bold text-center mb-12">
            Cosa puo fare Tarry
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="card flex gap-4 items-start">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "var(--color-bg-secondary)", color: "var(--color-text)" }}
                >
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold mb-0.5">{f.title}</h3>
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20 px-6" id="plans">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-medium text-center mb-2" style={{ color: "var(--color-accent-text)" }}>
            Prezzi
          </p>
          <h2 className="text-2xl font-bold text-center mb-12">
            Inizia gratis, scala quando serve
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className="card flex flex-col"
                style={
                  p.highlight
                    ? { borderColor: "var(--color-accent)", borderWidth: "2px" }
                    : undefined
                }
              >
                {p.highlight && (
                  <span
                    className="self-start text-xs font-semibold px-2.5 py-1 rounded-md mb-3"
                    style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-text)" }}
                  >
                    Consigliato
                  </span>
                )}
                <h3 className="font-bold text-lg">{p.name}</h3>
                <div className="flex items-baseline gap-0.5 mt-1 mb-5">
                  <span className="text-3xl font-bold">
                    &euro;{p.price}
                  </span>
                  <span className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                    /mese
                  </span>
                </div>
                <ul className="flex-1 space-y-2.5 mb-6">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                        <path d="M4 8l3 3 5-5.5" stroke="var(--color-teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`text-center ${
                    p.highlight ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  {p.name === "Free" ? "Inizia gratis" : "Scegli " + p.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t py-8 px-6"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TarryLogo size={18} />
            <span className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              Tarry AI &mdash; TestardStudios &copy; {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            <Link href="/legal/terms" className="hover:underline">Condizioni</Link>
            <Link href="/legal/privacy" className="hover:underline">Privacy</Link>
            <Link href="/legal/cookies" className="hover:underline">Cookie</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
