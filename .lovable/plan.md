# Faza 5 — Optimizare AI Chat + 4 module opționale

## 0. Bugfix prioritar: AI Chat se blochează

**Problemă identificată** (din screenshot): după ce userul a confirmat draftul ("Confirm, trimite ticketul."), AI-ul a răspuns cu o nouă cerere de atașament în loc să apeleze `create_support_ticket`. Cauză: prompt-ul actual permite re-întrebări nelimitate și nu impune o limită de pași.

**Fix în `supabase/functions/support-ai-chat/index.ts`:**

- Rescriu system prompt cu reguli stricte: **maxim 3 întrebări totale înainte de draft**, apoi draft direct, apoi create la prima confirmare.
- Adaug în prompt un counter explicit ("Numără întrebările tale puse în mesajele anterioare. Dacă ai pus deja 3, NU mai întreba — apelează `draft_ticket` ACUM cu ce ai").
- Categoria din quick action sau context = nu se mai numără ca întrebare.
- Atașament = sugerat o singură dată, opțional, niciodată după draft.
- După `draft_ticket`: la orice mesaj user care conține "confirm/trimite/ok/da/yes/send" → apelează **direct** `create_support_ticket` cu fields-urile draftului. Nu mai pune întrebări.
- Reduc temperatura modelului (`temperature: 0.3`) pentru consistență.
- Dacă userul scrie "modifică" pe draft → reformulează doar field-ul cerut, nu reia flow-ul.

**Flow țintă (3 întrebări max):**

```text
1. Salut + chips categorie         → user tap chip
2. Întrebare detalii principale     → user răspunde
3. (opțional) Întrebare clarificare → user răspunde
   SAU sugestie atașament           → user atașează/skip
4. draft_ticket                     → card confirmare
5. user "confirm"                   → create_support_ticket
```

## 1. Macros & Saved Replies (admin)

**DB** (1 tabel nou):

- `support_macros`: `title`, `body` (text cu placeholders `{user_name}`, `{ticket_id}`, `{rental_id}`, `{product_title}`), `category_group` (nullable, pentru filtrare contextuală), `created_by`, `usage_count`.
- RLS: admins full access.

**Admin UI:**

- Pagina nouă `/admin/macros` (sidebar item) — listă + editor inline (titlu, corp, categorie, preview).
- În `AdminConversation.tsx`: buton **"Macros"** lângă "AI Assist" → popover cu lista filtrată pe categoria ticketului. Click pe macro → înlocuiește `{placeholders}` cu valorile reale (din ticket: requester name, public_id, rental public_id, product title) și inserează în textarea. Increment `usage_count`.
- Sortare default după `usage_count DESC` (cele mai folosite sus).

**Seed** (10 macro-uri uzuale): "Cer dovadă plată", "Cer poză daună", "Confirmare refund inițiat", "Escalare la tehnic", "Închidere automată după 14 zile", etc.

## 2. CSAT (rating după rezolvare)

**DB** (1 tabel nou):

- `support_csat`: `ticket_id` (unique), `user_id`, `rating` 1-5, `comment`, `submitted_at`.
- RLS: user poate insert pentru ticketul propriu rezolvat; admin select all.

**User UI:**

- În `TicketDetail.tsx`: când `status === 'RESOLVED'` și nu există CSAT pentru ticket, banner sus cu **5 stele clickable + textarea opțional + buton "Trimite feedback"**. După submit, banner devine "Mulțumim! ⭐⭐⭐⭐⭐".
- Trigger Postgres: la INSERT csat cu rating ≤ 2 → `admin_notifications` priority high "CSAT scăzut pe TCK-XXXX".

**Analytics:**

- Extind RPC `get_support_analytics` cu: `csat_avg`, `csat_count`, `csat_distribution` (jsonb {1: n, 2: n, ...}).
- Adaug card KPI "Satisfacție" + bar chart distribuție în `AdminSupportAnalytics.tsx`.
- Coloană nouă "CSAT mediu" în tabelul "Performanță echipă" (per admin).

## 3. Knowledge Base self-service

**DB** (2 tabele):

- `kb_articles`: `slug`, `title_ro`, `title_en`, `content_ro` (markdown), `content_en`, `category_group`, `tags` (text[]), `view_count`, `helpful_count`, `is_published`.
- `kb_article_views`: `article_id`, `user_id` (nullable), `created_at` — pentru analytics.
- RLS: anyone read published; admins full access.
- Index pg_trgm pe titlu pentru search rapid.

