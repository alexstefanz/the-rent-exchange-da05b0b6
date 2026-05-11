## Problemă

Când dai click pe o notificare de tip `new_message` (ex: „Mesaj nou de la Alex Test"), nu se deschide conversația respectivă în chat. Link-ul salvat în DB este corect (`/mesaje?conv=<id>`), dar UI-ul nu reacționează în două situații cheie.

## Cauze identificate

1. **`Messages.tsx`** — `useEffect`-ul care selectează conversația din `?conv=` are condiția `!selectedConversation`. Dacă utilizatorul are deja o conversație deschisă (sau dă click pe altă notificare cât e în `/mesaje`), parametrul nou din URL este ignorat și conversația nu se schimbă.

2. **`NotificationCenter.tsx` → `mapLink`** — păstrează corect `/mesaje?conv=...`, dar nu există un caz explicit pentru tipul `new_message`. Dacă vreodată sosește o notificare fără `link` (sau cu link generic `/mesaje`), nu se deschide nicio conversație.

3. **`MessagesTab.tsx`** (varianta din `/profile`) — nu citește deloc `?conv=` din URL, deci dacă notificarea trimite spre `/profile?...` nu va selecta conversația. (Verific dacă mai e folosită; dacă da, primește același tratament.)

## Modificări propuse (doar frontend)

### `src/pages/Messages.tsx`
- Schimb `useEffect`-ul ca să reacționeze de fiecare dată când se schimbă `?conv=`:
  - dependency: `[searchParams, conversations, user?.id]`
  - condiție nouă: dacă `convId` există și diferă de `selectedConversation?.id`, caută în `conversations` și selectează-o + setează tab-ul corect (`rezervari` / `de-inchiriat`).
  - pe mobil: setarea conversației selectate va deschide automat fullscreen chat (deja gestionat).

### `src/components/notifications/NotificationCenter.tsx`
- În `mapLink`, adaug fallback explicit pentru `type === "new_message"`:
  - dacă `link` deja conține `/mesaje`, îl returnez ca atare;
  - altfel returnez `/mesaje` (mai bine decât nimic).
- În `handleSelect`, închid popover-ul și apelez `navigate(...)` chiar dacă suntem deja pe `/mesaje` — React Router va actualiza `searchParams` și noul `useEffect` din Messages va prelua conv-ul.

### `src/components/profile/MessagesTab.tsx` (dacă e încă folosit într-o rută activă)
- Adaug un `useEffect` similar care citește `?conv=` din URL și selectează conversația, ca să funcționeze și când notificarea e deschisă din `/profile`.

## Ce NU se schimbă
- Trigger-ele DB și edge function `send-message-notification` rămân la fel — link-ul salvat este deja corect.
- Nu modific business logic, doar comportamentul de navigare/selecție în UI.

## Verificare
1. Click pe notificare „Mesaj nou" din popover Navbar → se deschide conversația corectă.
2. Click pe altă notificare în timp ce ești deja în `/mesaje` cu o conversație deschisă → comută pe noua conversație.
3. Click pe notificare din pagina `/notificari` → navighează la `/mesaje?conv=...` și deschide chat-ul.
4. Mobil: click pe notificare → se deschide direct chat-ul fullscreen.
