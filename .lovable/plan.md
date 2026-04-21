

## Plan: Banii proprietarului ajung în wallet după finalizare

### Diagnostic confirmat (verificat în DB + logs)

Rezervarea Playstation 5 (`671b77f1...`) a fost marcată `status = completed` la **21 apr 15:29**, dar:
- `payment_status` = `authorized` (NU `captured`)
- `captured_at` = NULL, `paid_at` = NULL
- În `transactions` există DOAR tranzacția `rental_payment` de la checkout. **NU există `owner_payout`**.

**Cauză reală:** Funcția `capture-rental-payment` a fost apelată din browser de către owner la confirmarea returnării, dar a returnat **401 Unauthorized** — codul ei autorizează DOAR adminii sau apelurile cu anon key (cron). Owner-ul (user normal) e respins. Logurile confirmă: niciun output în afară de boot la 15:29:15.

În plus, `confirmReturn` în `ownerRentalsApi.ts` apelează capture într-un `try/catch` cu doar `console.error` → eșecul e silent, frontend-ul afișează "Finalizat" deși banii nu au fost mutați nici la Stripe, nici în balanța owner-ului.

### Modificări

#### 1. `supabase/functions/capture-rental-payment/index.ts` — autorizează și owner-ul rentalului
Adaug un al treilea caz de autorizare: dacă tokenul aparține unui user autentificat și `rental_id` din body corespunde unui rental unde `owner_id = user.id`, permit captura. Astfel:
- ✅ cron (anon key) — rămâne
- ✅ admin — rămâne
- ✅ **owner al rentalului — nou**, doar pentru `rental_id`-ul propriu

Beneficiu: păstrează security (un user nu poate captura rental-uri străine), dar flow-ul natural "owner confirmă returul → capture imediat" funcționează.

#### 2. `src/features/rentals/ownerRentalsApi.ts` — fail loud, nu silent
- Dacă `capture-rental-payment` returnează eroare sau funcția invoke eșuează, arunc eroarea în sus astfel încât componenta apelantă să poată afișa toast.
- Alternativ păstrez `status = completed` (returul e fizic confirmat) dar marchez că trebuie retry. Aleg: invoc capture **înainte** de update-ul `status=completed` → dacă captura eșuează, nu marcăm completed și owner-ul vede toast "Plata nu a putut fi capturată, contactați suportul".
- Reordonare: 1) captură Stripe → 2) update `status=completed` + `return_confirmed_at` + `completed_at`. Dacă pasul 1 fail, pasul 2 nu rulează.

#### 3. Backfill rezervarea curentă (`671b77f1...`)
Rulez manual `capture-rental-payment` pentru acest rental (după deploy cu fix-ul de autorizare) ca owner-ul să primească cei 2 RON în balanță acum, fără să trebuiască să refacă flow-ul. Captura Stripe + insert `owner_payout` transaction → balanța din `BalanceCard` se va actualiza la 2 RON.

#### 4. (Opțional, dar recomandat) Notificare + email "Câștig nou"
Există deja template-ul `payout-received.tsx` în `_shared/transactional-email-templates/`. După capture reușit, în `capture-rental-payment` trimit:
- notificare push către `owner_id` ("Ai un câștig nou de X RON din închirierea Playstation 5")
- email branded `payout-received` cu CTA spre `/castiguri`

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `supabase/functions/capture-rental-payment/index.ts` | Adaug autorizare owner-rental + trimit notificare/email payout după capture |
| `src/features/rentals/ownerRentalsApi.ts` | Reordonez: capture înainte de update completed; eroare loud |
| `src/components/dashboard/LendingsTab.tsx` (dacă e cazul) | Toast clar pe eroare la confirmReturn |
| Backfill manual | Capture pentru rental `671b77f1...` ca să apară 2 RON acum |

### Rezultat așteptat

- La click "Confirmă returnarea" de către owner: Stripe capturează plata, se inserează tranzacția `owner_payout` completed, balanța din header și din BalanceCard se actualizează cu suma respectivă.
- Owner primește email "Câștig nou adăugat în balanță" + notificare push.
- Dacă ceva eșuează (ex. cardul renterului expirat), owner-ul vede eroare clară și statusul rămâne pentru retry, nu rămânem cu "Finalizat" fără bani.
- Pentru rental-ul curent (Playstation 5, 2 RON) — backfill manual imediat după deploy.

### Limitări recunoscute

- Nu schimb modelul comisionului sau timing-ul plății (rămâne capture-on-return, cum e acum).
- Pentru rental-urile vechi care au ajuns "completed" fără capture, e nevoie de backfill manual (vom face doar pentru cel raportat acum). Dacă vor mai exista cazuri, pot adăuga ulterior un endpoint admin "Reprocessa rental".

