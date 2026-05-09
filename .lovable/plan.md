## Obiectiv
Transformare chat-ul existent (`src/components/messaging/*`) într-o experiență premium tip Airbnb/Telegram/WhatsApp, cu media, presence realtime și context puternic legat de rezervare. Păstrăm stack-ul curent (React Query + Supabase Realtime) — doar UI + features noi, fără Zustand sau virtualizare.

## 1. Design System Chat (frontend pur)

**Layout desktop nou (3 coloane):**
```
┌──────────┬──────────────────────────┬──────────┐
│ Convos   │  Stage Header            │ Info     │
│ (340px)  │  Transaction Card        │ Panel    │
│          │  Messages (bubbles)      │ (320px)  │
│          │  Sticky input + media    │          │
└──────────┴──────────────────────────┴──────────┘
```
Mobile: full-screen chat, info panel ca sheet (slide-up din header tap), conversation list separat.

**Bubble style premium:**
- Own: `bg-primary text-primary-foreground`, colț bottom-right square (tail), `rounded-3xl rounded-br-md`, soft shadow.
- Other: `bg-card border border-border/40`, colț bottom-left square, `rounded-3xl rounded-bl-md`.
- Group consecutive messages from same sender (avatar + timestamp doar pe ultimul).
- Date separators ("Astăzi", "Ieri", "12 mai") — chip centrat cu glassmorphism (`bg-background/60 backdrop-blur`).
- Timestamps subtile sub bubble la hover (desktop) sau permanent mic (mobile).

**Animații (Framer Motion):**
- Mesaje noi: `initial={{ opacity:0, y:8, scale:0.96 }}` → `animate spring`.
- Typing indicator: 3 dots cu `animate-bounce` staggered.
- Seen tick: scale-in cu fade.
- Upload progress: bar `motion.div` width animat.
- Tab switch info panel: `AnimatePresence` slide.

## 2. Rental Stage Header

Banda subtilă deasupra mesajelor cu stepper compact (5 pași): `Cerere → Aprobat → Plătit → Predare → Returnat`.
- Stage curent derivat din `rentals.status` + flaguri (`paid_at`, `handover_confirmed_at`, `return_confirmed_at`).
- Fiecare pas: dot color-coded (Verde=done, Orange=current, Gri=todo). Negru pe `cancelled`.
- Sub stepper: linie text "Plata urmează după aprobare" / acțiunea recomandată.
- Realtime: subscribe la `rentals` UPDATE pe `rental_id` din conversation.

## 3. Transaction Card (read-only)

Card sticky sub stage header (collapsibil pe mobile), regenerat din `conversations.rental`:
- Thumbnail produs + titlu + perioadă + total RON + badge status colorat.
- Un singur CTA: "Vezi rezervarea" → `/rentals/{public_id}`.
- Variant compact când scrollezi în jos (header se shrink-uiește).

## 4. Upload Media (imagini + MP4 ≤ 25MB)

**DB / Storage:**
- Bucket nou `chat-media` (privat). RLS: insert dacă user e participant la `conversation_id` (folder structure `{conversation_id}/{uuid}.{ext}`); select cu signed URLs prin RPC.
- Tabel nou `message_attachments`: `id, message_id, conversation_id, uploader_id, kind ('image'|'video'), storage_path, mime_type, size_bytes, width, height, duration_ms, thumbnail_path, created_at`.
- Index pe `conversation_id, created_at`.
- RLS: SELECT participanți + admin; INSERT uploader_id = auth.uid().

**Frontend:**
- Buton paperclip + drag & drop overlay în zona mesajelor.
- Validare client: max 25MB, mime allow-list, count ≤ 6 per mesaj.
- Imagini >1MB: comprimă cu Canvas API existent (max 1920px, JPEG 0.8) — refolosim utilul din `image-upload-optimization`.
- Video: extrage primul frame ca thumbnail (Canvas + `<video>` seek 0.1s).
- Preview înainte de send: row de thumbnails cu X de eliminat.
- Upload paralel cu `Promise.all`, progress per fișier, apoi `sendMessage` cu `attachment_ids`.
- Mesaj cu attachments: bubble afișează grid de imagini (1=full, 2=split, 3=2+1, 4+=2x2 cu "+N"), video cu poster + play overlay.
- Click → `MediaLightbox` (refolosim Embla din product gallery): swipe între toate media din conversație.

## 5. Shared Media Panel

