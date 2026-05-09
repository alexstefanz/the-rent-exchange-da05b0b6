## Faza 2: Integrare UI redesign chat

Conectez componentele create în Faza 1 (`RentalStageStepper`, `TransactionCard`, `MediaLightbox`, `TypingIndicator`, `useChatPresence`, `chatMedia`) într-o experiență coerentă, premium, în stil KeyVue/Airbnb/Telegram.

### 1. Layout `Messages.tsx` (desktop 3 coloane / mobile full-screen)

```text
┌─────────────┬──────────────────────────┬───────────────┐
│ Convos 340  │ ChatHeader (peer+stage)  │ InfoPanel 340 │
│ • search    │ ─────────────────────────│ • avatar+KYC  │
│ • lista     │ TransactionCard (sticky) │ • contact     │
│   convo     │ ─────────────────────────│ • shared media│
│             │ Mesaje (bubbles+date sep)│   tabs        │
│             │ TypingIndicator          │ • report/block│
│             │ ─────────────────────────│               │
│             │ MessageInput (+ attach)  │               │
└─────────────┴──────────────────────────┴───────────────┘
```

Mobile: lista plin-ecran → chat plin-ecran (back arrow) → InfoPanel slide-up sheet.

### 2. Componente noi

- **`ChatHeader.tsx`** – avatar peer cu dot online, nume, status („online" / „acum X min" / „typing…"), buton info (mobile), buton 3CX (păstrat din memoria existentă).
- **`MessageBubble.tsx`** – bubble rotunjit (rounded-2xl, primary pentru self, muted pentru peer), grupare consecutive, footer cu timestamp + bifa „seen", suport `MessageContent` (link scanner) + `AttachmentGrid`.
- **`AttachmentGrid.tsx`** – grilă 1/2/3+ cu max 6 thumbs (imagini & poster video cu icon play), click → `MediaLightbox`.
- **`MessageInput.tsx`** – textarea autosize, buton attach (image/video, max 25MB, max 6), preview thumbnails înainte de send, progress bar upload, emit `typing` events.
- **`InfoPanel.tsx`** – tab-uri: **Detalii** (avatar, KYC, membru din, contact gated) / **Media** (Imagini | Video | Linkuri grid lazy) / **Acțiuni** (Raportează, Blochează).
- **`DateSeparator.tsx`** – „Astăzi" / „Ieri" / „12 mai" cu pill glassmorphism.

### 3. Refactor `ChatPanel.tsx` (orchestrator)

Devine container care compune: `ChatHeader` + `RentalStageStepper` + `TransactionCard` + listă bubbles + `TypingIndicator` + `MessageInput`. Wire-up:

- `useChatPresence(conversationId, userId)` → `peerOnline`, `peerTyping`, `setSelfTyping`.
- `messagingApi.markRead(conversationId)` la deschidere și la mesaj nou (cu `mark_conversation_read` RPC).
- Realtime subscribe `messages` + `message_attachments` + `conversations` (pt. `*_last_read_at` → seen).
- Send: dacă există atașamente, pipeline `uploadChatAttachments` → `sendMessageWithAttachments` (insert message + update attachments cu `message_id`).

### 4. Extindere `messagingApi.ts`

- `sendMessageWithAttachments({ conversationId, content, attachmentIds })`
- `markRead(conversationId)` → invocă RPC `mark_conversation_read`
- `getSharedMedia(conversationId, kind)` cu paginare
- `reportMessage`, `blockUser`, `unblockUser`
- `getMessagesWithAttachments(conversationId)` (join `message_attachments`)

### 5. Animații (Framer Motion)

- Bubble enter: `fade + slide-up 8px`, `spring stiffness 260`.
- TypingIndicator: deja animat.
- Lightbox: `scale 0.95 → 1`, backdrop fade.
- InfoPanel mobile: `slide-up` sheet.
- Stage stepper: `width` animat la trecere status.

### 6. Stil premium

- Bubble: `rounded-2xl`, `shadow-[0_1px_2px_rgba(0,0,0,0.04)]`, padding `px-4 py-2.5`, `max-w-[75%]`.
- Background canal: `bg-[#FCFAF8]` (deja brand) cu pattern subtil noise opcional.
- Date pill: `backdrop-blur bg-background/70 border`.
- Self bubble: `bg-primary text-primary-foreground` (#F59E0B).
- Peer bubble: `bg-white border border-border/50`.

### 7. Restricționat (out of scope Faza 2)

- Admin Messaging dashboard (faza 3).
- Voice messages, reactions, threads, edit/delete.
- Virtualizare (volum scăzut, nu e necesar).

### Fișiere

**Create:** `ChatHeader.tsx`, `MessageBubble.tsx`, `MessageInput.tsx`, `AttachmentGrid.tsx`, `InfoPanel.tsx`, `DateSeparator.tsx`.

**Edit:** `ChatPanel.tsx` (rewrite orchestrator), `Messages.tsx` (layout 3 coloane + mobile flow), `messagingApi.ts` (funcții noi).

**Păstrate intacte:** `MessageContent.tsx` (security URL), `urlScanner.ts`, `ChatDialog.tsx`, `ConversationList.tsx`, `ContactInfoCard.tsx` (refolosit în InfoPanel).
