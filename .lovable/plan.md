

## Plan: Sistem Escrow cu Stripe (Blocare temporară + Transfer la finalizare)

### Fluxul dorit

```text
Renter rezervă    →  Stripe autorizează suma (hold)  →  Owner vede "Pending"
                                                          ↓
                                           Perioada de închiriere se termină
                                                          ↓
                                           Suma se capturează automat
                                                          ↓
                                           Banii apar disponibili pentru owner
```

### Cum funcționează tehnic

Stripe Checkout suportă `payment_intent_data.capture_method: "manual"` — suma se **autorizează** pe cardul renterului dar **nu se debitează**. Banii sunt blocați temporar (hold). După finalizarea perioadei de închiriere, platforma capturează suma.

**Important**: Stripe permite hold maxim **7 zile** (sau 31 zile cu aprobare specială). Pentru închirieri mai lungi, suma va trebui capturată la început și ținută în contul Stripe al platformei până la finalizare.

### Pași de implementare

**1. Modificare `create-checkout-session` Edge Function**
- Adăugare `payment_intent_data: { capture_method: "manual" }` la crearea sesiunii Stripe Checkout
- Salvare `payment_intent_id` pe rental pentru capturare ulterioară
- Update `payment_status` la `"authorized"` (nu `"paid"`) după checkout success

**2. Modificare `verify-stripe-payment` Edge Function**
- Verificare că sesiunea are `payment_status === "unpaid"` (pentru manual capture, Stripe raportează sesiunea ca unpaid dar payment intent ca `requires_capture`)
- Retrieve payment intent și verificare status `requires_capture`
- Update rental cu `payment_status: "authorized"`, `payment_intent_id`, `authorized_at`

**3. Creare Edge Function nouă: `capture-rental-payment`**
- Primește `rental_id`, verifică că perioada de închiriere s-a terminat (`end_date <= today`)
- Apelează `stripe.paymentIntents.capture(payment_intent_id)`
- Update rental: `payment_status: "captured"`, `captured_at`
- Creează tranzacție `owner_payout` în tabela `transactions`

**4. Creare Edge Function nouă: `process-rental-captures` (cron)**
- Rulează zilnic (sau la fiecare oră)
- Selectează toate rentalurile cu `payment_status = "authorized"` și `end_date <= today`
- Pentru fiecare, capturează plata via Stripe API
- Actualizează statusuri și creează tranzacții

**5. Migrare DB**
- Adăugare coloane pe `rentals`: `payment_intent_id TEXT`, `authorized_at TIMESTAMPTZ`, `captured_at TIMESTAMPTZ`
- Adăugare valori noi pentru `payment_status`: `authorized`, `captured`
- Setup cron job pentru `process-rental-captures` (zilnic)

**6. Update EarningsTab (frontend)**
- Înlocuire mock data cu date reale din `rentals` + `transactions`
- Afișare câștiguri pending (autorizate, necapturate) vs. disponibile (capturate)
- Istoric tranzacții real din DB

**7. Update Checkout UI**
- Mesaj actualizat: "Suma va fi blocată temporar și debitată doar după finalizarea perioadei de închiriere"
- Buton: "Rezervă — {totalPrice} RON" în loc de "Plătește"

### Limitare Stripe importantă
- Hold-ul pe card expiră după **7 zile** (standard) sau **31 zile** (cu aprobare)
- Pentru închirieri > 7 zile: strategia va fi **capturare imediată** + hold intern în contul Stripe, cu transfer către owner doar la finalizare
- Aceasta înseamnă: banii sunt debitați de pe cardul renterului imediat, dar proprietarul nu îi primește până la finalizarea perioadei

### Fișiere afectate
- `supabase/functions/create-checkout-session/index.ts` — adăugare manual capture
- `supabase/functions/verify-stripe-payment/index.ts` — handle authorized status
- `supabase/functions/capture-rental-payment/index.ts` — **NOU**
- `supabase/functions/process-rental-captures/index.ts` — **NOU** (cron)
- `src/features/rentals/rentalsApi.ts` — update status handling
- `src/components/profile/EarningsTab.tsx` — date reale + pending vs disponibil
- `src/pages/Checkout.tsx` — UI text updates
- `src/pages/CheckoutSuccess.tsx` — mesaj actualizat
- Migrare SQL pentru coloane noi + cron job