Tab "Media" în Info Panel dreapta (desktop) / bottom sheet (mobile):
- Sub-tabs: `Imagini | Videoclipuri | Linkuri`.
- Grid 3 coloane, lazy load, click → lightbox.
- "Linkuri" listează URL-uri extrase cu `extractUrls` (deja există în `urlScanner`) + classification badge (Safe/Warning/Blocked).

## 6. Contact Info Panel (refactor `ContactInfoCard`)

Coloana dreaptă desktop: avatar mare, nume, KYC badge (`kyc_level`), "Membru din", email/telefon/WhatsApp **respectând Gated Contact Flow v2** (nu afișa până nu există rental activ/plătit). Buton "Vezi profil".

## 7. Realtime Presence (online + typing + delivered + seen)

**Folosim Supabase Realtime Presence** pe canalul existent `chat-panel-{conversationId}`:
- `track({ user_id, online_at, typing: false })` la subscribe.
- Typing: debounced `track({ typing: true })` la `onChange` input + reset după 2.5s.
- Online dot pe avatar header (verde dacă peer prezent, gri + "ultima dată activ" altfel — last_seen din presence sync).
- Delivered: marcăm la INSERT realtime în client (postgres_changes deja există).
- Seen: existing `markMessagesAsRead` + afișăm dublu-tick orange pe mesajele proprii când peer-ul are `last_read_at >= msg.created_at`.
- Adăugăm coloană `conversations.{buyer,owner}_last_read_at` (timestamptz) updatată de `markMessagesAsRead` pentru a calcula seen state corect cross-session.

## 8. Securitate & Moderare

- Reuse `MessageContent` + `urlScanner` pentru linkuri (deja livrat).
- Media moderation: buton "Raportează" pe fiecare attachment → reuse `url_reports` extins sau tabel `message_reports` (`id, message_id, attachment_id, reporter_id, reason, created_at`).
- Block user: buton în Info Panel → tabel nou `user_blocks` (`blocker_id, blocked_id`); ascunde conversațiile cu blocați + împiedică INSERT mesaje (RLS).

## 9. Admin Dashboard Chat Control

Tab nou `/admin/messaging`:
- Listă conversații cu filter (utilizator, produs, raportate).
- Click → vizualizare read-only mesaje + media grid + linkuri scanate.
- Acțiuni admin: marchează attachment ca `hidden_by_admin` (boolean nou pe `message_attachments`), ban user (folosim `profiles.is_banned`), vezi `message_reports`.

## 10. Animations / Performance

- `framer-motion` (deja în dep tree pentru alte feature-uri — verificăm; dacă nu, adăugăm).
- React Query keep păstrat; mesajele rămân în state local pentru optimistic updates la send (mesaj cu `status: sending → sent → delivered → seen`).
- Smooth scroll: doar dacă userul e deja la bottom (altfel arată badge "↓ N mesaje noi").

---

## Tehnic — fișiere modificate / create

**Migrare SQL:**
- `chat-media` storage bucket + policies.
- `message_attachments` tabel + RLS + index.
- `message_reports` tabel + RLS.
- `user_blocks` tabel + RLS, ajustare RLS `messages` INSERT.
- `conversations.buyer_last_read_at`, `owner_last_read_at`.
- RPC `get_signed_chat_media(attachment_id)` cu verificare participant.

**Frontend nou:**
- `src/components/messaging/ChatHeader.tsx` (avatar + presence + actions)
- `src/components/messaging/RentalStageStepper.tsx`
- `src/components/messaging/TransactionCard.tsx`
- `src/components/messaging/MessageBubble.tsx` (cu grouping, animations, attachments)
- `src/components/messaging/MessageInput.tsx` (autosize, paperclip, drag&drop, preview)
- `src/components/messaging/AttachmentGrid.tsx` + `MediaLightbox.tsx`
- `src/components/messaging/InfoPanel.tsx` (tabs: Detalii / Media / Linkuri)
- `src/components/messaging/TypingIndicator.tsx`
- `src/hooks/useChatPresence.ts`
- `src/lib/chatMedia.ts` (compress, thumbnail, upload)
- `src/pages/admin/AdminMessaging.tsx`

**Refactor:**
- `ChatPanel.tsx` devine orchestrator (folosește componentele de sus).
- `messagingApi.ts` adăugări: `sendMessageWithAttachments`, `markRead` actualizat, `getSharedMedia`, `reportMessage`, `blockUser`.
- `Messages.tsx` layout 3 coloane desktop.

## Out of scope (faza 1)
- Mesaje vocale, reacții emoji, replies threaded, ștergere mesaje, edit.
- Virtualizare listă (rămâne dacă apare nevoia >500 msg).
- ML phishing / VirusTotal.
