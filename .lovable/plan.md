## Checkout Premium Redesign

Transform `/checkout` from a 2-step form into a calm, premium booking & payment experience inspired by Airbnb/Stripe/Apple checkouts. All work is frontend-only; no DB, RPC, or pricing logic changes.

### Goals
- Reduce friction: message to owner becomes **optional**, not a required step.
- Build payment confidence with explicit trust badges, escrow timeline, "what happens next".
- Mobile-first with sticky bottom CTA and thumb-friendly spacing.
- Smooth micro-interactions (fade-up, pulse, shimmer skeletons).

---

### New flow (2 steps instead of forced 2-step form)

```text
┌──────────────────────────────────────────┐
│ Header: back + title + step pill         │
├──────────────────────────────────────────┤
│ ⓵ Confirm booking (always open)          │
│   • Premium booking summary card         │
│   • Optional message card (collapsed)    │
│   • Trust panel                          │
│   • What happens next timeline           │
│   • Cancellation badge                   │
├──────────────────────────────────────────┤
│ ⓶ Secure payment                         │
│   • Stripe trust strip                   │
│   • Escrow explainer                     │
│   • Total recap + Pay CTA                │
└──────────────────────────────────────────┘
Sticky mobile bar: total + "Continuă/Plătește"
```

The right column (price summary) stays sticky on desktop and collapses behind the sticky bar on mobile.

---

### Components to create (`src/components/checkout/`)

1. **`PremiumStepper.tsx`** — replaces `ProgressIndicator` on this page only. 2 segments with animated fill, completed check + active pulse ring (`animate-[ring-pulse_1.6s_ease-out_infinite]` reusing existing keyframe). Mobile: thin progress bar + "Pas X din 2 · {label}".

2. **`PremiumBookingSummary.tsx`** — replaces the right-column card.
   - Larger image (h-32 md:h-40), product title, price/zi.
   - Owner row: avatar + name + verified pill (uses existing trust copy).
   - Period block: two big date cards `Început → Sfârșit` with day count chip.
   - Pickup location row with map pin.
   - Pricing breakdown: subtotal, days, service fee, total — total animated count-up using existing `useCountUp`.
   - Trust mini-row: ✓ Utilizator verificat · ✓ Proces verbal digital · ✓ Plată securizată.

3. **`OptionalMessageCard.tsx`** — fully optional, collapsible (Radix `Collapsible`).
   - Header: "Vrei să trimiți un mesaj proprietarului? (opțional)" + chevron.
   - When opened: 3 quick-template chips (RO/EN bilingual) that prefill the textarea:
     - "Este disponibil pentru ridicare azi?"
     - "Include accesorii?"
     - "Pot veni seara?"
   - Textarea + char counter; "Sari peste" link to skip.

4. **`WhatHappensNext.tsx`** — vertical timeline, 4 steps with icons + subtle connector line:
   1. Proprietarul confirmă rezervarea (≤24h)
   2. Discutați în chat
   3. Semnați procesul verbal digital
   4. Ridici produsul
   Each row: rounded icon, title, 1-line description. Stagger fade-up.

5. **`PaymentTrustStrip.tsx`** — horizontal card group:
   - 🔒 "Plata este securizată prin Stripe"
   - 💰 "Banii sunt eliberați doar după predare" (escrow)
   - 📸 "Proces verbal digital inclus"
   - "Anulare gratuită până la 48h înainte" — premium pill (primary/10 bg).
   Plus a small Stripe/Visa/MC/Apple Pay/Google Pay icon strip (text-only "Visa · Mastercard · Apple Pay · Google Pay" since real logo assets are out of scope).

6. **`StickyCheckoutBar.tsx`** — mobile only (`md:hidden`), `fixed bottom-0 inset-x-0 z-40`, `bg-background/90 backdrop-blur-xl border-t`, safe-area aware. Shows total + primary CTA that triggers the same action as the active step. Pulse glow when CTA enabled.

### File rewrite

7. **`src/pages/Checkout.tsx`** — restructured to use the components above.
   - Step 1 contains the summary, optional message, trust panel, what's next, cancellation badge — and a single primary CTA "Continuă către plată".
   - Step 2 contains the trust strip + escrow explainer + recap + "Plătește {total} RON" (Stripe). Both KYC + phone gates remain unchanged.
   - Order swapped on mobile: summary first, optional message, then payment. Desktop keeps 2-column layout (summary right, content left).
   - Adds entry animation (`animate-fade-in-up`) on each card with stagger.

### Copy additions (`src/data/uxCopy.ts`)
Add a `checkout` premium block (RO/EN) for: "Confirmă rezervarea", "Plată securizată", "Vrei să trimiți un mesaj?", "Sari peste", template strings, "Ce urmează?" titles/descriptions, escrow line, trust strip strings. Reuse existing keys where present (`checkout.totalToPay`, `booking.whatNext`, `trust.*`).

### Animations
Reuse existing `tailwind.config.ts` keyframes (`fade-in-up`, `ring-pulse`, `shimmer-pass`, `fade-in`, `scale-in`). No new keyframes required. CTA uses `transition-all` + `hover:shadow-lg`.

### Out of scope
- No changes to Stripe edge function, KYC gate, phone gate, pricing logic, or `BookingConfirmation.tsx`.
- No real Apple Pay / Google Pay wiring (Stripe Checkout already shows these on its hosted page; we only surface badges to set expectation).
- No saved-cards UI (managed by Stripe Checkout).
- `ProgressIndicator.tsx` left intact for other pages; new stepper is local to checkout.

### Files touched
- create: `src/components/checkout/PremiumStepper.tsx`
- create: `src/components/checkout/PremiumBookingSummary.tsx`
- create: `src/components/checkout/OptionalMessageCard.tsx`
- create: `src/components/checkout/WhatHappensNext.tsx`
- create: `src/components/checkout/PaymentTrustStrip.tsx`
- create: `src/components/checkout/StickyCheckoutBar.tsx`
- edit: `src/pages/Checkout.tsx`
- edit: `src/data/uxCopy.ts` (additive only)
