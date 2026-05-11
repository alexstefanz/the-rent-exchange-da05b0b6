## Context

Cele 5 întrebări din widget-ul de chat suport (`src/data/supportFaq.ts`, afișate în `SupportChatWidget`) sunt parțial învechite față de schimbările aduse recent platformei:

- A apărut **fluxul de programare predare** (PickupArrangementCard) și **procesul verbal digital (PV)** la predare/returnare cu sistem de dispute.
- Sistem de **notificări multi-canal** (in-app, email, SMS) cu link-uri scurte sigure.
- **Comision 5%** + primele 3 închirieri gratuite (corect deja).
- **Plățile de tip hold-and-capture** prin Stripe; payout zilnic către proprietari.
- **Politica de anulare** include și o regulă lipsă din FAQ: *„rambursare integrală în prima oră după rezervare"*.
- Comunicarea se face **doar prin chat-ul intern** (regex blochează telefon/email/URL).

## Discrepanțe identificate

| FAQ actual | Problemă |
|---|---|
| `cancel` | Nu menționează regula „prima oră = rambursare 100%" și nici excepția pentru produs neconform. |
| `refund` | Corect pentru chiriaș, dar nu explică nimic despre **payout-ul proprietarului** (zilnic, după finalizare). |
| `deposit` | OK în esență, dar formularea „pre-autorizată" e inexactă pentru modelul actual — Stripe face hold pe **întreaga sumă** (nu separat pentru garanție). De clarificat. |
| `handover` | Menționează cele 10 poze, dar nu pomenește **procesul verbal digital (PV)**, programarea predării și ce se întâmplă dacă o parte nu confirmă (deschidere dispută). |
| `fee` | Corect, rămâne neschimbat. |

În plus lipsesc câteva întrebări frecvente apărute odată cu noile fluxuri:
- Cum primesc/răspund la o **cerere de închiriere** (acceptare în 24h, altfel expiră).
- Ce fac dacă cealaltă parte **nu completează PV-ul** (dispută → admin).
- De ce **nu pot trimite număr de telefon / email** în chat (politica de comunicare internă + KYC).
- Cum funcționează **notificările** (in-app + email + SMS pentru pași critici, setări la `/setari/notificari`).

## Modificări propuse

Editare unică în `src/data/supportFaq.ts`:

1. **Rescriere `cancel`** — adăugare regulă „prima oră = 100%" și trimitere la politica completă.
2. **Rescriere `refund`** — separare în două paragrafe: rambursare chiriaș (5-10 zile) + payout proprietar (zilnic în portofel după finalizare, retragere la cerere).
3. **Rescriere `deposit`** — clarificare hold Stripe (autorizare totală, capturare la confirmare, eliberare automată dacă nu sunt daune).
4. **Rescriere `handover`** — menționare PV digital + 10 poze + flux dispută dacă cealaltă parte nu confirmă.
5. **Păstrare `fee`** — fără schimbări.
6. **Adăugare 3 întrebări noi**:
   - `request` — „Cum răspund la o cerere de închiriere?" (24h pentru accept/refuz, notificare in-app/email/SMS).
   - `pv_dispute` — „Ce fac dacă cealaltă parte nu completează procesul verbal?" (deschidere dispută din dashboard, intervenție admin).
   - `contact_rules` — „De ce nu pot trimite telefon sau email în chat?" (siguranță + comunicare 100% prin platformă; contactul direct se deblochează automat după booking activ).

Toate textele bilingve (RO/EN), păstrând stilul markdown existent (`**bold**`).

## În afara scopului

- Nicio modificare în `SupportChatWidget` (componenta consumă lista, deci se actualizează automat).
- Nicio modificare la pagina `/intrebari-frecvente` (FAQ extins) — acela poate fi un task separat dacă vrei.
- Fără schimbări în logica AI / ticketing.
