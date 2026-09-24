"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: visible ? "translateY(0)" : "translateY(64px)",
        opacity: visible ? 1 : 0,
        filter: visible ? "blur(0)" : "blur(6px)",
        transition: `all 800ms cubic-bezier(0.32, 0.72, 0, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function TaglineReveal({ text }: { text: string }) {
  const words = text.split(" ");
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [activeWords, setActiveWords] = useState<Set<number>>(new Set());

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    wordRefs.current.forEach((el, i) => {
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveWords((prev) => new Set([...prev, i]));
            observer.unobserve(el);
          }
        },
        { threshold: 0.5, rootMargin: "-10% 0px -10% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <p className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight max-w-[680px] mx-auto" style={{ textWrap: "balance" }}>
      {words.map((word, i) => (
        <span
          key={i}
          ref={(el) => { wordRefs.current[i] = el; }}
          style={{
            color: activeWords.has(i) ? "var(--color-text)" : "var(--color-text-tertiary)",
            transition: `color 700ms cubic-bezier(0.32, 0.72, 0, 1)`,
          }}
        >
          {word}{" "}
        </span>
      ))}
    </p>
  );
}

const features = [
  {
    title: "Calcoli in tempo reale",
    desc: "Risolvi espressioni matematiche, conversioni e formule direttamente nella conversazione.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M9 8h6M12 5v6" />
        <circle cx="8" cy="16" r="0.5" fill="currentColor" />
        <circle cx="12" cy="16" r="0.5" fill="currentColor" />
        <circle cx="16" cy="16" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Ricerca dal web",
    desc: "Cerca informazioni aggiornate e le integra nelle risposte, con fonti verificabili.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M16 16l4 4" />
      </svg>
    ),
  },
  {
    title: "Plugin estensibili",
    desc: "Architettura modulare: installa solo quello che ti serve, disattiva il resto.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    title: "API personali",
    desc: "Genera chiavi API e integra Tarry nei tuoi workflow e nelle tue applicazioni.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 6L4 12l4 6" />
        <path d="M16 6l4 6-4 6" />
        <line x1="14" y1="4" x2="10" y2="20" />
      </svg>
    ),
  },
];

const steps = [
  {
    num: "01",
    title: "Crea un account",
    desc: "Registrati in 30 secondi. Nessuna carta di credito richiesta per iniziare.",
  },
  {
    num: "02",
    title: "Scrivi la tua domanda",
    desc: "Tarry comprende italiano, inglese e codice. Scrivi come parleresti a un collega.",
  },
  {
    num: "03",
    title: "Ottieni risposte precise",
    desc: "Tarry usa i suoi strumenti per cercare dati, calcolare e rispondere con contesto.",
  },
];

const plans = [
  {
    name: "Free",
    tokens: "100K",
    price: "0",
    features: ["100.000 token al mese", "Plugin base", "5 conversazioni"],
  },
  {
    name: "Plus",
    tokens: "2M",
    price: "9",
    highlight: true,
    features: [
      "2.000.000 token al mese",
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
    features: [
      "10.000.000 token al mese",
      "Tutti i plugin",
      "Tutto illimitato",
      "Supporto prioritario",
      "Integrazioni personalizzate",
    ],
  },
];

const faqItems = [
  {
    q: "Cos'e Tarry?",
    a: "Tarry e un assistente AI sviluppato da TestardStudios. Usa un modello linguistico locale con strumenti integrati come ricerca web, calcolatrice e un sistema di plugin.",
  },
  {
    q: "Devo pagare per usarlo?",
    a: "No. Il piano Free include 100.000 token al mese, sufficienti per decine di conversazioni. Puoi passare a Plus o Pro quando hai bisogno di piu capacita.",
  },
  {
    q: "Come funzionano i token?",
    a: "Ogni messaggio consuma token in base alla lunghezza. Il conteggio include sia la domanda che la risposta. Il limite si resetta ogni mese.",
  },
  {
    q: "Posso usare Tarry per il codice?",
    a: "Si. Tarry formatta il codice con syntax highlighting, spiega gli errori e puo cercare documentazione aggiornata tramite la ricerca web.",
  },
  {
    q: "I miei dati sono al sicuro?",
    a: "Le conversazioni sono salvate nel tuo account e non vengono condivise. Il modello gira su infrastruttura privata, non su API di terze parti.",
  },
  {
    q: "Come funziona l'API?",
    a: "Genera una chiave API dalle impostazioni del tuo account. Puoi inviare richieste POST con il tuo messaggio e ricevere la risposta in JSON. La documentazione completa e disponibile nella dashboard.",
  },
  {
    q: "Posso cancellare l'abbonamento?",
    a: "Si, in qualsiasi momento dalla pagina impostazioni. Continuerai ad avere accesso fino alla fine del periodo gia pagato.",
  },
  {
    q: "Quali lingue supporta?",
    a: "Tarry comprende e risponde in italiano e inglese. Il supporto per altre lingue dipende dal modello ed e in continuo miglioramento.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="border-b last:border-0"
      style={{ borderColor: "var(--color-border)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
        style={{ transition: "all 700ms cubic-bezier(0.32, 0.72, 0, 1)" }}
      >
        <span className="text-base font-semibold pr-4">{q}</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="shrink-0"
          style={{
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform 700ms cubic-bezier(0.32, 0.72, 0, 1)",
            color: "var(--color-text-tertiary)",
          }}
        >
          <path d="M10 4v12M4 10h12" />
        </svg>
      </button>
      <div
        style={{
          maxHeight: open ? "200px" : "0",
          opacity: open ? 1 : 0,
          overflow: "hidden",
          transition: "all 700ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <p
          className="text-sm pb-5"
          style={{ color: "var(--color-text-secondary)", textWrap: "pretty" }}
        >
          {a}
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 btn-primary">
        Vai al contenuto
      </a>

      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-4 max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <TarryLogo size={28} />
          <span className="text-lg font-bold tracking-tight">Tarry</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-2">
          <a href="#features" className="btn-ghost text-sm">Funzionalita</a>
          <a href="#plans" className="btn-ghost text-sm">Prezzi</a>
          <a href="#faq" className="btn-ghost text-sm">FAQ</a>
          <Link href="/login" className="btn-ghost text-sm">Accedi</Link>
          <Link href="/signup" className="btn-primary text-sm">Inizia gratis</Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden relative w-8 h-8 flex items-center justify-center"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Chiudi menu" : "Apri menu"}
        >
          <span
            className="absolute w-5 h-0.5 rounded-full"
            style={{
              background: "var(--color-text)",
              transform: mobileMenuOpen ? "rotate(45deg)" : "translateY(-4px)",
              transition: "all 700ms cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          />
          <span
            className="absolute w-5 h-0.5 rounded-full"
            style={{
              background: "var(--color-text)",
              transform: mobileMenuOpen ? "rotate(-45deg)" : "translateY(4px)",
              transition: "all 700ms cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          />
        </button>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 sm:hidden"
          style={{
            background: "var(--color-bg)",
            backdropFilter: "blur(24px)",
          }}
        >
          <button
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Chiudi menu"
          >
            <span className="absolute w-5 h-0.5 rounded-full rotate-45" style={{ background: "var(--color-text)" }} />
            <span className="absolute w-5 h-0.5 rounded-full -rotate-45" style={{ background: "var(--color-text)" }} />
          </button>
          {[
            { href: "#features", label: "Funzionalita" },
            { href: "#plans", label: "Prezzi" },
            { href: "#faq", label: "FAQ" },
            { href: "/login", label: "Accedi" },
          ].map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-2xl font-semibold"
              style={{
                animation: `fade-in 400ms cubic-bezier(0.32, 0.72, 0, 1) ${100 + i * 50}ms both`,
              }}
            >
              {item.label}
            </a>
          ))}
          <Link
            href="/signup"
            onClick={() => setMobileMenuOpen(false)}
            className="btn-primary text-base px-8 py-3"
            style={{ animation: "fade-in 400ms cubic-bezier(0.32, 0.72, 0, 1) 350ms both" }}
          >
            Inizia gratis
          </Link>
        </div>
      )}

      <main id="main">
        {/* Hero */}
        <section className="mx-auto max-w-3xl px-4 pt-24 pb-32 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-8"
            style={{
              background: "var(--color-accent-soft)",
              color: "var(--color-accent-text)",
              border: "1px solid var(--color-accent)",
            }}
          >
            <TarryLogo size={16} />
            <span className="font-medium">AI Assistant by TestardStudios</span>
          </div>

          <h1
            className="hero-gradient-text text-5xl sm:text-6xl font-bold tracking-tight leading-tight max-w-[680px] mx-auto"
            style={{ textWrap: "balance" }}
          >
            Il tuo assistente AI
            <br />
            che usa strumenti veri
          </h1>
          <p
            className="mt-6 text-lg max-w-xl mx-auto"
            style={{ color: "var(--color-text-secondary)", textWrap: "pretty" }}
          >
            Tarry cerca dal web, calcola, esegue plugin e risponde con contesto.
            Non un chatbot qualsiasi: un assistente che agisce.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link href="/signup" className="btn-primary px-8 py-3 text-base">
              Prova Tarry gratis
            </Link>
            <a href="#plans" className="btn-secondary px-6 py-3 text-sm">
              Vedi i piani
            </a>
          </div>
          <p
            className="mt-6 text-sm"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Nessuna carta di credito richiesta
          </p>
        </section>

        {/* Features */}
        <section
          id="features"
          className="py-24"
          style={{ background: "var(--color-bg-secondary)" }}
        >
          <div className="mx-auto max-w-4xl px-4">
            <ScrollReveal>
              <p className="text-sm font-semibold text-center mb-3" style={{ color: "var(--color-accent-text)" }}>
                Funzionalita
              </p>
              <h2 className="text-3xl font-bold text-center mb-4" style={{ textWrap: "balance" }}>
                Strumenti integrati, non promesse
              </h2>
              <p className="text-base text-center max-w-lg mx-auto mb-16" style={{ color: "var(--color-text-secondary)" }}>
                Tarry non si limita a generare testo. Ogni risposta puo usare strumenti reali per darti dati concreti.
              </p>
            </ScrollReveal>
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((f, i) => (
                <ScrollReveal key={f.title} delay={i * 100}>
                  <div className="card flex gap-4 items-start h-full">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "var(--color-bg-secondary)", color: "var(--color-text)" }}
                    >
                      {f.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{f.title}</h3>
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)", textWrap: "pretty" }}>
                        {f.desc}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Tagline reveal */}
        <section className="py-32 px-4">
          <div className="mx-auto max-w-4xl text-center">
            <TaglineReveal text="Un assistente AI che non si limita a parlare. Cerca, calcola, agisce." />
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 px-4" style={{ background: "var(--color-bg-secondary)" }}>
          <div className="mx-auto max-w-3xl">
            <ScrollReveal>
              <p className="text-sm font-semibold text-center mb-3" style={{ color: "var(--color-accent-text)" }}>
                Come funziona
              </p>
              <h2 className="text-3xl font-bold text-center mb-16" style={{ textWrap: "balance" }}>
                Tre passaggi, zero configurazione
              </h2>
            </ScrollReveal>
            <div className="space-y-12">
              {steps.map((s, i) => (
                <ScrollReveal key={s.num} delay={i * 150}>
                  <div className="flex gap-6 items-start">
                    <span
                      className="text-3xl font-bold shrink-0 w-12"
                      style={{ color: "var(--color-accent)" }}
                    >
                      {s.num}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{s.title}</h3>
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)", textWrap: "pretty" }}>
                        {s.desc}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Plans */}
        <section className="py-24 px-4" id="plans">
          <div className="mx-auto max-w-4xl">
            <ScrollReveal>
              <p className="text-sm font-semibold text-center mb-3" style={{ color: "var(--color-accent-text)" }}>
                Prezzi
              </p>
              <h2 className="text-3xl font-bold text-center mb-4" style={{ textWrap: "balance" }}>
                Inizia gratis, scala quando serve
              </h2>
              <p className="text-base text-center max-w-lg mx-auto mb-16" style={{ color: "var(--color-text-secondary)" }}>
                Nessun costo nascosto. Upgrade e downgrade in qualsiasi momento.
              </p>
            </ScrollReveal>
            <div className="grid gap-4 sm:grid-cols-3">
              {plans.map((p, i) => (
                <ScrollReveal key={p.name} delay={i * 100}>
                  <div
                    className="card flex flex-col h-full"
                    style={
                      p.highlight
                        ? { borderColor: "var(--color-accent)", borderWidth: "2px" }
                        : undefined
                    }
                  >
                    {p.highlight && (
                      <span
                        className="self-start text-xs font-semibold px-2.5 py-1 rounded-lg mb-3"
                        style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-text)" }}
                      >
                        Consigliato
                      </span>
                    )}
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    <div className="flex items-baseline gap-0.5 mt-1 mb-6">
                      <span className="text-4xl font-bold">&euro;{p.price}</span>
                      <span className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>/mese</span>
                    </div>
                    <ul className="flex-1 space-y-3 mb-8">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                            <path d="M4 8l3 3 5-5.5" stroke="var(--color-teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/signup"
                      className={`text-center py-3 ${p.highlight ? "btn-primary" : "btn-secondary"}`}
                    >
                      {p.name === "Free" ? "Inizia gratis" : `Scegli ${p.name}`}
                    </Link>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 px-4" id="faq" style={{ background: "var(--color-bg-secondary)" }}>
          <div className="mx-auto max-w-2xl">
            <ScrollReveal>
              <p className="text-sm font-semibold text-center mb-3" style={{ color: "var(--color-accent-text)" }}>
                Domande frequenti
              </p>
              <h2 className="text-3xl font-bold text-center mb-16" style={{ textWrap: "balance" }}>
                Tutto quello che devi sapere
              </h2>
            </ScrollReveal>
            <ScrollReveal>
              <div className="card">
                {faqItems.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-4 text-center">
          <ScrollReveal>
            <TarryLogo size={48} />
            <h2 className="text-3xl sm:text-4xl font-bold mt-8 mb-4 max-w-[680px] mx-auto" style={{ textWrap: "balance" }}>
              Pronto a provare un assistente
              <br />
              che fa davvero qualcosa?
            </h2>
            <p className="text-base mb-10 max-w-md mx-auto" style={{ color: "var(--color-text-secondary)" }}>
              Crea il tuo account in 30 secondi. Nessuna carta di credito, nessun vincolo.
            </p>
            <Link href="/signup" className="btn-primary px-8 py-3 text-base">
              Inizia gratis
            </Link>
          </ScrollReveal>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="border-t py-8 px-4"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TarryLogo size={18} />
            <span className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              Tarry AI &mdash; TestardStudios &copy; {new Date().getFullYear()}
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            <Link href="/legal/terms" className="hover:underline">Condizioni</Link>
            <Link href="/legal/privacy" className="hover:underline">Privacy</Link>
            <Link href="/legal/cookies" className="hover:underline">Cookie</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
