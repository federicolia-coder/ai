export const metadata = {
  title: "Condizioni d'uso - Tarry AI",
};

export default function TermsPage() {
  return (
    <article className="prose-tarry">
      <h1>Condizioni d&apos;uso</h1>
      <p style={{ color: "var(--color-text-tertiary)" }}>
        Ultimo aggiornamento: 26 settembre 2026
      </p>

      <h2>1. Accettazione</h2>
      <p>
        Utilizzando Tarry AI (&quot;il Servizio&quot;), fornito da TestardStudios
        (&quot;noi&quot;, &quot;il Fornitore&quot;), accetti le presenti
        Condizioni d&apos;uso. Se non le accetti, non utilizzare il Servizio.
      </p>

      <h2>2. Descrizione del Servizio</h2>
      <p>
        Tarry AI è un assistente basato su intelligenza artificiale che fornisce
        risposte testuali, utilizza strumenti (calcolo, ricerca web, lettura
        file), supporta plugin e può collegarsi a servizi esterni (GitHub, Notion,
        webhook) che scegli tu. Il Servizio è
        disponibile in versione gratuita e a pagamento.
      </p>

      <h2>3. Account</h2>
      <p>
        Per utilizzare il Servizio devi creare un account con un indirizzo email
        valido. Sei responsabile della sicurezza delle tue credenziali e di ogni
        attività svolta tramite il tuo account.
      </p>

      <h2>4. Utilizzo accettabile</h2>
      <p>Ti impegni a non utilizzare il Servizio per:</p>
      <ul>
        <li>Attività illegali o che violano diritti di terzi</li>
        <li>Generare contenuti dannosi, diffamatori o discriminatori</li>
        <li>Tentare di aggirare limiti, sicurezza o autenticazione</li>
        <li>Abusare delle API o generare traffico automatizzato eccessivo</li>
        <li>Rivendere o ridistribuire il Servizio senza autorizzazione</li>
        <li>Collegare account o inviare file su cui non hai i diritti</li>
      </ul>

      <h2>5. Contenuti generati dall&apos;AI</h2>
      <p>
        Le risposte generate dall&apos;AI possono contenere errori o
        imprecisioni. Non garantiamo la correttezza, completezza o adeguatezza
        delle risposte. L&apos;utente è responsabile della verifica e
        dell&apos;uso dei contenuti generati.
      </p>

      <h2>6. Proprietà intellettuale</h2>
      <p>
        Il Servizio, il codice, il design e il marchio Tarry sono di proprietà
        di TestardStudios. I contenuti creati dall&apos;utente tramite il
        Servizio restano di proprietà dell&apos;utente.
      </p>

      <h2>7. Piani e pagamenti</h2>
      <p>
        I piani a pagamento vengono fatturati mensilmente tramite Stripe. Puoi
        annullare in qualsiasi momento dalle Impostazioni. Il rimborso non è
        previsto per il periodo già pagato. I limiti di token si rinnovano a
        ogni mese.
      </p>

      <h2>8. Limitazione di responsabilità</h2>
      <p>
        Il Servizio è fornito &quot;così com&apos;è&quot; senza garanzie di
        alcun tipo. TestardStudios non è responsabile per danni diretti,
        indiretti, incidentali o consequenziali derivanti dall&apos;uso del
        Servizio, inclusi danni derivanti da risposte AI errate.
      </p>

      <h2>9. Disponibilità del Servizio</h2>
      <p>
        Ci impegniamo a mantenere il Servizio disponibile, ma non garantiamo un
        uptime del 100%. Potremmo sospendere o interrompere il Servizio per
        manutenzione, aggiornamenti o cause di forza maggiore.
      </p>

      <h2>10. Cessazione</h2>
      <p>
        Possiamo sospendere o terminare il tuo account in caso di violazione
        delle presenti Condizioni. Puoi eliminare il tuo account in qualsiasi
        momento da Impostazioni &rarr; Account.
      </p>

      <h2>11. Modifiche</h2>
      <p>
        Ci riserviamo il diritto di modificare queste Condizioni. Le modifiche
        saranno comunicate tramite il Servizio. L&apos;uso continuato dopo la
        notifica costituisce accettazione.
      </p>

      <h2>12. Legge applicabile</h2>
      <p>
        Le presenti Condizioni sono regolate dalla legge italiana. Per ogni
        controversia è competente il Foro del luogo di residenza del
        consumatore, ai sensi del Codice del Consumo (D.Lgs. 206/2005).
      </p>

      <h2>13. Contatti</h2>
      <p>
        Per domande sulle Condizioni d&apos;uso:{" "}
        <a href="mailto:legal@testardstudios.it">legal@testardstudios.it</a>
      </p>
    </article>
  );
}
