import Link from "next/link";
import {
  ArrowRight,
  BracketsCurly,
  Calculator,
  Check,
  FileCsv,
  FileDoc,
  FileImage,
  FilePdf,
  FileTxt,
  FileXls,
  GithubLogo,
  Minus,
  NotionLogo,
  WebhooksLogo,
} from "@phosphor-icons/react/dist/ssr";
import { SiteNav } from "@/components/landing/site-nav";
import { RevealObserver, TaglineReveal } from "@/components/landing/reveal";
import { ChatDemo, type DemoScript } from "@/components/landing/chat-demo";
import { CapabilityStack, type Capability } from "@/components/landing/capability-stack";
import { Faq } from "@/components/landing/faq";
import { TarryMark } from "@/components/tarry-mark";

const heroScript: DemoScript = {
  attachment: "preventivo-cucina.pdf · 184 KB",
  question: "Nel preventivo che ti ho mandato, qual è il totale con l'IVA al 22%?",
  steps: [
    { tool: "file", label: "Lettura file", detail: "preventivo-cucina.pdf", result: "Imponibile: 3.480,00 €" },
    { tool: "calculate", label: "Calcolo", detail: "3.480 × 1,22", result: "3.480 × 1,22 = 4.245,60" },
  ],
  answer: (
    <p>
      Il totale con IVA al 22% è <strong>4.245,60 €</strong>. L&apos;imponibile nel preventivo è 3.480,00 € e
      l&apos;IVA vale 765,60 €.
    </p>
  ),
};

const capabilities: Capability[] = [
  {
    id: "web",
    title: "Cerca sul web quando la risposta cambia",
    body: "Orari, notizie, prezzi, risultati. Tarry cerca prima di rispondere e ti dice dove ha letto, così puoi verificare.",
    script: {
      question: "Che orari ha oggi la Pinacoteca di Brera?",
      steps: [{ tool: "search", label: "Ricerca web", detail: "orari Pinacoteca di Brera oggi", result: "3 fonti trovate" }],
      answer: (
        <p>
          Ho trovato gli orari sul sito ufficiale del museo e su due guide aggiornate. Te li riporto con i link alle
          fonti, così puoi controllarli prima di uscire.
        </p>
      ),
    },
  },
  {
    id: "calc",
    title: "Fa i conti con una calcolatrice vera",
    body: "Percentuali, IVA, divisioni tra coinquilini, conversioni. Il numero arriva da un calcolo, non da una stima del modello.",
    script: {
      question: "Dividi 1.270 € di affitto in tre. Giulia ha la stanza grande e paga il 40%.",
      steps: [
        { tool: "calculate", label: "Calcolo", detail: "1.270 × 0,40", result: "1.270 × 0,40 = 508,00" },
        { tool: "calculate", label: "Calcolo", detail: "(1.270 − 508) ÷ 2", result: "762 ÷ 2 = 381,00" },
      ],
      answer: (
        <p>
          Giulia paga <strong>508,00 €</strong>, voi due <strong>381,00 €</strong> a testa. Il totale torna a
          1.270,00 €.
        </p>
      ),
    },
  },
  {
    id: "file",
    title: "Legge i file che alleghi",
    body: "PDF, Word, Excel, CSV e testo fino a 10 MB. Chiedi un riassunto o cerca un dato preciso in un documento lungo.",
    script: {
      attachment: "spese-casa-2026.xlsx · 38 KB",
      question: "Qual è stato il mese con la spesa più alta?",
      steps: [{ tool: "file", label: "Lettura file", detail: "spese-casa-2026.xlsx", result: "12 righe, 4 colonne" }],
      answer: (
        <p>
          <strong>Marzo</strong>, con 1.284,30 €. La voce che pesa di più è il riscaldamento: 412,00 €.
        </p>
      ),
    },
  },
  {
    id: "connectors",
    title: "Lavora dentro i tuoi strumenti",
    body: "Collega GitHub o Notion dalla pagina Connettori. Tarry legge repository, issue e pagine solo quando glielo chiedi.",
    script: {
      question: "Quali issue sono ancora aperte su testard/sito?",
      steps: [{ tool: "github", label: "GitHub", detail: "testard/sito, issue aperte", result: "2 issue aperte" }],
      answer: (
        <ul className="space-y-1">
          <li>
            <strong>#42</strong> Il menu non si chiude su iPhone
          </li>
          <li>
            <strong>#39</strong> Aggiornare i prezzi nella pagina
          </li>
        </ul>
      ),
    },
  },
];

