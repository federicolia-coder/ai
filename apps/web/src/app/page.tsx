import Link from "next/link";

const features = [
  {
    title: "Tools",
    desc: "Calcolatrice, ricerca web e un sistema di strumenti estensibile per task reali.",
    color: "var(--color-accent-text)",
    bg: "var(--color-accent-soft)",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="14" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
        <rect x="7" y="17" width="4" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
        <rect x="7" y="21" width="4" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
        <circle cx="22" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
        <path d="M26 16L30 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Plugin",
    desc: "Architettura modulare a plugin. Installa, configura ed estendi le capacità.",
    color: "var(--color-violet)",
    bg: "var(--color-violet-soft)",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M14 4H8C6 4 4 6 4 8v16c0 2 2 4 4 4h16c2 0 4-2 4-4v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <rect x="17" y="3" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="23" cy="9" r="2" fill="currentColor" opacity="0.5" />
      </svg>
    ),
  },
  {
    title: "Web",
    desc: "Cerca nel web informazioni attuali. Nessun limite temporale.",
    color: "var(--color-teal)",
    bg: "var(--color-teal-soft)",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" />
        <ellipse cx="16" cy="16" rx="5" ry="12" stroke="currentColor" strokeWidth="1.5" />
        <line x1="4" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="1.5" />
        <line x1="7" y1="9" x2="25" y2="9" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <line x1="7" y1="23" x2="25" y2="23" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      </svg>
    ),
  },
  {
    title: "File",
    desc: "Carica documenti, estrai contenuti e usali come contesto.",
    color: "var(--color-rose)",
    bg: "var(--color-rose-soft)",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M8 4h10l8 8v16a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" />
        <path d="M18 4v8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="10" y1="18" x2="22" y2="18" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <line x1="10" y1="22" x2="18" y2="22" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      </svg>
    ),
  },
  {
    title: "API",
    desc: "Integra Tarry nel tuo workflow con API REST e chiavi personali.",
    color: "var(--color-amber)",
    bg: "var(--color-amber-soft)",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M10 8L4 16l6 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 8l6 8-6 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="18" y1="6" x2="14" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
  },
  {
    title: "Sicurezza",
    desc: "Row-level security, permessi granulari, secret cifrati.",
    color: "var(--color-lime)",
    bg: "var(--color-lime-soft)",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 3L5 8v8c0 7.5 4.7 14.5 11 17 6.3-2.5 11-9.5 11-17V8L16 3z" stroke="currentColor" strokeWidth="2" />
        <path d="M12 16l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const plans = [
  {
    name: "Free",
    tokens: "100K",
    price: "0",
    color: "var(--color-teal)",
    bg: "var(--color-teal-soft)",
    features: ["100.000 token/mese", "Plugin base", "5 conversazioni"],
  },
  {
    name: "Plus",
    tokens: "2M",
    price: "9",
    highlight: true,
    color: "var(--color-accent-text)",
    bg: "var(--color-accent-soft)",
    features: [
      "2.000.000 token/mese",
      "Tutti i plugin",
      "Conversazioni illimitate",
      "Upload file",
      "Accesso API",
    ],
  },
  {
    name: "Pro",
    tokens: "10M",
    price: "29",
    color: "var(--color-violet)",
    bg: "var(--color-violet-soft)",
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
      <nav
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "var(--color-border-light)" }}
      >
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="var(--color-accent)" />
            <circle cx="8" cy="10" r="2" fill="white" />
            <circle cx="16" cy="10" r="2" fill="var(--color-violet)" />
            <path d="M8 16c2 2 6 2 8 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-lg font-semibold tracking-tight">Tarry</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary">
            Inizia gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto max-w-3xl px-6 pt-24 pb-20 text-center overflow-hidden">
        {/* Decorative shapes */}
        <svg className="absolute top-8 left-8 opacity-20" width="60" height="60" viewBox="0 0 60 60" style={{ animation: "float 4s ease-in-out infinite" }}>
          <circle cx="30" cy="30" r="28" fill="var(--color-violet)" />
        </svg>
        <svg className="absolute top-16 right-12 opacity-20" width="40" height="40" viewBox="0 0 40 40" style={{ animation: "float 3s ease-in-out infinite 0.5s" }}>
          <rect x="4" y="4" width="32" height="32" rx="8" fill="var(--color-teal)" />
        </svg>
        <svg className="absolute bottom-12 left-16 opacity-15" width="48" height="48" viewBox="0 0 48 48" style={{ animation: "float 5s ease-in-out infinite 1s" }}>
          <polygon points="24,4 44,38 4,38" fill="var(--color-amber)" />
        </svg>
        <svg className="absolute bottom-20 right-20 opacity-15" width="36" height="36" viewBox="0 0 36 36" style={{ animation: "float 3.5s ease-in-out infinite 1.5s" }}>
          <circle cx="18" cy="18" r="16" fill="var(--color-rose)" />
        </svg>
        <svg className="absolute top-32 left-1/4 opacity-10" width="20" height="20" viewBox="0 0 20 20" style={{ animation: "float 6s ease-in-out infinite 2s" }}>
          <circle cx="10" cy="10" r="8" fill="var(--color-accent)" />
        </svg>

        <div className="relative">
          {/* Mascot with sparkles */}
          <div className="mx-auto mb-6 flex items-center justify-center relative" style={{ width: 100, height: 100 }}>
            {/* Sparkles around mascot */}
            <svg className="absolute" style={{ top: -4, right: 2, animation: "sparkle 2s ease-in-out infinite" }} width="16" height="16" viewBox="0 0 16 16">
              <path d="M8 0L9.5 6.5 16 8l-6.5 1.5L8 16l-1.5-6.5L0 8l6.5-1.5z" fill="var(--color-amber)" />
            </svg>
            <svg className="absolute" style={{ bottom: 8, left: -2, animation: "sparkle 2s ease-in-out infinite 0.7s" }} width="12" height="12" viewBox="0 0 16 16">
              <path d="M8 0L9.5 6.5 16 8l-6.5 1.5L8 16l-1.5-6.5L0 8l6.5-1.5z" fill="var(--color-teal)" />
            </svg>
            <svg className="absolute" style={{ top: 4, left: 6, animation: "sparkle 2s ease-in-out infinite 1.3s" }} width="10" height="10" viewBox="0 0 16 16">
              <path d="M8 0L9.5 6.5 16 8l-6.5 1.5L8 16l-1.5-6.5L0 8l6.5-1.5z" fill="var(--color-rose)" />
            </svg>
            {/* Main mascot */}
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ animation: "bounce-gentle 3s ease-in-out infinite" }}>
              <circle cx="40" cy="42" r="32" fill="var(--color-accent)" />
              {/* Blush cheeks */}
              <circle cx="22" cy="46" r="5" fill="var(--color-rose)" opacity="0.25" />
              <circle cx="58" cy="46" r="5" fill="var(--color-rose)" opacity="0.25" />
              {/* Eyes with blink */}
              <g style={{ transformOrigin: "28px 36px", animation: "blink 4s ease-in-out infinite" }}>
                <circle cx="28" cy="36" r="6" fill="white" />
                <circle cx="30" cy="35" r="3" fill="#1c1917" />
                <circle cx="31" cy="33.5" r="1.2" fill="white" />
              </g>
              <g style={{ transformOrigin: "52px 36px", animation: "blink 4s ease-in-out infinite 0.1s" }}>
                <circle cx="52" cy="36" r="6" fill="var(--color-violet)" />
                <circle cx="54" cy="35" r="3" fill="#1c1917" />
                <circle cx="55" cy="33.5" r="1.2" fill="white" />
              </g>
              {/* Big smile */}
              <path d="M28 52c6 7 18 7 24 0" stroke="white" strokeWidth="3" strokeLinecap="round" />
              {/* Little ear/antenna */}
              <circle cx="18" cy="18" r="4" fill="var(--color-teal)" />
              <circle cx="62" cy="20" r="3" fill="var(--color-amber)" />
              {/* Waving hand */}
              <g style={{ transformOrigin: "68px 50px", animation: "wave 2s ease-in-out infinite" }}>
                <circle cx="70" cy="50" r="6" fill="var(--color-accent-hover)" />
                <circle cx="70" cy="50" r="4" fill="var(--color-accent)" />
              </g>
            </svg>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            La tua AI, <span style={{ color: "var(--color-accent-text)" }}>oltre la chat</span>
          </h1>
          <p
            className="mt-4 text-lg leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Un assistente AI che usa strumenti, plugin, web, file e API.
            <br />
            Leggero, estensibile, tuo.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/signup" className="btn-primary px-6 py-2.5">
              Prova Tarry
            </Link>
            <a href="#plans" className="btn-secondary px-6 py-2.5">
              Scopri i piani
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        className="border-t py-20"
        style={{
          borderColor: "var(--color-border-light)",
          background: "var(--color-bg-secondary)",
        }}
      >
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-2xl font-semibold text-center mb-3">
            Cosa puo fare Tarry
          </h2>
          <p className="text-center mb-12 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Sei strumenti, un&apos;interfaccia
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="card group transition-all hover:shadow-sm">
                <div
                  className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg"
                  style={{ background: f.bg, color: f.color }}
                >
                  {f.icon}
                </div>
                <h3 className="font-medium mb-1">{f.title}</h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Decorative divider */}
      <div className="flex items-center justify-center gap-2 py-4" style={{ background: "var(--color-bg)" }}>
        <svg width="8" height="8"><circle cx="4" cy="4" r="3" fill="var(--color-accent)" opacity="0.4" /></svg>
        <svg width="8" height="8"><circle cx="4" cy="4" r="3" fill="var(--color-violet)" opacity="0.4" /></svg>
        <svg width="8" height="8"><circle cx="4" cy="4" r="3" fill="var(--color-teal)" opacity="0.4" /></svg>
        <svg width="8" height="8"><circle cx="4" cy="4" r="3" fill="var(--color-rose)" opacity="0.4" /></svg>
        <svg width="8" height="8"><circle cx="4" cy="4" r="3" fill="var(--color-amber)" opacity="0.4" /></svg>
      </div>

      {/* Plans */}
      <section className="py-20 px-6" id="plans">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold text-center mb-3">Piani</h2>
          <p className="text-center mb-12 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Inizia gratis, scala quando serve
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className="card flex flex-col transition-all hover:shadow-sm"
                style={
                  p.highlight
                    ? { borderColor: p.color, borderWidth: "2px" }
                    : undefined
                }
              >
                {p.highlight && (
                  <span
                    className="self-start text-xs font-medium px-2 py-0.5 rounded mb-3"
                    style={{ background: p.bg, color: p.color }}
                  >
                    Consigliato
                  </span>
                )}
                <div className="flex items-baseline gap-1 mb-1">
                  <h3 className="font-semibold text-lg">{p.name}</h3>
                </div>
                <div className="flex items-baseline gap-0.5 mb-4">
                  <span className="text-3xl font-bold" style={{ color: p.color }}>
                    &euro;{p.price}
                  </span>
                  <span className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                    /mese
                  </span>
                </div>
                <ul className="flex-1 space-y-2 mb-6">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0 mt-0.5" style={{ color: p.color }}>
                        <circle cx="8" cy="8" r="6" fill="currentColor" opacity="0.15" />
                        <path d="M5.5 8l2 2 3.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
        style={{
          borderColor: "var(--color-border-light)",
        }}
      >
        <div className="flex items-center justify-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="var(--color-accent)" />
            <circle cx="8" cy="10" r="2" fill="white" />
            <circle cx="16" cy="10" r="2" fill="var(--color-violet)" />
            <path d="M8 16c2 2 6 2 8 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            Tarry AI &mdash; by TestardStudios
          </span>
        </div>
      </footer>
    </div>
  );
}
