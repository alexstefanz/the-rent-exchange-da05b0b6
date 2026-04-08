

## Plan: Integrare Stripe pentru plăți la checkout

### Situația actuală
- Fluxul de checkout există complet (4 pași: opțiune plată → mesaj → metodă plată → confirmare)
- `PaymentMethodDialog` simulează introducerea datelor de card (are chiar un buton "Card de test auto-fill")
- Plata nu se procesează real — se salvează doar rental-ul în DB cu `payment_status: "pending"`
- Cheia secretă Stripe (`sk_live_...`) este deja stocată ca secret
- Cheia publică: `pk_live_51THeaxRxH8Kscr9R0D1cgSS9CE2RWWV6bM2OwC5R75sb8y44CTmrrGT29IqP77ffcZy3tHLh5RyLYHpHQ8KN5GTm00JtXnHGqy`

### Ce se va implementa

**1. Edge Function `create-checkout-session`**
- Primește: `rental_id`, produs, sumă, zile
- Creează un Stripe Checkout Session cu `mode: "payment"`
- Folosește `price_data` inline (prețul e dinamic, depinde de numărul de zile) cu descriere clară (ex: "Închiriere Drujbă Stihl - 3 zile")
- Moneda: RON
- Returnează URL-ul Stripe Checkout
- Success URL: `/checkout/success?session_id={CHECKOUT_SESSION_ID}`
- Cancel URL: `/checkout/cancelled`

**2. Edge Function `verify-stripe-payment`**
- Primește `session_id`
- Verifică cu Stripe API că plata e completă
- Actualizează rental-ul: `payment_status: "paid"`, `paid_at: now()`
- Returnează confirmarea

**3. Modificare flux Checkout (frontend)**
- La Step 3, în loc de `PaymentMethodDialog` cu formular fake de card, se va apela `create-checkout-session`
- Utilizatorul este redirectat la Stripe Checkout (pagina securizată Stripe)
- După plată, revine pe `/checkout/success` unde se verifică și confirmă plata

**4. Pagini noi**
- `CheckoutSuccess.tsx` — verifică plata și arată confirmarea (refolosește `BookingConfirmation`)
- `CheckoutCancelled.tsx` — mesaj simplu + buton de revenire

**5. Fluxul complet modificat**
```text
Step 1: Alege când plătești (pay-now / pay-later)
Step 2: Mesaj opțional pentru proprietar  
Step 3: Click "Plătește cu Stripe" → se creează rental + checkout session
        → redirect la Stripe Checkout (card, Google Pay, Apple Pay - toate gestionate de Stripe)
        → după plată → /checkout/success → verificare → confirmare
```

### Ce NU se schimbă
- Structura tabelelor DB (rentals rămâne la fel)
- Notificările (se trimit la fel)
- Mesajul către proprietar (se creează la fel)

### Detalii tehnice
- Se elimină `PaymentMethodDialog` (înlocuit de Stripe Checkout)
- Stripe Checkout suportă nativ: Card, Google Pay, Apple Pay, SEPA — fără implementare separată
- `price_data` inline e necesar deoarece fiecare rental are preț diferit (daily_price × rental_days)
- Se adaugă ruta `/checkout/success` și `/checkout/cancelled` în `App.tsx`

### Fișiere noi
1. `supabase/functions/create-checkout-session/index.ts`
2. `supabase/functions/verify-stripe-payment/index.ts`
3. `src/pages/CheckoutSuccess.tsx`
4. `src/pages/CheckoutCancelled.tsx`

### Fișiere modificate
1. `src/pages/Checkout.tsx` — Step 3 devine redirect la Stripe
2. `src/features/rentals/rentalsApi.ts` — funcție nouă pentru creare rental + checkout session
3. `src/App.tsx` — rute noi
4. `supabase/config.toml` — config funcții noi

