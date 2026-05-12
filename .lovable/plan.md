## Politica nouă

- **Anulare gratuită cu cel puțin 24h înainte de start** → rambursare integrală (subtotal + taxă platformă).
- **Sub 24h, înainte de predare** → prima zi rămâne la proprietar și taxa platformei e nerambursabilă (tier `LIMITED`, neschimbat ca formulă).
- **După predarea produsului (PV semnat)** → anularea rămâne blocată (`LOCKED`).
- Tier-ul intermediar `FIRST_DAY_FORFEIT` (48h–24h, prima zi pierdută) **se elimină**.

## Modificări

1. **Logica partajată** (`src/lib/cancellationPolicy.ts` + `supabase/functions/_shared/cancellationPolicy.ts`)
   - Pragul `FREE` devine `>= 24h` (nu 48h).
   - Se elimină ramura `FIRST_DAY_FORFEIT`. Sub 24h se aplică direct `LIMITED`.
   - `freeCancellationDeadline` returnează start − 24h. Eliminăm `limitedCancellationDeadline` (nu mai are sens un al doilea prag).

2. **Componente rezervare**
   - `src/components/rentals/CancellationStateCard.tsx`: scoatem cazul/stilul `FIRST_DAY_FORFEIT` și textul „Refund limitat începe …”.
   - `src/components/dashboard/RentalsTab.tsx`: scoatem referința la `FIRST_DAY_FORFEIT`.
   - `supabase/functions/cancel-rental-by-renter/index.ts`: actualizăm comentariile și ramurile care tratează `FIRST_DAY_FORFEIT`.

3. **Texte UI (toate „48h” → „24h”, eliminăm referințe la 50%/24h–48h)**
   - `src/data/uxCopy.ts`: `freeCancellation`, `ctaConfirm` (politica), `productDetail.freeCancellation`, `faq3A`, `benefit5Desc`.
   - `src/data/supportFaq.ts`: răspuns „Cum anulez”.
   - `src/components/product/FreeCancellationNotice.tsx`.
   - `src/components/product/StickyProductHeader.tsx` („Anulare gratuită 24h”).
   - `src/components/checkout/PremiumBookingSummary.tsx`.
   - `src/pages/FAQ.tsx`.

4. **Pagini legale**
   - `src/pages/legal/CancellationPolicy.tsx` (RO + EN): tabel cu doar 2 rânduri (≥24h = integrală; <24h = subtotal − 1 zi − comision) + LOCKED. Excepțiile pentru forță majoră rămân.
   - `src/pages/legal/TermsAndConditions.tsx`: „48 hours” → „24 hours”.

5. **Centru de asistență (DB)**
   - Articolul seed din migrarea veche menționează „48h+/24-48h/<24h”. Se rescrie prin migrare nouă (`UPDATE` pe articolul respectiv) pentru consistență.

Nu se modifică modelul de plată (hold/capture Stripe), doar pragul și textele.