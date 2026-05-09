## Email Redesign Plan — Rentli Premium

Currently we have 25 transactional templates (`supabase/functions/_shared/transactional-email-templates/`) + 6 auth templates (`supabase/functions/_shared/email-templates/`). Each is hand-rolled with duplicated inline styles, no product card, no status badge. We'll standardize the visual language and enrich rental emails with product context.

### 1. Shared design system (new file)

Create `supabase/functions/_shared/transactional-email-templates/_components.tsx` exporting reusable React Email building blocks. Auth templates can re-import from this path too.

- `BaseLayout({ preview, children })` — full HTML shell with:
  - `Head` containing `<meta name="color-scheme" content="light dark">`, `<meta name="supported-color-schemes" content="light dark">`, viewport meta, and MSO conditional comments for Outlook
  - Page background `#F5F2EE` (warm neutral framing the card)
  - Centered 600px white card with `border-radius: 16px`, soft shadow `0 4px 24px rgba(48,37,32,0.06)`
  - Subtle Plus Jakarta Sans web font import with Arial fallback
- `Header()` — gradient hero `linear-gradient(135deg,#F59E0B 0%,#F98715 100%)`, 28px Rentli logo, 24px vertical padding, rounded top corners
- `H1`, `Lead`, `Body`, `Muted` typography primitives
- `ProductCard({ image, title, period, totalPrice, location, status })` — table-based for Outlook; left 96×96 image with `border-radius: 12px`, right column with title, location pin, period row, status badge, total row separated by `Hr`
- `StatusBadge({ status })` — color map:
  - pending → `#F59E0B` bg `#FEF3C7`
  - approved/active → `#16A34A` bg `#DCFCE7`
  - declined/cancelled → `#DC2626` bg `#FEE2E2`
  - payment_pending → `#2563EB` bg `#DBEAFE`
  - completed → `#7C3AED` bg `#EDE9FE`
- `CTAButton({ href, children, variant })` — primary (`#F59E0B`, white text) and ghost (transparent, `#F59E0B` border); 14px vertical / 28px horizontal padding; 12px radius; 100% width on mobile via `<!--[if !mso]>`/media query CSS
- `Divider`, `MessagePreview` (chat quote box), `InfoRow` (label/value pair)
- `Footer()` — support email, links to Help/Terms/Privacy, social icons (using public Storage SVGs we already host), trust line "Rentli — închiriere între oameni, securizată", and `{{unsubscribe}}` placeholder is **not** added (system appends it)

All styles are inline objects to satisfy email clients. A small CSS string in `<Head>` handles `@media (max-width:600px)` to stack ProductCard rows and force CTA full width, and `@media (prefers-color-scheme: dark)` to keep the card white but soften the page background — the body itself stays `#ffffff` per platform rules.

### 2. Redesign all 25 transactional templates

Rewrite each template to compose `BaseLayout + Header + H1 + Lead + (optional ProductCard / MessagePreview / InfoRow) + CTAButton + Footer`. No file/registry changes — same exports, same `template` shape, same `previewData` keys (extended where needed).

**Rental flow (gets ProductCard + StatusBadge):**
- `rental-request-owner`, `rental-request-renter` — status `pending`, primary CTA "Vezi cererea"
- `rental-accepted` — status `approved`, CTA "Vezi rezervarea"
- `rental-rejected` — status `declined`, ghost CTA "Caută alternative"
- `cancellation-owner`, `cancellation-renter` — status `cancelled`
- `payout-received` — status `completed` + amount row

**Account / KYC / product moderation (no ProductCard, branded info card instead):**
- `welcome` — hero illustration block with 3 quick-start tiles (Caută / Listează / Mesaje)
- `kyc-submitted/approved/rejected/reupload-requested` — KYC tier badge
- `product-published` (ProductCard preview) / `product-rejected` (reason callout)
- `password-changed`, `account-deactivation`, `account-banned` — security icon block

**Engagement:**
- `new-message` — sender avatar circle with initial, MessagePreview quote, CTA "Răspunde"
- `review-received` — star row (★★★★☆) + review excerpt

**Support tickets:**
- `ticket-created/replied/resolved` — ticket # pill, status badge, CTA "Vezi tichetul"

**Withdrawals:**
- `withdrawal-requested/processed/rejected` — amount row, IBAN masked, status badge

### 3. Auth template refresh

Update the 6 templates in `_shared/email-templates/` (`signup`, `magic-link`, `recovery`, `invite`, `email-change`, `reauthentication`) to use the same `BaseLayout + Header + Footer` so brand looks identical to transactional. Big OTP block uses 32px monospace digits with letter-spacing for clarity. No prop or hook changes — they keep their existing `auth-email-hook` integration.

### 4. Sender enrichment (rental emails only)

To populate the ProductCard, extend two senders to fetch and forward extra fields. UI/business logic untouched.

- `supabase/functions/send-rental-notification/index.ts`: change product select to `title, images, location, daily_price` and pass `productImage` (first image), `location`, `totalPrice` (`rental.subtotal`), `currency` to both `rental-request-owner` and `rental-request-renter` payloads.
- `supabase/functions/send-rental-status-notification/index.ts` (and any sibling for accept/reject/cancel — will grep and wire identically) — pass the same enriched payload to `rental-accepted`, `rental-rejected`, `cancellation-*`.

Templates accept the new props as optional — when missing (legacy queued payloads, test harness) the ProductCard gracefully falls back to a placeholder gradient tile and hides empty rows. No DB migration, no RLS change.

### 5. Test harness alignment

Update `supabase/functions/test-email-notifications/index.ts` and `src/pages/admin/AdminTestEmails.tsx` sample payloads to include `productImage`, `location`, `totalPrice`, `currency` so admin previews show the new rich layout.

### 6. Deploy

Single `deploy_edge_functions` call covering: `send-transactional-email` (re-bundles registry + components), `auth-email-hook`, `send-rental-notification`, `send-rental-status-notification`, `test-email-notifications`.

### Out of scope

- No new templates, no removals
- No queue / cron / domain changes
- No marketing emails
- No attachment support
- No language switch logic — emails stay Romanian as today

### Client compatibility

Tested visual targets: Gmail (web + iOS + Android), Apple Mail (macOS + iOS), Outlook 2016/365 (Windows uses MSO conditionals → ProductCard renders as `<table>`), Yahoo. Dark mode keeps card white per Lovable platform rule; only the outer page bg subtly inverts.
