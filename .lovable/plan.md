

## Plan: Reparare buton "Discută cu proprietarul" + context rezervare în chat

### Problemă confirmată

Când userul plătește și apasă "Discută cu proprietarul", ajunge într-un chat **complet gol**, fără context despre rezervare. Cauze:

1. **`BookingConfirmation.tsx`** trimite `state: { conversationId }` către `/mesaje`, dar `Messages.tsx` citește `searchParams.get("conv")`. Astfel conversația **nu se preselectează niciodată** din ecranul de succes — userul cade pe lista goală sau pe o conversație random.

2. **Dacă userul nu scrie un mesaj la checkout** (câmpul opțional gol), `verify-stripe-payment` nu creează nici conversație, nici mesaj. La click pe buton, `getOrCreateConversation` creează atunci o conversație **fără niciun mesaj** — owner-ul nu vede nimic relevant.

3. **Lipsește un mesaj automat de sistem** care să arate clar despre ce produs e vorba și ce perioadă a fost rezervată.

### Modificări

#### 1. `src/components/booking/BookingConfirmation.tsx`
- Schimb navigarea din `state: { conversationId }` → `?conv=<id>` ca să se potrivească cu logica din `Messages.tsx`.
- Înainte de a deschide chatul, dacă conversația a fost creată acum (sau există deja dar e goală), trimit automat un **mesaj inițial branded** de la renter către owner cu contextul rezervării:
  > "Bună! Tocmai am rezervat **Playstation 5** pentru perioada **22 apr – 23 apr 2026** (2 zile, total 2 RON). Aștept confirmarea ta. Mulțumesc!"
- Mesajul e trimis o singură dată (verific dacă există deja mesaje în conversație înainte de inserție).

#### 2. `src/features/messaging/messagingApi.ts`
- Adaug funcție helper `ensureRentalContextMessage(conversationId, rentalContext)` care:
  - verifică dacă există deja mesaje în conversație
  - dacă nu, inserează mesajul de context cu detaliile rezervării (titlu produs, perioadă, total)
- Reutilizează `sendMessage` existent (deci trimite și notificare email/push către owner via `send-message-notification`).

#### 3. `supabase/functions/verify-stripe-payment/index.ts`
- În blocul post-plată unde se creează conversația, dacă **nu există `message_to_owner`** în metadata Stripe (userul a sărit câmpul opțional), inserez **automat** mesajul de context al rezervării (același template ca la pasul 1 — sursa unică de adevăr serverside).
- Astfel, owner-ul primește notificarea "mesaj nou" prin sistemul existent de notificări mesaje, indiferent dacă renter-ul ajunge sau nu pe pagina de succes.
- Idempotent: nu duplic mesajul dacă există deja vreun mesaj în conversație.

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/components/booking/BookingConfirmation.tsx` | Navigare cu `?conv=<id>`; helper de inserție mesaj inițial |
| `src/features/messaging/messagingApi.ts` | Funcție `ensureRentalContextMessage` |
| `supabase/functions/verify-stripe-payment/index.ts` | Auto-mesaj de context la creare conversație post-plată dacă lipsește `message_to_owner` |

### Rezultat așteptat

- Click pe "Discută cu proprietarul" → ajungi direct pe conversația corectă cu Playstation 5 deja selectată.
- Owner-ul vede în chat un mesaj clar: produs + perioadă + total, nu un chat gol.
- Owner-ul primește notificarea de mesaj nou (email + push) prin pipeline-ul existent.
- Funcționează și dacă userul nu apasă butonul (mesajul e inserat serverside la confirmarea plății).

### Limitări recunoscute

- Nu modific business logic-ul rezervării — doar adaug context conversațional.
- Pentru rezervările vechi deja confirmate fără mesaj, primul click pe "Discută" va insera retroactiv mesajul de context (tot prin guard idempotent).

