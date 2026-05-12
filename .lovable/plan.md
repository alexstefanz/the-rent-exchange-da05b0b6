## Obiectiv

Butonul "Trimite mesaj" din pagina de închiriere (`/rezervari/RNT-XXXXXX`) nu mai navighează către `/mesaje`, ci deschide o fereastră modală peste pagina curentă, cu firul de chat dedicat închirierii (chiriaș ↔ proprietar, pe subiectul produsului). Utilizatorul rămâne în contextul închirierii.

## Ce se construiește

1. **Componentă nouă `RentalChatDialog`** (`src/components/rentals/RentalChatDialog.tsx`)
   - Bazată pe `Dialog` din shadcn, dimensiune mare pe desktop (`max-w-2xl`, înălțime ~80vh) și full-screen pe mobil.
   - Header: avatar + nume contraparte, titlu produs, link mic "Deschide în Mesaje" (navighează la `/mesaje?conv=...` pentru cei care vor view-ul complet).
   - Body: reutilizează componenta existentă de mesaje (lista + input) din pagina `/mesaje`, izolată într-un sub-component reutilizabil dacă e necesar (fără duplicare logică).
   - Realtime activ în timp ce dialogul e deschis; marchează mesajele ca citite la deschidere.

2. **Integrare în `RentalDetailPage.tsx`**
   - Înlocuiește `handleChat` astfel: în loc de `navigate(/mesaje?conv=...)`, apelează `getOrCreateRentalConversation(rental.id)`, salvează `conversationId` în state și deschide `RentalChatDialog`.
   - Două puncte de deschidere existente rămân (butonul mare din header-ul de status și butonul mic din cardul Counterparty) — ambele folosesc același handler.
   - Fallback: dacă RPC-ul eșuează, toast de eroare.

3. **Reutilizarea conversației**
   - Folosește RPC-ul existent `get_or_create_rental_conversation` (deja implementat) — fiecare închiriere are firul ei propriu, legat de `rental_id` + `product_id`.
   - Nu se creează tabele/RPC-uri noi.

## Ce NU se schimbă

- Pagina `/mesaje` rămâne neatinsă (continuă să funcționeze independent).
- Bubble-ul cu mesajul pre-cerere din cardul produsului din `RentalsOutTab` rămâne așa cum e.
- Notificările push/email pentru mesaje noi rămân neschimbate.

## Detalii tehnice

- Pentru a evita duplicarea, extrag (dacă nu există deja) un component `<ConversationThread conversationId={...} />` din pagina `/mesaje` care randează lista de mesaje + input-ul. `MessagesPage` îl va folosi în continuare în split-view, iar `RentalChatDialog` îl va folosi în modal.
- Dialogul se închide cu `Esc` / click în afara / buton X. Pe mobil ocupă tot ecranul (`h-[100dvh]`) pentru a păstra UX-ul de chat full-screen din restul aplicației.
- Fără modificări de schemă, RLS sau edge functions.

## Fișiere

- **Nou:** `src/components/rentals/RentalChatDialog.tsx`
- **Nou (dacă e nevoie de refactor):** `src/components/messaging/ConversationThread.tsx` (extras din `MessagesPage`)
- **Editat:** `src/pages/RentalDetailPage.tsx` (handleChat + state pentru dialog + render dialog)
- **Editat (eventual):** `src/pages/MessagesPage.tsx` (folosește noul `ConversationThread`)
