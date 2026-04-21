

## Plan: Reparare flux post-plată — vizibilitate rezervări + email-uri

### Diagnostic (verificat în DB)

Rezervarea ta de 2 RON pentru Playstation 5 **există corect** (`326efd56-9af7-4af2-a57c-b0cdea56e5dd`):
- `payment_status = authorized` ✅ (plata Stripe a reușit)
- `status = pending` (corect — așteaptă acceptul ownerului)
- Notificarea pentru renter ✅ creată în DB
- Notificarea pentru owner ✅ creată în DB
- Email-uri ❌ **nu au plecat**

### Cauzele reale

1. **Renterul vede gol pe `/rezervari`** — pagina afișează doar rezervările cu status `confirmed/active/completed`. Cererile `pending` (neacceptate încă) sunt la `/cereri`. Userul s-a uitat în pagina greșită — rezervarea LUI este vizibilă pe `/cereri`. Acum este UX confuz: când plătești, te aștepți să vezi imediat rezervarea undeva clar, nu să ghicești între `/cereri` și `/rezervari`.

2. **Owner-ul nu vede cererea în notificări vizibile** — notificarea există în DB cu link `/anunturi?rental_id=...`, dar din imagine e clar că nici el nu o observă (probabil pentru că nu deschide pagina `/anunturi` și nu primește email).

3. **Email-urile nu pleacă** — `send-rental-notification` folosește Resend API direct cu `RESEND_API_KEY` (cod vechi), în loc de sistemul branded Lovable Cloud (`send-transactional-email` cu templates React Email din pgmq queue). Toate email-urile KYC merg corect prin sistemul nou (vezi log), dar email-urile de rental sunt blocate pe codul vechi care probabil nu mai are cheia configurată sau s-a depreciat.

### Ce voi modifica

#### A. Vizibilitate rezervări pentru renter (UX)
- **`src/components/dashboard/RentalsTab.tsx`** — extind query-ul să includă și status `pending` cu `payment_status = authorized/paid`. Astfel, imediat după plată, rezervarea apare pe `/rezervari` într-o secțiune dedicată "În așteptarea acceptului proprietarului" cu copy clar (ex: "Plata ta este blocată. Aștepți confirmarea proprietarului").
- Las și pagina `/cereri` să le afișeze (ele sunt cereri în așteptare). Astfel userul găsește rezervarea în ambele locuri logice.
- Adaug un mesaj clar de tip alert deasupra: "✅ Plata a fost autorizată — așteptăm răspunsul proprietarului în 24h".

#### B. Vizibilitate cereri primite pentru owner
- Verific `LendingsTab` — afișează corect `pendingRentals` cu butoanele Accept/Reject. Dacă nu sunt evidențiate, le pun în partea de sus a paginii cu un highlight portocaliu și badge "Nouă cerere".
- Schimb link-ul notificării ownerului din `/anunturi?rental_id=...` → ceva mai precis sau adaug un scroll/highlight automat la cererea respectivă când se accesează.

#### C. Email-uri post-plată — migrare la sistemul branded
Migrez `send-rental-notification` să folosească sistemul oficial de email-uri Lovable Cloud:
- **NU** mai folosesc Resend API direct + HTML inline.
- Folosesc 2 template-uri React Email **deja existente** în proiect:
  - `rental-request-owner.tsx` (există deja în `_shared/transactional-email-templates/`)
  - `rental-request-renter.tsx` (verific dacă există; dacă nu, îl creez în același stil ca `rental-accepted.tsx`)
- Apelez `supabase.functions.invoke("send-transactional-email", { body: { templateName, recipientEmail, idempotencyKey, templateData } })` pentru fiecare destinatar.
- `idempotencyKey` derivat din `rental.id + template_name` → safe la retry.
- Păstrez guard-ul de duplicate notificări push existent.

#### D. Notificare push în UI (clopoțel pentru useri normali)
- Verific că `NotificationBell` din `Navbar` (pentru useri obișnuiți, NU adminul) funcționează în realtime. Dacă nu, mă asigur că `notifications` are realtime activat (`ALTER PUBLICATION supabase_realtime ADD TABLE notifications`) și componenta ascultă.

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/components/dashboard/RentalsTab.tsx` | Includ și `pending+authorized/paid` cu secțiune "În așteptare acceptare" |
| `src/components/dashboard/LendingsTab.tsx` | Highlight vizual mai clar pentru cererile noi `pending` (dacă lipsește) |
| `supabase/functions/send-rental-notification/index.ts` | Înlocuiesc Resend direct cu `send-transactional-email` (template-uri branded) |
| `supabase/functions/_shared/transactional-email-templates/rental-request-renter.tsx` | Creez dacă lipsește, în stilul template-urilor existente |
| `supabase/functions/_shared/transactional-email-templates/registry.ts` | Înregistrez template-urile noi |
| `supabase/migrations/<ts>.sql` | Doar dacă `notifications` nu e în `supabase_realtime` — îl adaug |

### Rezultat așteptat

- Imediat după plată, **renterul vede rezervarea pe `/rezervari`** cu status clar "În așteptarea proprietarului" + alert verde "Plata autorizată".
- **Ownerul primește email branded** (Rentli, portocaliu) cu CTA "Vezi cererea" → `/anunturi`.
- **Renterul primește email branded** de confirmare cu CTA "Vezi statusul" → `/rezervari`.
- Notificarea push (clopoțel) apare în realtime la ambii useri.
- Niciun email duplicat la refresh `/checkout/success`.

### Limitări recunoscute

- Email-urile vechi care n-au plecat pentru rezervarea de 2 RON nu pot fi recuperate retroactiv (codul vechi cu Resend a eșuat silent). După deploy, orice rezervare nouă va trimite email-uri corect.
- Nu modific business logic-ul: status-ul `pending` rămâne corect până când owner-ul acceptă.

