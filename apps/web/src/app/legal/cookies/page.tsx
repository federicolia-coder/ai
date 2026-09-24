export const metadata = {
  title: "Cookie Policy - Tarry AI",
};

export default function CookiesPage() {
  return (
    <article className="prose-tarry">
      <h1>Cookie Policy</h1>
      <p style={{ color: "var(--color-text-tertiary)" }}>
        Ultimo aggiornamento: 24 settembre 2026
      </p>

      <h2>1. Cosa sono i cookie</h2>
      <p>
        I cookie sono piccoli file di testo che i siti web salvano sul tuo
        dispositivo. Servono a far funzionare il sito, ricordare le tue
        preferenze e migliorare l&apos;esperienza.
      </p>

      <h2>2. Cookie che utilizziamo</h2>

      <h3>Cookie tecnici (necessari)</h3>
      <p>
        Questi cookie sono indispensabili per il funzionamento del Servizio. Non
        richiedono consenso.
      </p>
      <ul>
        <li>
          <strong>Sessione di autenticazione</strong> &mdash; gestita da
          Supabase Auth per mantenere il login. Durata: sessione del browser.
        </li>
        <li>
          <strong>Preferenza tema</strong> &mdash; ricorda la scelta tra tema
          chiaro e scuro. Durata: 1 anno.
        </li>
      </ul>

      <h3>Cookie di terze parti</h3>
      <ul>
        <li>
          <strong>Stripe</strong> &mdash; utilizzato durante il checkout per
          la prevenzione delle frodi. Vedi la{" "}
          <a
            href="https://stripe.com/it/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy di Stripe
          </a>
          .
        </li>
      </ul>

      <h2>3. Cookie non utilizzati</h2>
      <p>
        Tarry AI <strong>non</strong> utilizza:
      </p>
      <ul>
        <li>Cookie di profilazione</li>
        <li>Cookie pubblicitari</li>
        <li>Cookie di tracciamento cross-site</li>
        <li>Google Analytics o strumenti di tracking simili</li>
      </ul>

      <h2>4. Gestione dei cookie</h2>
      <p>
        Puoi gestire i cookie dalle impostazioni del tuo browser. Tieni
        presente che disabilitare i cookie tecnici potrebbe impedire il
        funzionamento del Servizio.
      </p>
      <ul>
        <li>
          <a
            href="https://support.google.com/chrome/answer/95647"
            target="_blank"
            rel="noopener noreferrer"
          >
            Chrome
          </a>
        </li>
        <li>
          <a
            href="https://support.mozilla.org/it/kb/protezione-antitracciamento-avanzata-firefox-desktop"
            target="_blank"
            rel="noopener noreferrer"
          >
            Firefox
          </a>
        </li>
        <li>
          <a
            href="https://support.apple.com/it-it/guide/safari/sfri11471/mac"
            target="_blank"
            rel="noopener noreferrer"
          >
            Safari
          </a>
        </li>
      </ul>

      <h2>5. Aggiornamenti</h2>
      <p>
        Potremmo aggiornare questa Cookie Policy. Le modifiche saranno
        pubblicate su questa pagina.
      </p>

      <h2>6. Contatti</h2>
      <p>
        Per domande sui cookie:{" "}
        <a href="mailto:privacy@testardstudios.it">privacy@testardstudios.it</a>
      </p>
    </article>
  );
}
