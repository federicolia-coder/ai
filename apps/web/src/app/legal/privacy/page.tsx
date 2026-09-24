export const metadata = {
  title: "Informativa sulla privacy - Tarry AI",
};

export default function PrivacyPage() {
  return (
    <article className="prose-tarry">
      <h1>Informativa sulla privacy</h1>
      <p style={{ color: "var(--color-text-tertiary)" }}>
        Ultimo aggiornamento: 24 settembre 2026
      </p>

      <h2>1. Titolare del trattamento</h2>
      <p>
        Il titolare del trattamento dei dati personali e TestardStudios,
        contattabile all&apos;indirizzo{" "}
        <a href="mailto:privacy@testardstudios.it">privacy@testardstudios.it</a>.
      </p>

      <h2>2. Dati raccolti</h2>
      <p>Raccogliamo i seguenti dati:</p>
      <ul>
        <li>
          <strong>Dati di registrazione:</strong> indirizzo email, password
          (hash), data di registrazione.
        </li>
        <li>
          <strong>Dati di utilizzo:</strong> conversazioni, messaggi inviati
          all&apos;AI, token utilizzati, plugin attivati.
        </li>
        <li>
          <strong>Dati tecnici:</strong> indirizzo IP, tipo di browser, sistema
          operativo, timestamp delle richieste.
        </li>
        <li>
          <strong>Dati di pagamento:</strong> gestiti interamente da Stripe. Non
          memorizziamo numeri di carta o dati bancari.
        </li>
      </ul>

      <h2>3. Base giuridica</h2>
      <p>Trattiamo i dati sulla base di:</p>
      <ul>
        <li>Esecuzione del contratto (fornitura del Servizio)</li>
        <li>Consenso (cookie non essenziali, marketing)</li>
        <li>Legittimo interesse (sicurezza, prevenzione abusi)</li>
        <li>Obblighi di legge (fiscali, contabili)</li>
      </ul>

      <h2>4. Finalita del trattamento</h2>
      <ul>
        <li>Fornire e migliorare il Servizio</li>
        <li>Gestire l&apos;account e l&apos;autenticazione</li>
        <li>Elaborare pagamenti e fatturazione</li>
        <li>Monitorare l&apos;uso dei token e applicare i limiti</li>
        <li>Prevenire abusi e garantire la sicurezza</li>
        <li>Rispondere a richieste di supporto</li>
      </ul>

      <h2>5. Conservazione dei dati</h2>
      <p>
        I dati dell&apos;account e le conversazioni vengono conservati finche
        l&apos;account e attivo. Alla cancellazione dell&apos;account, i dati
        vengono eliminati entro 30 giorni, salvo obblighi di legge.
      </p>

      <h2>6. Condivisione dei dati</h2>
      <p>Condividiamo i dati solo con:</p>
      <ul>
        <li>
          <strong>Supabase</strong> (hosting database, autenticazione) &mdash;
          server EU (eu-central-1)
        </li>
        <li>
          <strong>Stripe</strong> (elaborazione pagamenti)
        </li>
        <li>
          <strong>Render</strong> (hosting frontend)
        </li>
      </ul>
      <p>
        Non vendiamo, affittiamo o condividiamo i dati con terze parti per
        finalita di marketing.
      </p>

      <h2>7. Trasferimento dati extra-UE</h2>
      <p>
        I dati del database sono conservati su server Supabase in EU
        (eu-central-1, Francoforte). Stripe e Render possono trasferire dati
        negli USA sulla base delle Clausole Contrattuali Standard (SCC) e del
        Data Privacy Framework.
      </p>

      <h2>8. Diritti dell&apos;interessato (GDPR)</h2>
      <p>Hai il diritto di:</p>
      <ul>
        <li>Accedere ai tuoi dati personali</li>
        <li>Rettificare dati inesatti</li>
        <li>Cancellare i tuoi dati (diritto all&apos;oblio)</li>
        <li>Limitare il trattamento</li>
        <li>Portabilita dei dati</li>
        <li>Opporti al trattamento</li>
        <li>Revocare il consenso in qualsiasi momento</li>
      </ul>
      <p>
        Per esercitare i tuoi diritti, contattaci a{" "}
        <a href="mailto:privacy@testardstudios.it">privacy@testardstudios.it</a>.
        Risponderemo entro 30 giorni.
      </p>

      <h2>9. Sicurezza</h2>
      <p>
        Adottiamo misure tecniche e organizzative per proteggere i dati:
        crittografia in transito (TLS), autenticazione sicura, Row Level
        Security su database, secret cifrati, rate limiting.
      </p>

      <h2>10. Minori</h2>
      <p>
        Il Servizio non e destinato a minori di 16 anni. Non raccogliamo
        consapevolmente dati di minori. Se scopriamo di aver raccolto dati di un
        minore, li cancelleremo.
      </p>

      <h2>11. Modifiche</h2>
      <p>
        Potremmo aggiornare questa Informativa. Le modifiche saranno pubblicate
        su questa pagina con la data di aggiornamento.
      </p>

      <h2>12. Autorita di controllo</h2>
      <p>
        Hai il diritto di presentare reclamo al Garante per la protezione dei
        dati personali (
        <a
          href="https://www.garanteprivacy.it"
          target="_blank"
          rel="noopener noreferrer"
        >
          www.garanteprivacy.it
        </a>
        ).
      </p>

      <h2>13. Contatti</h2>
      <p>
        Per domande sulla privacy:{" "}
        <a href="mailto:privacy@testardstudios.it">privacy@testardstudios.it</a>
      </p>
    </article>
  );
}
