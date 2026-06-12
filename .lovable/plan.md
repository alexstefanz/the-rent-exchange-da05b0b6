## Problem

În fluxul actual, chiriașul trimite cererea FĂRĂ să atașeze cardul / fără pre-autorizare Stripe. Plata securizată Stripe se face DOAR după ce proprietarul acceptă cererea (UI-ul din Checkout spune exact asta: „După ce acceptă, vei primi notificare cu link de plată securizată Stripe").

Totuși, email-ul `rental-request-owner` îi spune proprietarului: „Plata a fost autorizată (blocată) pe cardul chiriașului și va fi încasată automat după ce acceptați cererea." — fals și înșelător. La fel, `rental-request-renter` îi spune chiriașului „Plata ta a fost autorizată în siguranță", deși nu s-a întâmplat încă nimic financiar.

## Schimbări (doar text în template-uri de email)

### 1. `supabase/functions/_shared/transactional-email-templates/rental-request-owner.tsx`
- Înlocuiește paragraful Lead cu un mesaj corect: „X dorește să închirieze produsul Y. **Nu se face nicio încasare în acest moment.** Dacă acceptați, chiriașul va primi un link de plată securizată Stripe și suma va fi blocată în custodie până la predare."
- Adaptează paragraful de instrucțiuni: după acceptare se trimite link-ul de plată; banii se eliberează după predare/încheierea închirierii, nu „se încasează automat".

### 2. `supabase/functions/_shared/transactional-email-templates/rental-request-renter.tsx`
- Înlocuiește Lead cu: „Cererea ta a fost trimisă proprietarului. **Cardul tău nu a fost debitat.** Imediat ce proprietarul acceptă, primești un link de plată securizată Stripe; suma va fi blocată în custodie până la predare."
- Elimină rândul „Suma este reținută în escrow și va fi eliberată proprietarului doar după ridicare." (devine prematur) sau mută-l ca explicație post-plată.

### 3. `supabase/functions/_shared/transactional-email-templates/rental-accepted-renter.tsx`
- Adaugă un Para clar: „Pentru a finaliza rezervarea, **plătește acum** prin Stripe — suma va fi blocată în siguranță până la predare." și schimbă CTA-ul în „Plătește acum" (link tot către `/rezervari/...`, de unde există deja butonul de plată).

## Ce NU se schimbă
- Logica back-end (flow-ul rămâne: cerere → acceptare → link Stripe → autorizare hold).
- `create-checkout-session`, `notify-rental-event`, schema rentals.
- Layout / design email — doar copy.

## Deploy
- `supabase deploy_edge_functions` pentru `send-transactional-email` (template-urile sunt bundle-uite în această funcție).
