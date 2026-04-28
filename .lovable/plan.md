## Problema

Acum, după plată, un mesaj automat („Bună! Tocmai am rezervat...") este injectat în chat. E rigid, robotic și nu are sens — userii vor să vorbească firesc, ca pe Vinted/OLX, **înainte** de a comanda, ca să întrebe dacă produsul e disponibil, în ce stare e, unde se ridică etc.

În plus, deși funcția `handleStartChat` există deja în `ProductDetail.tsx`, **nu e folosită nicăieri în UI** — nu există niciun buton vizibil care să deschidă chat-ul de pe pagina produsului.

## Ce schimb

### 1. Adaug buton „Întreabă proprietarul" pe pagina produsului

În `src/components/product/OwnerSection.tsx`:
- Adaug un buton primar outline „💬 Întreabă proprietarul" sub statistici (response time / response rate), vizibil pe desktop și mobile.
- Butonul nu apare dacă `isOwnProduct === true` (proprietarul nu se contactează pe sine).
- Primește prop nou `onStartChat: () => void` din `ProductDetail`.

În `src/pages/ProductDetail.tsx`:
- Pasez `handleStartChat` și `isOwnProduct` la `OwnerSectionWithStats` → `OwnerSection`.
- Logica existentă (`getOrCreateConversation` + `ChatDialog`) rămâne identică — doar o conectez la UI.

### 2. Elimin mesajul automat după plată

În `src/components/booking/BookingConfirmation.tsx`:
- Scot apelul `ensureRentalContextMessage(...)` din `handleOpenChat`. Userul deschide chat-ul gol (sau cu istoricul real) și scrie ce vrea, când vrea.
- Butonul „Discută cu proprietarul" rămâne, dar duce direct la `/mesaje?conv=<id>` fără să injecteze nimic.

În `src/features/messaging/messagingApi.ts`:
- Marchez `ensureRentalContextMessage` și interfața `RentalContext` ca `@deprecated` (nu le șterg ca să nu sparg eventuale alte importuri), cu comentariu explicit „Nu mai folosi — chat-ul rămâne firesc".

### 3. UX copy

În `src/data/uxCopy.ts`, adaug în `productDetail`:
- RO: `askOwner: "Întreabă proprietarul"`, `askOwnerSubtitle: "Pune o întrebare înainte să rezervi"`
- EN: `askOwner: "Ask the owner"`, `askOwnerSubtitle: "Ask a question before you book"`

## Beneficiu

- Userul poate întreba liber înainte de plată (model Vinted/OLX) → mai multe rezervări reale, mai puține surprize.
- După plată, chat-ul nu mai e poluat de un mesaj robotic — conversația rămâne naturală.
- Conversațiile vechi nu sunt afectate (nu modific RLS, schemă, sau date existente).

## Ce NU schimb

- Tabelele `conversations` / `messages`, RLS-uri, edge functions.
- Logica de rezervare / plată / Stripe.
- Componenta `ChatDialog` și pagina `/mesaje` (deja funcționează).
- `getOrCreateConversation` — refolosită identic.