**Public UI:**

- `/help` — listă cu search + filtre pe categorie. Cards cu titlu, preview, view count.
- `/help/:slug` — pagină articol cu markdown render (`react-markdown`), buton "Util / Nu e util", related articles, link "Tot nu m-a ajutat → Deschide ticket" care preset-ează AI flow-ul cu categoria articolului.
- Bilingual via `useLanguage`.

**Integrare AI Chat:**

- Nou edge function `support-kb-search`: primește query, face full-text search peste `kb_articles`, returnează top 3 cu titlu + slug + snippet.
- În `support-ai-chat`: adaug tool `suggest_kb_articles` apelat de AI **înainte de a pune prima întrebare detalii** dacă topicul e clar (ex: user spune "cum anulez o rezervare"). UI render card "Articole recomandate" cu link-uri. Userul poate alege "Continuă cu ticket" sau click pe articol.

**Admin UI:**

- `/admin/kb` (sidebar) — listă articole + editor markdown cu preview live + publish toggle.

## 4. Customer Health Score

**RPC nou** `get_user_health_score(p_user_id uuid)` returnează jsonb:

```text
{
  score: 0-100,
  tier: 'EXCELLENT' | 'GOOD' | 'AT_RISK' | 'CRITICAL',
  signals: {
    open_tickets_count,
    last_30d_tickets_count,
    avg_csat,
    sla_breaches_count,
    lifetime_rentals,
    sentiment_label  // optional, din analiză AI a ultimelor mesaje
  }
}
```

**Formulă (linear-weighted):**

- Base 100, scade cu: tickete deschise (-5/each, max -25), tickete recente (-3/each), CSAT ≤ 2 (-15/each), SLA breach (-10/each).
- Crește cu: rentări lifetime (+1/each, max +20), CSAT ≥ 4 (+5/each).
- Tier: ≥80 EXCELLENT (verde), 60-79 GOOD (albastru), 40-59 AT_RISK (orange), <40 CRITICAL (roșu).

**Admin UI (`AdminContextSidebar.tsx`):**

- Card nou "Health Score" în top: badge colorat cu scorul + tier-ul + tooltip cu signals defalcate.
- În `AdminInboxList.tsx`: dot colorat mic lângă avatar requester pentru tier ≤ AT_RISK.

## 5. Tehnic — fișiere & migrații

**Migrație DB unică** (Macros, CSAT, KB, Health RPC, CSAT trigger, extindere `get_support_analytics`).

**Edge functions noi:**

- `support-kb-search` (full-text search articole pentru AI).

**Edge functions modificate:**

- `support-ai-chat` (prompt strict + tool `suggest_kb_articles` + temperatura 0.3).

**Fișiere noi React:**

- `src/pages/admin/AdminMacros.tsx`
- `src/pages/admin/AdminKnowledgeBase.tsx`
- `src/pages/Help.tsx`, `src/pages/HelpArticle.tsx`
- `src/components/admin/tickets/MacrosPopover.tsx`
- `src/components/admin/tickets/HealthScoreCard.tsx`
- `src/components/support/center/CsatPrompt.tsx`
- `src/components/support/KbSuggestionsCard.tsx` (în chat widget)
- `src/features/support/macrosApi.ts`, `csatApi.ts`, `kbApi.ts`, `healthScoreApi.ts`

**Fișiere modificate:**

- `src/components/admin/tickets/AdminConversation.tsx` — buton Macros
- `src/components/admin/tickets/AdminContextSidebar.tsx` — Health Score card
- `src/components/admin/tickets/AdminInboxList.tsx` — health dot
- `src/components/support/center/TicketDetail.tsx` — CSAT prompt
- `src/components/support/SupportChatWidget.tsx` — KB suggestions render
- `src/pages/admin/AdminSupportAnalytics.tsx` — CSAT KPI + chart
- `src/components/admin/AdminSidebar.tsx` — items Macros + KB
- `src/App.tsx` — rute noi (`/help`, `/help/:slug`, `/admin/macros`, `/admin/kb`)

## 6. QA verificare

- Testez chat-ul cu un scenariu real (browser preview): pornesc, aleg "Produs" → o întrebare → confirm → ticket creat fără re-întrebări.
- Verific edge function logs după test.
- Confirm că draftul nu mai re-cere atașamente după confirmare.