const formats = [
  { icon: FilePdf, name: "PDF", note: "Con testo selezionabile" },
  { icon: FileDoc, name: "Word", note: "Documenti .docx" },
  { icon: FileXls, name: "Excel", note: "Tutti i fogli .xlsx" },
  { icon: FileCsv, name: "CSV", note: "Tabelle ed esportazioni" },
  { icon: BracketsCurly, name: "JSON", note: "Dati strutturati" },
  { icon: FileTxt, name: "Testo", note: "Anche Markdown" },
  { icon: FileImage, name: "Immagini", note: "Salvate in chat, non ancora lette" },
  { icon: GithubLogo, name: "GitHub", note: "Repository, issue e file" },
  { icon: NotionLogo, name: "Notion", note: "Ricerca e lettura pagine" },
  { icon: WebhooksLogo, name: "Webhook", note: "Invio su tua richiesta" },
];

type Cell = string | boolean;
const plans = ["Free", "Plus", "Pro"] as const;
const planRows: { label: string; values: [Cell, Cell, Cell] }[] = [
  { label: "Token al mese", values: ["100.000", "2.000.000", "10.000.000"] },
  { label: "Ricerca web, calcoli e file", values: [true, true, true] },
  { label: "Connettori GitHub, Notion e webhook", values: [true, true, true] },
  { label: "Supporto prioritario", values: [false, false, true] },
];
const planPrices = ["0 €", "9 €", "29 €"];

const faqs = [
  {
    q: "Cos'è Tarry?",
    a: "Un assistente AI creato da TestardStudios. Risponde in italiano e usa strumenti veri: ricerca web, calcolatrice, lettura dei file e connettori a GitHub e Notion.",
  },
  {
    q: "Devo pagare per usarlo?",
    a: "No. Il piano Free include 100.000 token al mese e tutti gli strumenti. Plus e Pro aumentano i token disponibili, e Pro aggiunge il supporto prioritario.",
  },
  {
    q: "Cosa sono i token?",
    a: "Sono i pezzi di testo che il modello legge e scrive. Ogni messaggio consuma token per la domanda e per la risposta. Il limite si azzera ogni mese.",
  },
  {
    q: "Quali file posso allegare?",
    a: "PDF, Word, Excel, CSV, JSON, testo e Markdown fino a 10 MB, fino a 5 per messaggio. Le immagini si possono allegare, ma il modello attuale legge solo testo e non ne vede il contenuto.",
  },
  {
    q: "Come collego GitHub o Notion?",
    a: "Dalla pagina Connettori incolli un token di GitHub o la chiave di un'integrazione Notion. Tarry la verifica subito e, una volta salvata, nemmeno la pagina può rileggerla.",
  },
  {
    q: "I miei dati sono al sicuro?",
    a: "Le conversazioni restano nel tuo account e non vengono condivise. Il modello gira su un server privato, non tramite API di terze parti.",
  },
  {
    q: "Posso usare Tarry per il codice?",
    a: "Sì. Tarry formatta il codice, spiega gli errori e può cercare documentazione aggiornata sul web. Con GitHub collegato legge anche i file dei tuoi repository.",
  },
  {
    q: "Posso disdire l'abbonamento?",
    a: "Sì, in qualsiasi momento dalle impostazioni. Mantieni l'accesso fino alla fine del periodo già pagato.",
  },
];

function PlanCell({ value }: { value: Cell }) {
  if (value === true) return <Check size={20} aria-label="Incluso" style={{ color: "var(--color-teal)" }} />;
  if (value === false) return <Minus size={20} aria-label="Non incluso" style={{ color: "var(--color-text-tertiary)" }} />;
  return <span className="tabular-nums">{value}</span>;
}

