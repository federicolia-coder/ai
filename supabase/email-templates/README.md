# Template email di Supabase Auth

Da incollare in Supabase → Authentication → Emails → Templates. Per ognuno: imposta
l'oggetto, poi incolla **tutto** il contenuto del file nel campo del messaggio (Source).

| File | Oggetto |
|---|---|
| `confirm-signup.html` | Conferma il tuo account Tarry |
| `reset-password.html` | Reimposta la password di Tarry |
| `magic-link.html` | Il tuo link di accesso a Tarry |
| `change-email.html` | Conferma il nuovo indirizzo email |
| `invite-user.html` | Un invito per te su Tarry |

Ogni email ha il pulsante e, sotto, lo stesso link in chiaro: se il client email blocca
il pulsante, il link resta cliccabile o copiabile. Niente immagini né SVG, che molti
client bloccano.
