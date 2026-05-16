## Obiectiv
Re-adăugăm opțiunea "Vorbește cu proprietarul" în două locuri unde lipsește în acest moment, fără să afectăm logica de rezervare:

1. **Pagina produsului** (`PremiumBookingCard` desktop + `MobileStickyBookingBar`) — un buton secundar lângă "Rezervă acum".
2. **Pagina de checkout** (`/checkout`, pasul 1) — o acțiune vizibilă lângă cardul de mesaj opțional, care deschide o conversație reală în `/mesaje`.

Funcția `handleStartChat` din `ProductDetail.tsx` deja există (folosește `getOrCreateConversation`) și este transmisă ca prop `onAsk` în ambele componente — dar butonul nu mai e randat. La fel, la checkout avem deja `product.owner_id`, deci putem reutiliza același `getOrCreateConversation` fără modificări de backend.

## Modificări UI

### 1. `src/components/product/PremiumBookingCard.tsx`
- În blocul CTA (sub butonul "Rezervă acum"), adaugă un `Button variant="outline"` cu iconiță `MessageCircle` (deja importată) și label `t("Întreabă proprietarul", "Ask the owner")`.
- `onClick={onAsk}`, `disabled={isOwnProduct}`.
- Păstrează același styling consistent cu restul cardului (înălțime `h-11`, `w-full`).

### 2. `src/components/product/MobileStickyBookingBar.tsx`
- Aceeași tratare: un buton secundar mic ("Întreabă" / "Ask") lângă CTA principal sau în bara expandată, folosind `onAsk` (deja primit ca prop).

### 3. `src/pages/Checkout.tsx`
- Adaugă un mic banner/buton deasupra (sau în interiorul) `OptionalMessageCard` la pasul 1:
  - Iconiță `MessageCircle`, text bilingv: `t("Ai întrebări înainte de rezervare? Vorbește cu proprietarul", "Have questions before booking? Chat with the owner")`.
  - Buton `variant="outline"` → `Deschide chat` / `Open chat`.
- Handler nou `handleOpenChat`:
  ```
  const conv = await getOrCreateConversation(product.id, product.owner_id);
  navigate(`/mesaje?conv=${conv.id}`);
  ```
- Reutilizează `getOrCreateConversation` din `@/features/messaging/messagingApi`.
- Nu modificăm flow-ul de submit — utilizatorul se poate întoarce și continua.

### 4. `src/data/uxCopy.ts`
- Adaugă cheile noi în `productDetail` și `checkout`:
  - `askOwnerCta: { ro: "Întreabă proprietarul", en: "Ask the owner" }`
  - `chatBeforeBooking: { ro: "Ai întrebări? Vorbește cu proprietarul înainte de rezervare", en: "Questions? Chat with the owner before booking" }`
  - `openChat: { ro: "Deschide chat", en: "Open chat" }`

## În afara scopului
- Fără schimbări de backend / RLS / RPC.
- Nu atingem `message_to_owner` (rămâne mesajul opțional atașat cererii).
- Fără modificări în pagina de mesaje sau în logica conversațiilor.
- Fără schimbări la `RentalDetailPage` sau la flow-ul post-rezervare.