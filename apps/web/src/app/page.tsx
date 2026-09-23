import Link from "next/link";

const features = [
  {
    title: "Tools",
    desc: "Built-in calculator, web search, and extensible tool system for real-world tasks.",
  },
  {
    title: "Plugins",
    desc: "Modular plugin architecture. Install, configure, and extend capabilities on demand.",
  },
  {
    title: "Web",
    desc: "Search the web for current information. No knowledge cutoff for what matters.",
  },
  {
    title: "Files",
    desc: "Upload documents, extract content, and use them as context for smarter answers.",
  },
  {
    title: "API",
    desc: "Integrate Tarry into your workflow with a documented REST API and personal API keys.",
  },
  {
    title: "Security",
    desc: "Row-level security, scoped permissions, encrypted secrets. Your data stays yours.",
  },
];

const plans = [
  {
    name: "Free",
    tokens: "100K",
    price: "€0",
    features: ["100,000 tokens/month", "Core plugins", "5 conversations"],
  },
  {
    name: "Plus",
    tokens: "2M",
    price: "€9",
    highlight: true,
    features: [
      "2,000,000 tokens/month",
      "All plugins",
      "Unlimited conversations",
      "File uploads",
      "API access",
    ],
  },
  {
    name: "Pro",
    tokens: "10M",
    price: "€29",
    features: [
      "10,000,000 tokens/month",
      "All plugins",
      "Unlimited everything",
      "Priority support",
      "Custom integrations",
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
        <span className="text-lg font-semibold tracking-tight">Tarry</span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-2xl px-6 pt-24 pb-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Tarry
        </h1>
        <p
          className="mt-3 text-lg"
          style={{ color: "var(--color-text-secondary)" }}
        >
          La tua AI, oltre la chat.
        </p>
        <p
          className="mt-4 text-base leading-relaxed"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Un assistente AI leggero che può utilizzare strumenti, plugin, web,
          file e API.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary px-6 py-2.5">
            Prova Tarry
          </Link>
          <a href="#plans" className="btn-secondary px-6 py-2.5">
            Scopri i piani
          </a>
        </div>
        <p
          className="mt-6 text-xs"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          by TestardStudios
        </p>
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
          <h2 className="text-2xl font-semibold text-center mb-12">
            Cosa può fare Tarry
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="card">
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

      {/* Plans */}
      <section className="py-20 px-6" id="plans">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold text-center mb-12">Piani</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className="card flex flex-col"
                style={
                  p.highlight
                    ? { borderColor: "var(--color-accent)" }
                    : undefined
                }
              >
                <div className="flex items-baseline justify-between mb-4">
                  <h3 className="font-semibold">{p.name}</h3>
                  <span className="text-2xl font-bold">{p.price}</span>
                </div>
                <ul className="flex-1 space-y-2">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <span style={{ color: "var(--color-success)" }}>&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-6 text-center ${
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
        className="border-t py-8 px-6 text-center text-xs"
        style={{
          borderColor: "var(--color-border-light)",
          color: "var(--color-text-tertiary)",
        }}
      >
        Tarry AI &mdash; by TestardStudios
      </footer>
    </div>
  );
}
