export const metadata = {
  title: "Informativa sulla privacy - Tarry AI",
};

export default function PrivacyPage() {
  return (
    <article className="prose-tarry">
      <h1>Informativa sulla privacy</h1>
      <p style={{ color: "var(--color-text-tertiary)" }}>
        Ultimo aggiornamento: 26 settembre 2026
      </p>

      <h2>1. Titolare del trattamento</h2>
      <p>
        Il titolare del trattamento dei dati personali è TestardStudios,
        contattabile all&apos;indirizzo{" "}
        <a href="mailto:privacy@testardstudios.it">privacy@testardstudios.it</a>.
      </p>

      <h2>2. Dati raccolti</h2>
      <p>Raccogliamo i seguenti dati:</p>
      <ul>
        <li>
          <strong>Dati di registrazione:</strong> indirizzo email, password
          (conservata solo come hash), data di registrazione.
        </li>
        <li>
          <strong>Conversazioni:</strong> i messaggi che scrivi, le risposte di
          Tarry e i passaggi mostrati (per esempio i calcoli e le ricerche
          eseguite).
        </li>
        <li>
          <strong>File allegati:</strong> i documenti che carichi in una
          conversazione, conservati in uno spazio privato accessibile solo al tuo
          account.
        </li>
        <li>
          <strong>Connettori:</strong> se colleghi GitHub, Notion o un webhook, i
          token o gli indirizzi che inserisci. Sono conservati lato server e non
          vengono mai rimandati al browser.
        </li>
        <li>
          <strong>Dati di utilizzo:</strong> token consumati, plugin attivati,
          data e ora delle richieste.
        </li>
        <li>
          <strong>Dati tecnici:</strong> indirizzo IP, tipo di browser, sistema
          operativo, registri tecnici di errore.
        </li>
        <li>
          <strong>Dati di pagamento:</strong> gestiti interamente da Stripe. Non
          memorizziamo numeri di carta o dati bancari.
        </li>
      </ul>

      <h2>3. Come funziona l&apos;AI</h2>
      <p>
        Le risposte sono generate da un modello linguistico che gira su un
        server gestito da TestardStudios. I tuoi messaggi non vengono inviati a
        fornitori di AI esterni e non vengono usati per addestrare modelli.
      </p>
      <p>
        Quando Tarry usa uno strumento, i dati necessari lasciano il nostro
        server solo verso il servizio coinvolto:
      </p>
      <ul>
        <li>
          <strong>Ricerca web:</strong> il testo della ricerca (non la
          conversazione) viene inviato al motore di ricerca Brave Search.
        </li>
        <li>
          <strong>Connettori:</strong> le richieste verso GitHub, Notion o il
          tuo webhook partono solo se hai collegato quel servizio, con le
          credenziali che hai fornito tu.
        </li>
        <li>
          <strong>Calcoli e lettura dei file:</strong> avvengono sul nostro
          server, senza servizi esterni.
        </li>
      </ul>
      <p>
        Le risposte dell&apos;AI possono contenere errori. Verifica le
        informazioni importanti prima di usarle.
      </p>

      <h2>4. Base giuridica</h2>
      <p>Trattiamo i dati sulla base di:</p>
      <ul>
        <li>Esecuzione del contratto (fornitura del Servizio)</li>
        <li>Consenso (cookie non essenziali, marketing)</li>
        <li>Legittimo interesse (sicurezza, prevenzione abusi)</li>
        <li>Obblighi di legge (fiscali, contabili)</li>
      </ul>

      <h2>5. Finalità del trattamento</h2>
      <ul>
        <li>Fornire il Servizio e generare le risposte</li>
        <li>Gestire l&apos;account e l&apos;autenticazione</li>
        <li>Elaborare pagamenti e fatturazione</li>
        <li>Monitorare l&apos;uso dei token e applicare i limiti del piano</li>
        <li>Prevenire abusi e garantire la sicurezza</li>
        <li>Rispondere a richieste di supporto</li>
      </ul>

      <h2>6. Conservazione dei dati</h2>
      <p>
        Account, conversazioni, file e connettori restano finché
        l&apos;account è attivo. Puoi eliminare una singola conversazione in
        qualsiasi momento, e l&apos;intero account da Impostazioni &rarr;
        Account &rarr; Elimina account: conversazioni, file, connettori e dati
        di utilizzo vengono cancellati subito e l&apos;eventuale abbonamento
        viene annullato. Le copie di backup tecnico vengono sovrascritte entro 30
        giorni. I dati di fatturazione restano conservati da Stripe per il
        tempo richiesto dalla legge.
      </p>

      <h2>7. Fornitori</h2>
      <p>Condividiamo i dati solo con:</p>
      <ul>
        <li>
          <strong>Supabase</strong> (database, autenticazione, archiviazione
          file): server UE (Francoforte)
        </li>
        <li>
          <strong>Render</strong> (hosting del sito): server UE (Francoforte)
        </li>
        <li>
          <strong>Stripe</strong> (elaborazione pagamenti)
        </li>
        <li>
          <strong>Brave Search</strong> (solo il testo delle ricerche web)
        </li>
        <li>
          <strong>GitHub, Notion o il tuo webhook</strong>, solo se li colleghi
          tu
        </li>
      </ul>
      <p>
        Non vendiamo, affittiamo o condividiamo i dati con terze parti per
        finalità di marketing.
      </p>

      <h2>8. Trasferimento dati extra-UE</h2>
      <p>
        Il database e i file sono conservati su server Supabase in UE
        (Francoforte). Stripe, Brave, GitHub e Notion possono trattare dati
        negli USA sulla base delle Clausole Contrattuali Standard (SCC) e del
        Data Privacy Framework.
      </p>

      <h2>9. Diritti dell&apos;interessato (GDPR)</h2>
      <p>Hai il diritto di:</p>
      <ul>
        <li>Accedere ai tuoi dati personali</li>
        <li>Rettificare dati inesatti</li>
        <li>Cancellare i tuoi dati (puoi farlo da solo dalle impostazioni)</li>
        <li>Limitare il trattamento</li>
        <li>Portabilità dei dati</li>
        <li>Opporti al trattamento</li>
        <li>Revocare il consenso in qualsiasi momento</li>
      </ul>
      <p>
        Per esercitare i tuoi diritti, contattaci a{" "}
        <a href="mailto:privacy@testardstudios.it">privacy@testardstudios.it</a>.
        Risponderemo entro 30 giorni.
      </p>

      <h2>10. Sicurezza</h2>
      <p>
        Adottiamo misure tecniche e organizzative per proteggere i dati:
        crittografia in transito (TLS), Row Level Security sul database, file in
        uno spazio privato con link temporanei, credenziali dei connettori non
        leggibili dal browser, limiti di frequenza sulle richieste.
      </p>

      <h2>11. Minori</h2>
      <p>
        Il Servizio non è destinato a minori di 16 anni. Non raccogliamo
        consapevolmente dati di minori. Se scopriamo di aver raccolto dati di un
        minore, li cancelleremo.
      </p>

      <h2>12. Modifiche</h2>
      <p>
        Potremmo aggiornare questa Informativa. Le modifiche saranno pubblicate
        su questa pagina con la data di aggiornamento.
      </p>

      <h2>13. Autorità di controllo</h2>
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

      <h2>14. Contatti</h2>
      <p>
        Per domande sulla privacy:{" "}
        <a href="mailto:privacy@testardstudios.it">privacy@testardstudios.it</a>
      </p>
    </article>
  );
}
