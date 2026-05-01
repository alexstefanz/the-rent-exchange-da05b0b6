
## Problemă

Pe `/produs/...` (cardul de booking) afișezi:
> „Anulează gratuit cu **48h** înainte de începerea închirierii. Rambursare parțială după.”

Backend-ul / restul aplicației **NU se conformează** cu acest mesaj. Sunt 3 incoerențe majore:

### 1. Politica oficială vs mesajul de pe card — parțial ok
`src/pages/legal/CancellationPolicy.tsx` confirmă regula 48h:
- ≥48h înainte → rambursare integrală ✅
- <48h înainte → **rambursare 50%** (deci „parțială” = 50%) ✅
- după start → fără rambursare

Deci textul juridic e aliniat cu mesajul de pe card. **OK** aici.

### 2. Restul UI-ului contrazice mesajul (24h în loc de 48h)
În `src/data/uxCopy.ts`, `src/pages/FAQ.tsx`, `supportFaq`, `AcceptedRentalDialog.tsx`:
- „Poți anula gratuit cu până la **24 de ore** înainte…”
- „cancellation up to **24 hours** before…”
- FAQ: „Yes, you can cancel for free at least **24 hours** before…”
- AcceptedRentalDialog: „Anularea este posibilă doar în primele 24 de ore”
- uxCopy `freeCancellation`: „Poți anula gratuit **până la confirmare**.”
- T&C (EN): „cancellation is possible at least **48 hours** before” (corect)

→ Userul vede 3 reguli diferite în 3 locuri (24h, 48h, „până la confirmare”). **Inconsistent.**

### 3. Backend-ul NU implementează regula 50% deloc
Căutare în întregul cod (`src/`, `supabase/functions/`):
- **Nu există** nicio logică care să calculeze ore până la `start_date`.
- **Nu există** niciun calcul de refund 50% / parțial.
- `create-renter-cancellation-ticket` doar creează un **tichet manual** către admin („eliberare hold Stripe — refund / cancel pe payment intent”), fără să transmită suma.
- `verify-stripe-payment` și flow-ul Stripe folosesc **hold & capture**: dacă plata nu a fost capturată încă (înainte de predare), o anulare = void = refund 100% automat. Nu există capture parțial pentru cazul „<48h dar înainte de predare”.
- Nu există un job care să captureze automat plata cu 48h înainte (deci tehnic, până la predarea fizică, refund-ul e 100% indiferent de mesaj).

→ Backend-ul promite o regulă pe care **nu o aplică**.

## Plan de aliniere

### A. Decide regula oficială (recomand 48h, ca pe card + în T&C + în Politica de Anulare)

### B. Standardizare text în tot UI-ul la „48h gratuit, 50% după”

Fișiere de actualizat (RO + EN):
1. `src/data/uxCopy.ts`
   - `cancellationDesc`: „24 de ore” → „48 de ore”
   - `benefit5Desc`: „24 de ore” → „48 de ore”
   - `faq3A`: „24 de ore” → „48 de ore”, adaugă mențiune 50% pentru anulări tardive
   - `freeCancellation`: „până la confirmare” → „cu 48h înainte de începere”
2. `src/pages/FAQ.tsx` — clarifică regula 48h + 50% explicit (în loc de „depends on time”)
3. `src/data/supportFaq.ts` — aliniază textul „free until owner confirms”
4. `src/components/dashboard/AcceptedRentalDialog.tsx` — schimbă „primele 24 de ore” cu regula reală: gratis dacă plata nu e capturată / >48h, 50% sub 48h

### C. Implementare backend a regulii 50% (sau ajustare mesaj)

Două variante — alege una:

**Varianta 1 (recomandată) — backend aplică regula promisă:**
- În flow-ul de anulare a chiriașului (creare tichet + handler), calculează `hoursUntilStart = (start_date - now) / 3600`.
- Dacă `payment_status = 'authorized'` (hold neprins):
  - `hoursUntilStart >= 48` → void payment intent → refund 100%
  - `0 <= hoursUntilStart < 48` → capture 50% din subtotal + transfer doar acea parte la owner; restul void → refund 50% chiriaș
  - `hoursUntilStart < 0` → fără refund
- Dacă `payment_status = 'captured'` (după predare): fără refund.
- Tichetul către admin trebuie să conțină **suma de refund calculată** (nu doar link Stripe).
- Edge function nouă/extinsă: `cancel-rental-by-renter` care decide automat suma și apelează Stripe (`paymentIntents.cancel` sau `refunds.create` cu `amount`).
- Notificarea trimisă (`send-cancellation-notification`) trebuie să includă suma rambursată.

**Varianta 2 — simplifică promisiunea ca să se potrivească cu realitatea actuală:**
- Schimbă mesajul de pe `ProductDetail.tsx` în: „Anulare gratuită oricând **înainte de predare**. După predare nu se mai acordă rambursare.”
- Aliniază T&C + Politica de Anulare la fel (elimină rândul „<48h → 50%”).
- Mai puțin muncă, dar pierzi protecția proprietarului împotriva anulărilor de ultim moment.

### D. UI booking card — opțional
În cardul de booking arată dinamic, în funcție de `startDate` selectat: „Anulare gratuită până pe DD.MM (cu 48h înainte). După, rambursare 50%.”

## Întrebare pentru tine

Înainte să intrăm în default mode pentru a executa, confirmă:
1. **Regula oficială rămâne 48h gratis + 50% sub 48h?** (cum scrie pe card și în Politica de Anulare)
2. **Mergi pe Varianta 1** (backend aplică automat 50% via Stripe partial capture/refund) sau **Varianta 2** (simplifici mesajul la „gratis până la predare”)?

După ce confirmi, aplic toate modificările într-o singură rundă.
