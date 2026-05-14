## Goal
Block messages cu limbaj licențios (RO+EN), permite raportarea oricărui mesaj direct din bula de chat și adaugă o secțiune dedicată „Reports" în Admin pentru triaj (limbaj inadecvat, agresiune, fraudă, amenințări) cu acțiuni de moderare (avertisment, ban cont/email/telefon).

## 1. Filtru limbaj licențios (client + server)

**Nou:** `src/lib/profanityFilter.ts`
- Listă cuvinte RO+EN (curentă, ~80 termeni: insulte, injurii, slurs, amenințări explicite). Normalizează input (lowercase, fără diacritice, fără separatoare `*._-`) înainte de match cu `\bword\b`.
- Export: `containsProfanity(text): { hit: boolean; word?: string; severity: 'mild'|'severe' }`.

**`MessageInput.tsx`** — la `handleSend`:
- Dacă `containsProfanity(content).hit` → `toast.error` cu mesaj clar (RO/EN) și NU trimite. Mesajul explicit explică regula („Limbajul licențios nu este permis. Conturile care încalcă regula pot fi suspendate.").

**Server (defense-in-depth)** — trigger Postgres `messages_block_profanity` BEFORE INSERT pe `public.messages`:
- Funcție SQL care normalizează `content` și verifică o listă (constantă în funcție) de termeni; dacă match → `RAISE EXCEPTION 'PROFANITY_BLOCKED'`.
- Asigură că nici clienți modificați nu pot trimite.

## 2. Buton Report pe fiecare mesaj

**`MessageBubble.tsx`** — adaug meniu (icon `MoreVertical` apare la hover desktop / always pe mobile) cu `DropdownMenu`:
- „Raportează mesaj" → deschide `ReportMessageDialog`.

**Nou:** `src/components/messaging/ReportMessageDialog.tsx`
- Dialog cu select „Motiv": `inappropriate_language`, `harassment`, `threats`, `fraud`, `spam`, `other` + textarea opțională (max 500 char).
- Submit → insert în `message_reports` (`message_id`, `reporter_id=auth.uid()`, `reason="<category>: <details>"`).
- Toast confirmare „Mulțumim, raportul a fost trimis echipei de moderare."
- Dezactivează butonul pentru mesajele proprii.

## 3. Admin „Reports" — secțiune dedicată

**Migrație DB:**
- `ALTER TABLE message_reports ADD COLUMN category text DEFAULT 'other'` (enum-like text: `inappropriate_language|harassment|threats|fraud|spam|other`) și `ADD COLUMN admin_notes text`, `ADD COLUMN resolved_at timestamptz`, `ADD COLUMN resolved_by uuid`, `ADD COLUMN action_taken text` (`none|warning|message_hidden|user_banned`).
- `ADD COLUMN public_id text` cu trigger generator `RPT-XXXXXX` similar `TCK-`.
- Index pe `(resolved, created_at desc)`.

**Nou:** `src/pages/admin/AdminReports.tsx` + rută `/admin/reports`
- Tabs: „Deschise", „Rezolvate", „Toate".
- Tabel cu coloane: Public ID, Categorie (badge color-coded), Mesaj (preview + link la conversație), Reporter, Autor mesaj, Data, Acțiuni.
- Click rând → `AdminReportDetail` drawer cu:
  - Conținutul integral al mesajului + context (5 mesaje înainte/după din conversație).
  - Profilul autorului (link `/admin/users/:id`) + istoric rapoarte.
  - Acțiuni: „Ascunde mesaj" (set `messages.is_hidden`/sau folosește existing `message_attachments.hidden_by_admin` pattern, vezi nota mai jos), „Avertizare utilizator" (creează notificare), „Banează utilizator" (folosește `banApi` existent — banuiește contul + opțional marchează email/telefon ca blocate prin tabela existentă `user_blocks`/sau o nouă `banned_identifiers`).
  - Câmp `admin_notes` + buton „Marchează rezolvat".
- Realtime: `supabase.channel('message_reports')` pe `INSERT` → invalidează lista.

**Nou:** `src/features/admin/messageReportsApi.ts`
- `listMessageReports({ status, category, limit, offset })` — JOIN `messages` + `profiles` (reporter & autor) + `conversations`.
- `getReportContext(reportId)` — returnează mesaje surrounding.
- `resolveReport(id, { action_taken, admin_notes })`.
- `hideMessage(messageId)` — set flag.

**`messages` table:** ADD COLUMN `is_hidden boolean default false`, `hidden_at timestamptz`, `hidden_by uuid`. Update RLS „Conversation participants can view messages": adaug `AND is_hidden = false` (admins văd tot oricum). Update `MessageContent` să afișeze placeholder „Mesaj eliminat de moderator" dacă `is_hidden` și user e participant.

**Sidebar admin** (`AdminSidebar.tsx`): adaug entry „Reports" cu icon `Flag`, badge `pending_reports` (extind `useDrawerStats`/`get_admin_stats` cu count `message_reports WHERE resolved = false`).

**Dashboard** (`AdminDashboard.tsx`): adaug `StatsCard` „Rapoarte deschise" → `/admin/reports`.

## 4. Ban extins (email + telefon)
Folosește `banApi` existent pentru ban cont. Pentru blocarea reînregistrării cu același email/telefon:
- Tabel nou `banned_identifiers (id, type ('email'|'phone'), value text unique, banned_by, reason, created_at)`.
- Trigger pe `auth.users`: pe signup, dacă `email` ∈ `banned_identifiers` → block (via existing `before_user_signup` hook dacă există, altfel se aplică doar la nivel de validare manuală în UI Auth).
- UI ban în drawer raport: checkbox „Blochează și emailul/telefonul utilizatorului" la apăsarea „Banează".

## Out of scope
- ML-based moderation (folosim listă statică + raport manual).
- Auto-ban automat după N rapoarte (rămâne decizie admin).
- Editare retroactivă a mesajelor existente.
- Modificări UI listă conversații (badge raport per conversație).

## Tech notes
- Trigger profanity rulează în Postgres → blochează inclusiv inserturi din REST direct.
- `is_hidden` filtrare la nivel RLS evită leak în realtime (se va re-emite UPDATE când admin ascunde, clienții vor primi event și pot remove local; alternativ rămâne cached — acceptabil, refresh la reload).
- `RPT-XXXXXX` reutilizează patternul din `ops_tickets.public_id`.
