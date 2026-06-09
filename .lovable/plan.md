## Ce am găsit

Am verificat fluxul de email pentru închirieri. Am identificat două probleme:

### 1. Email duplicat la „Cererea a fost acceptată" (cauza concretă din screenshot)

În `supabase/functions/respond-rental-request/index.ts` (liniile 258–324) există încă un cod *legacy* care trimite direct prin Resend către chiriaș și proprietar atunci când proprietarul acceptă/refuză. Imediat după aceea, aceeași funcție invocă `notify-rental-event` cu `event_key: "request_accepted"`, care trimite din nou aceleași emailuri prin sistemul oficial (`send-transactional-email` + templateul `rental-accepted`).

Rezultat: chiriașul primește **2 emailuri** de tip „Cererea ta a fost acceptată 🎉" (exact ce se vede în captură).

Restul evenimentelor (request_created, payment_succeeded, handover_confirmed, PV-uri, anulări, etc.) au un singur punct de trimitere (`notify-rental-event`) — nu am găsit alte duplicate efective.

### 2. Emailurile vin ca mesaje separate, nu ca un thread

Toate emailurile pentru o închiriere au subiecte diferite și niciun antet de threading (`Message-ID`, `In-Reply-To`, `References`). Din această cauză, Gmail/Outlook le afișează ca conversații separate, în loc să le grupeze sub un singur fir (cerere → acceptare → plată → PV → predare → return → review).

`send-transactional-email` trimite deja prin gateway-ul Resend cu suport pentru `headers`, deci putem adăuga threading fără schimbări de provider.

---

## Ce propun să fac

### A. Elimin duplicarea la acceptare/refuz

În `respond-rental-request/index.ts`:
- Șterg blocul de fetch direct către `api.resend.com` (emailurile pentru chiriaș și proprietar pe accept/reject).
- Las doar invocarea către `notify-rental-event` (care e deja singura sursă „oficială" pentru toate celelalte evenimente).
- Templateele `rental-accepted` / `rental-rejected` din `_shared/transactional-email-templates/` rămân singura sursă vizuală a emailului (consistent cu restul fluxului).

Efect: chiriașul și proprietarul primesc **un singur** email pe acceptare/refuz, cu designul brandat existent.

### B. Threading per închiriere (un singur fir în Gmail)

1. **`send-transactional-email`** — extind contractul:
   - accept un câmp opțional `threadKey` (ex: `rental:RNT-AB12CD`) și opțional `threadSubject` (ex: `RNT-AB12CD · Drone DJI Mini`).
   - dacă `threadKey` e prezent, calculez:
     - `Message-ID: <${threadKey}.${idempotencyKey}@rentli.ro>`
     - `In-Reply-To: <${threadKey}.root@rentli.ro>`
     - `References: <${threadKey}.root@rentli.ro>`
   - le trimit la Resend în `headers` (în plus față de `X-Entity-Ref-ID` deja existent).
   - dacă `threadSubject` e setat, normalizez subiectul: primul email (cel de `request_created`) folosește subiect curat; toate următoarele primesc prefix `Re: ${threadSubject} —` urmat de subiectul original, ca Gmail să le pună în același thread (același subiect + aceiași participanți + headere de threading = un singur fir).

2. **`notify-rental-event`** — la fiecare event de închiriere:
   - construiesc `threadKey = rental:${rental.public_id}` (folosesc public_id-ul `RNT-XXXXXX` deja existent).
   - construiesc `threadSubject = ${rental.public_id} · ${product.title}`.
   - pasez ambele câmpuri către `send-transactional-email`.

3. Pentru fluxurile non-rental (mesaje chat, KYC, reset parolă, withdrawals, OTP, tickets) **nu** se schimbă nimic — fiecare rămâne în propriul context. Threading-ul se aplică doar pe email-uri legate de o închiriere, ca să grupăm tot ciclul ei.

### C. Verificare după implementare

- Test manual: simulez ciclul complet (cerere → accept → plată → PV predare → activă → return → review) pe contul de test și confirm că:
  - sunt N emailuri (nu duplicate),
  - în Gmail toate apar ca răspunsuri în același thread, etichetate `RNT-XXXXXX · <produs>`.
- Verific `email_send_log` pentru a confirma că nu mai există două rânduri identice cu același `template_name` și același `rental_id` în câteva secunde.

---

## Detalii tehnice (fișiere atinse)

```text
supabase/functions/
  respond-rental-request/index.ts        # șterg blocul de Resend direct (liniile ~258–324)
  send-transactional-email/index.ts      # accept threadKey/threadSubject → setez headers
  notify-rental-event/index.ts           # pasez threadKey și threadSubject pe fiecare event
```

Niciun migration de bază de date. Niciun nou secret/provider. Restul funcțiilor (`send-message-notification`, `send-rental-notification`, `send-cancellation-notification`, reminderele) folosesc deja `send-transactional-email` și vor beneficia automat de threading dacă pasăm `threadKey` — pot face asta într-o iterație ulterioară dacă vrei, dar pentru screenshot-ul tău cele de mai sus rezolvă imediat duplicarea și gruparea pe închiriere.

Vrei să implementez direct ambele (A + B), sau doar fixul de duplicare (A) acum și threading-ul (B) într-un pas separat?