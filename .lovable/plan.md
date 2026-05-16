## Simplificare checkout într-un singur pas

### Ce se schimbă în `src/pages/Checkout.tsx`

1. **Elimin sistemul de pași** (`currentStep`, `PremiumStepper`, butonul „Continuă", `handleContinueToPayment`, array-ul `steps`, și bara `PremiumStepper` din header).
2. **Elimin cardul „Vrei să trimiți un mesaj proprietarului?"** (componenta `OptionalMessageCard` și state-ul `messageToOwner`). Mesajul opțional către proprietar dispare complet din flow — `createRentalRequest` va fi apelat fără `messageToOwner`.
3. **Elimin cardul „Ce urmează?"** (componenta `WhatHappensNext`).
4. **Păstrez într-o singură pagină:**
   - Cardul „Ai întrebări înainte de rezervare? / Deschide chat" (intrare către chat cu proprietarul).
   - Cardul „Trimite cererea de închiriere" cu `PaymentTrustStrip`, mesajul de siguranță cu cele 24h, termenii & confidențialitatea, butonul principal „Trimite cererea" și nota „Cardul nu este debitat acum".
   - Sumarul rezervării sticky pe dreapta (`PremiumBookingSummary`).
   - `StickyCheckoutBar` mobil va avea un singur CTA: „Trimite cererea".
5. **`LoginDialog`**: după login se trimite direct cererea (nu se mai trece la pasul 2). Adaptez `handleLoginSuccess` să apeleze `handleSendRequest`.
6. **Butonul „Înapoi" din header**: revine direct la pagina anterioară (`navigate(-1)`), fără logica de pași.

### Componente neatinse
- `PremiumStepper`, `OptionalMessageCard`, `WhatHappensNext` rămân în proiect (nu le șterg din `src/components/checkout/`) — doar nu mai sunt folosite în Checkout. Pot fi curățate ulterior dacă vrei.

### Rezultat
Checkout devine o pagină unică: utilizatorul vede sumarul, eventual deschide chatul cu proprietarul, citește garanțiile și apasă „Trimite cererea". Niciun pas intermediar, niciun mesaj opțional, niciun card „Ce urmează".