function SectionHead({ title, lede }: { title: string; lede?: string }) {
  return (
    <div className="reveal max-w-2xl">
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {lede && (
        <p className="mt-4 text-lg" style={{ color: "var(--color-text-secondary)" }}>
          {lede}
        </p>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <a href="#contenuto" className="btn-primary sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]">
        Vai al contenuto
      </a>
      <SiteNav />
      <RevealObserver />

      <main id="contenuto">
        {/* Hook */}
        <section className="mx-auto mt-12 grid max-w-6xl items-center gap-16 px-6 py-24 lg:mt-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div>
            <h1 className="reveal max-w-[680px] text-4xl font-semibold tracking-tight sm:text-5xl">
              Un chatbot <br className="hidden lg:block" />
              risponde a memoria. <br className="hidden sm:block" />
              <span
                className="underline decoration-[6px] underline-offset-[10px]"
                style={{ textDecorationColor: "var(--color-brand)", textDecorationSkipInk: "none" }}
              >
                Tarry controlla.
              </span>
            </h1>
            <p
              className="reveal mt-6 max-w-[680px] text-lg"
              style={{ color: "var(--color-text-secondary)", transitionDelay: "100ms" }}
            >
              Prima di risponderti cerca sul web, fa i calcoli con una calcolatrice vera e legge i file che alleghi. E ti
              mostra ogni passaggio.
            </p>
            <div className="reveal mt-8 flex flex-wrap items-center gap-4" style={{ transitionDelay: "200ms" }}>
              <Link href="/signup" className="btn-primary">
                Prova Tarry gratis
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a href="#come-funziona" className="btn-ghost text-base">
                Guarda come funziona
              </a>
            </div>
            <p className="reveal mt-6 text-sm" style={{ color: "var(--color-text-tertiary)", transitionDelay: "200ms" }}>
              Piano gratuito con 100.000 token al mese. Nessuna carta richiesta.
            </p>
          </div>

          <div className="reveal" style={{ transitionDelay: "300ms" }}>
            <ChatDemo script={heroScript} label="Conversazione di esempio: totale di un preventivo con IVA" play />
            <p className="mt-4 text-center text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              Conversazione di esempio. Nell&apos;app vedi gli stessi passaggi.
            </p>
          </div>
        </section>

        {/* Problem */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <SectionHead
            title="Stessa domanda, due risposte."
            lede="Un modello linguistico prevede la parola successiva. Non fa i conti e non sa cosa è successo stamattina. Quando serve un dato giusto, bisogna controllarlo."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <figure
              className="reveal rounded-2xl p-6 sm:p-8"
              style={{ border: "1px solid var(--color-border)" }}
            >
              <figcaption className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                Solo il modello
              </figcaption>
              <p className="mt-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Quanto fa il 17,5% di 2.340 €?
              </p>
              <p className="mt-4 text-2xl font-semibold tabular-nums">Circa 405 €.</p>
              <p
                className="mt-6 inline-block rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: "var(--color-rose-soft)", color: "var(--color-rose)" }}
              >
                Una stima, sbagliata di 4,50 €
              </p>
            </figure>
            <figure
              className="reveal rounded-2xl p-6 sm:p-8"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border-light)",
                boxShadow: "var(--shadow-float)",
                transitionDelay: "100ms",
              }}
            >
              <figcaption className="flex items-center gap-2 text-sm font-semibold">
                <TarryMark size={20} />
                Tarry
              </figcaption>
              <p className="mt-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Quanto fa il 17,5% di 2.340 €?
              </p>
              <div
                className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2 text-xs"
                style={{ border: "1px solid var(--color-border-light)", color: "var(--color-text-secondary)" }}
              >
                <Calculator size={16} aria-hidden="true" style={{ color: "var(--color-text)" }} />
                <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                  Calcolo
                </span>
                <span className="tabular-nums">2.340 × 0,175 = 409,50</span>
              </div>
              <p className="mt-4 text-2xl font-semibold tabular-nums">409,50 €.</p>
            </figure>
          </div>
        </section>

        {/* Solution */}
        <section id="come-funziona" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
          <SectionHead
            title="Quattro strumenti, usati solo quando servono."
            lede="Tarry decide da solo se cercare, calcolare o leggere. Tu scrivi la domanda come la faresti a un collega."
          />
          <div className="mt-16">
            <CapabilityStack items={capabilities} />
          </div>
        </section>

        {/* Tagline */}
        <section className="mx-auto max-w-6xl px-6 py-24" aria-label="In sintesi">
          <TaglineReveal
            lines={[
              "Ogni risposta ti dice",
              "come ci è arrivata.",
              "Se Tarry ha cercato,",
              "calcolato o letto un file,",
              "lo vedi scritto sopra.",
            ]}
          />
        </section>

        {/* Proof */}
        <section id="cosa-legge" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
          <SectionHead
            title="Legge quello che usi già."
            lede="File fino a 10 MB, fino a 5 per messaggio. I connettori verificano le credenziali prima di salvarle."
          />
          <ul
            className="reveal mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl sm:grid-cols-3 lg:grid-cols-5"
            style={{ background: "var(--color-border-light)", border: "1px solid var(--color-border-light)" }}
          >
            {formats.map(({ icon: Icon, name, note }) => (
              <li key={name} className="p-6" style={{ background: "var(--color-surface)" }}>
                <Icon size={28} aria-hidden="true" />
                <p className="mt-4 text-base font-semibold">{name}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                  {note}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Pricing */}
        <section id="prezzi" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
          <SectionHead
            title="Stessi strumenti in ogni piano. Cambia quanto lo usi."
            lede="I token contano domanda e risposta e si azzerano ogni mese. Parti gratis e passi a Plus o Pro dalle impostazioni, quando vuoi."
          />

          <div className="reveal mt-12 hidden overflow-hidden rounded-2xl md:block" style={{ border: "1px solid var(--color-border-light)", background: "var(--color-surface)" }}>
            <table className="w-full text-left">
              <caption className="sr-only">Confronto dei piani Free, Plus e Pro</caption>
              <thead>
                <tr>
                  <td className="p-6" />
                  {plans.map((p, i) => (
                    <th
                      key={p}
                      scope="col"
                      className="p-6 align-top"
                      style={i === 1 ? { background: "var(--color-accent-soft)" } : undefined}
                    >
                      <span className="flex items-center gap-2 text-base font-semibold">
                        {p}
                        {i === 1 && (
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-semibold"
                            style={{ background: "var(--color-surface)", color: "var(--color-accent-text)" }}
                          >
                            Consigliato
                          </span>
                        )}
                      </span>
                      <span className="mt-2 block text-4xl font-semibold tabular-nums tracking-tight">
                        {planPrices[i]}
                      </span>
                      <span className="text-sm font-normal" style={{ color: "var(--color-text-tertiary)" }}>
                        {i === 0 ? "per sempre" : "al mese"}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {planRows.map((row) => (
                  <tr key={row.label} style={{ borderTop: "1px solid var(--color-border-light)" }}>
                    <th scope="row" className="p-6 text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                      {row.label}
                    </th>
                    {row.values.map((v, i) => (
                      <td
                        key={i}
                        className="p-6 text-base font-semibold"
                        style={i === 1 ? { background: "var(--color-accent-soft)" } : undefined}
                      >
                        <PlanCell value={v} />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr style={{ borderTop: "1px solid var(--color-border-light)" }}>
                  <td className="p-6" />
                  {plans.map((p, i) => (
                    <td key={p} className="p-6" style={i === 1 ? { background: "var(--color-accent-soft)" } : undefined}>
                      <Link href="/signup" className={i === 1 ? "btn-primary w-full" : "btn-secondary w-full text-base"}>
                        {i === 0 ? "Inizia gratis" : `Inizia con ${p}`}
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <ul className="mt-12 space-y-6 md:hidden">
            {plans.map((p, i) => (
              <li
                key={p}
                className="reveal rounded-2xl p-6"
                style={{
                  background: i === 1 ? "var(--color-accent-soft)" : "var(--color-surface)",
                  border: "1px solid var(--color-border-light)",
                }}
              >
                <p className="text-base font-semibold">{p}</p>
                <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight">
                  {planPrices[i]}{" "}
                  <span className="text-sm font-normal" style={{ color: "var(--color-text-tertiary)" }}>
                    {i === 0 ? "per sempre" : "al mese"}
                  </span>
                </p>
                <dl className="mt-6 space-y-3 text-sm">
                  {planRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-4">
                      <dt style={{ color: "var(--color-text-secondary)" }}>{row.label}</dt>
                      <dd className="font-semibold">
                        <PlanCell value={row.values[i]} />
                      </dd>
                    </div>
                  ))}
                </dl>
                <Link href="/signup" className={`mt-6 w-full ${i === 1 ? "btn-primary" : "btn-secondary text-base"}`}>
                  {i === 0 ? "Inizia gratis" : `Inizia con ${p}`}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section id="domande" className="mx-auto grid max-w-6xl scroll-mt-24 gap-12 px-6 py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="reveal">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:sticky lg:top-24">Domande frequenti</h2>
          </div>
          <div className="reveal">
            <Faq items={faqs} />
          </div>
        </section>

        {/* Close */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="reveal flex flex-col items-start gap-6">
            <TarryMark size={56} />
            <h2 className="max-w-[680px] text-4xl font-semibold tracking-tight sm:text-5xl">
              Fai la prima domanda a Tarry.
            </h2>
            <p className="max-w-[680px] text-lg" style={{ color: "var(--color-text-secondary)" }}>
              Il piano gratuito parte subito e non chiede la carta di credito.
            </p>
            <Link href="/signup" className="btn-primary mt-2">
              Crea un account gratis
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-12">
        <div
          className="flex flex-col gap-4 pt-8 text-sm sm:flex-row sm:items-center sm:justify-between"
          style={{ borderTop: "1px solid var(--color-border)", color: "var(--color-text-tertiary)" }}
        >
          <p className="flex items-center gap-2">
            <TarryMark size={20} />
            Tarry è un progetto di TestardStudios. © 2026
          </p>
          <nav aria-label="Note legali" className="flex gap-6">
            <Link href="/legal/terms" className="hover:underline">
              Termini
            </Link>
            <Link href="/legal/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/legal/cookies" className="hover:underline">
              Cookie
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
