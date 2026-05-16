## Obiectiv
Elimină pop-up-ul de chat (`ChatDialog`) de pe toată aplicația. Orice buton care „deschide chat" va naviga direct la pagina principală de mesaje `/mesaje?conv=<conversationId>`.

## Locuri afectate

`ChatDialog` apare doar în 2 pagini (verificat cu `rg`):
1. `src/pages/RentalDetailPage.tsx` — `handleChat()` (folosit de butonul „Discută cu chiriașul/proprietarul" din diverse carduri: header, EarlyReturnCard etc.).
2. `src/pages/ProductDetail.tsx` — `handleStartChat()` și `handleQuickQuestion()` (CTA „Trimite mesaj" pe pagina produs).

`ChatPanel` (panoul mare din `/mesaje` și tabul Mesaje din profil) **rămâne neatins** — e chat-ul principal complet.

## Modificări

### 1. `src/pages/RentalDetailPage.tsx`
- Înlocuiește `handleChat()`:
  ```ts
  async function handleChat() {
    const convId = await getOrCreateRentalConversation(rental.id);
    if (convId) navigate(`/mesaje?conv=${convId}`);
    else toast.error(t("Nu am putut deschide conversația.", "Could not open conversation."));
  }
  ```
- Elimină: `import { ChatDialog }`, state-ul `chatOpen`/`setChatOpen` și `chatConvId`/`setChatConvId`, plus blocul `<ChatDialog ... />` din JSX (linia ~681).
- `navigate` deja există în fișier (folosit altundeva).

### 2. `src/pages/ProductDetail.tsx`
- `handleStartChat`: după `ensureConversation`, în loc de `setChatOpen(true)` → `navigate(\`/mesaje?conv=\${conv.id}\`)`.
- `handleQuickQuestion`: după `sendMessage`, în loc de `setChatOpen(true)` → `navigate(\`/mesaje?conv=\${conv.id}\`)`.
- Elimină importul `ChatDialog`, state-ul `chatOpen`/`setChatOpen` și `<ChatDialog ... />` din JSX (linia 407).

### 3. Șterge fișierul nefolosit
- `src/components/messaging/ChatDialog.tsx` — după eliminarea ultimelor 2 referințe, nu mai e importat nicăieri.

## În afara scopului
- `ChatPanel`, pagina `/mesaje`, `MessagesTab` din profil — rămân ca sunt.
- `SupportChatWidget` (chat-ul de support cu AI) — diferit de chat-ul user-to-user, nu se atinge.
- Logica de creare/ensure conversație rămâne aceeași.
