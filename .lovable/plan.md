

## Plan: Sistem complet de notificări pentru utilizatori (in-app + email)

### Diagnostic problemă raportată

**De ce nu a primit nimic utilizatorul la "Solicită reupload"?**

Funcția `requestReupload` din `src/features/admin/kycApi.ts` (liniile 253-266):
1. ✅ Schimbă status KYC la `IN_PROGRESS`
2. ✅ Setează `profiles.kyc_status = 'PENDING'`
3. ✅ Adaugă intrare în `kyc_audit_log`
4. ❌ **NU** creează notificare in-app pentru utilizator
5. ❌ **NU** trimite email

Același pattern lipsește la `approveKycCase` și `rejectKycCase`. Singurele acțiuni KYC care notifică ceva sunt cele care notifică **adminii** (via trigger `trg_admin_notify_kyc`), dar utilizatorul **nu primește nimic** când adminul îi schimbă statusul.

### Audit complet al sistemului de notificări

| Eveniment | Notif. in-app azi | Email azi | Status |
|---|---|---|---|
| KYC aprobat | ❌ | ❌ | **Lipsă completă** |
| KYC respins | ❌ | ❌ | **Lipsă completă** |
| KYC reupload solicitat | ❌ | ❌ | **Lipsă completă** |
| KYC trimis (confirmare către user) | ❌ | ❌ | **Lipsă** |
| Cerere rezervare nouă (către owner) | ✅ | ✅ | OK |
| Cerere rezervare confirmare (către renter) | ✅ | ✅ | OK |
| Rezervare acceptată | ✅ | ✅ | OK |
| Rezervare refuzată | ✅ | ✅ | OK |
| Rezervare anulată | ✅ | ✅ | OK |
| Plată captată / payout | ❌ | ❌ | **Lipsă** |
| Mesaj nou | ✅ | ✅ | OK |
| Recenzie primită | ✅ | ✅ | OK |
| Produs publicat (aprobat) | ✅ (general) | ✅ | OK |
| Produs respins de admin | ❌ | ❌ | **Lipsă** |
| Ticket creat (confirmare către user) | ❌ | ❌ | **Lipsă** |
| Răspuns admin la ticket | ❌ | ❌ | **Lipsă** |
| Ticket închis/rezolvat | ❌ | ❌ | **Lipsă** |
| Cerere retragere creată | ❌ | ❌ | **Lipsă** |
| Retragere aprobată/plătită | ❌ | ❌ | **Lipsă** |
| Retragere respinsă | ❌ | ❌ | **Lipsă** |
| Cont banat | ❌ | ❌ | **Lipsă** |
| Bun venit (după înregistrare) | — | ✅ | OK |
| Parolă schimbată | — | ✅ | OK |

### Modificări propuse

#### 1. Templates email noi (8 noi în `_shared/transactional-email-templates/`)

| Template nou | Trigger | Destinatar |
|---|---|---|
| `kyc-approved.tsx` | KYC aprobat de admin | User |
| `kyc-rejected.tsx` | KYC respins de admin | User (cu motiv + CTA "Reîncearcă") |
| `kyc-reupload-requested.tsx` | Admin cere reupload | User (cu CTA "Încarcă din nou") |
| `kyc-submitted.tsx` | User trimite KYC | User (confirmare + ETA 24h) |
| `product-rejected.tsx` | Produs respins de admin | Owner (cu motiv + CTA edit) |
| `ticket-created.tsx` | User deschide ticket | User (confirmare cu TCK-XXXXXX) |
| `ticket-replied.tsx` | Admin răspunde la ticket | User (preview răspuns + CTA "Vezi") |
| `ticket-resolved.tsx` | Admin închide ticket | User (rezoluție + opțiune redeschidere) |
| `withdrawal-requested.tsx` | User cere retragere | User (confirmare sumă + IBAN parțial) |
| `withdrawal-processed.tsx` | Admin aprobă plata | User (confirmare transfer) |
| `withdrawal-rejected.tsx` | Admin respinge cu notă | User (motiv + CTA suport) |
| `payout-received.tsx` | Plată captată după închiriere | Owner (sumă în balanță) |
| `account-banned.tsx` | Admin banează cont | User (motiv + CTA contact) |

Toate înregistrate în `registry.ts`.

#### 2. Centralizare in-app notifications + email — funcție DB unificată

**Migrație nouă** — adaug funcția RPC `create_user_notification` (SECURITY DEFINER) care:
- Inserează în `notifications` (in-app, pentru utilizator)
- Trigger-ul `process-email-queue` rămâne separat — email-urile se trimit invocând `send-transactional-email` din punctele de apel

Asta evită N+1 inserts și garantează consistență.

**Triggere DB noi** (toate `SECURITY DEFINER`, `SET search_path = public`):

| Trigger | Tabel sursă | Eveniment | Notificare creată |
|---|---|---|---|
| `notify_user_kyc_decision` | `kyc_cases` UPDATE | status: SUBMITTED→APPROVED | in-app `kyc_approved` |
| ⬆ același | | status→REJECTED | in-app `kyc_rejected` |
| ⬆ același | | status→IN_PROGRESS (reupload) | in-app `kyc_reupload_requested` |
| ⬆ același | | INSERT/status→SUBMITTED | in-app `kyc_submitted` |
| `notify_user_product_rejected` | `products` UPDATE | approval_status→rejected | in-app `product_rejected` |
| `notify_user_ticket_created` | `ops_tickets` INSERT | nou | in-app `ticket_created` |
| `notify_user_ticket_message` | `ops_ticket_messages` INSERT | author_type=ADMIN, is_internal=false | in-app `ticket_replied` |
| `notify_user_ticket_resolved` | `ops_tickets` UPDATE | status→CLOSED | in-app `ticket_resolved` |
| `notify_user_withdrawal_status` | `withdrawal_requests` INSERT/UPDATE | INSERT / status→approved/rejected | in-app `withdrawal_*` |
| `notify_user_payout` | `transactions` INSERT | type=owner_payout, status=completed | in-app `payout_received` |
| `notify_user_banned` | `profiles` UPDATE | is_banned: false→true | in-app `account_banned` |

**Important**: triggerele DB inserează DOAR `notifications` in-app. Pentru email-uri, modific funcțiile sursă (TypeScript) să cheme `send-transactional-email` direct după acțiune — pattern care există deja pentru rezervări.

#### 3. Modificări TypeScript pentru email-uri (puncte de apel existente)

**`src/features/admin/kycApi.ts`** — adaug în 3 funcții apel către `send-transactional-email`:
- `approveKycCase` → template `kyc-approved`, `idempotencyKey: kyc-approved-{caseId}`
- `rejectKycCase` → template `kyc-rejected`, include `rejection_reason`
- `requestReupload` → template `kyc-reupload-requested`

**`src/features/admin/adminProductsApi.ts`** — la respingerea produsului → template `product-rejected`.

**`src/features/admin/opsTicketsApi.ts`** (sau locul unde se creează ticket-uri):
- La creare ticket de către user → `ticket-created`
- La răspuns admin → `ticket-replied` (folosesc trigger DB care apoi cheamă edge function via pg_notify? **NU** — folosim apel direct din UI admin: `AdminTicketDetail.tsx` când adminul postează mesaj public)
- La închidere ticket → `ticket-resolved`

**`src/features/profile/profileApi.ts`** sau locul withdrawal:
- La creare retragere → `withdrawal-requested` către user
- La aprobare/respingere de admin → `withdrawal-processed` / `withdrawal-rejected`

**`supabase/functions/capture-rental-payment/index.ts`** — la captare reușită → `payout-received` către owner.

**`src/features/admin/banApi.ts`** — la ban → `account-banned`.

#### 4. UI utilizator — îmbunătățiri minore

`src/components/profile/NotificationsTab.tsx` și pagina `/notificari`:
- Adaug iconițe colorate per tip nou (`Shield` verde/roșu pentru KYC, `Ticket` pentru tickete, `Banknote` pentru retrageri/payouts, `Ban` pentru ban)
- `link` în notificare duce direct la pagina relevantă (`/verificare`, `/suport/{id}`, `/castiguri`, etc.)

#### 5. Fix istoric (one-time data backfill)

În aceeași migrație: pentru cazurile KYC deja decise (APPROVED/REJECTED) în ultimele 7 zile fără notificare — **NU** generăm retroactiv (ar fi confuz). Doar de la momentul deploy-ului încolo.

### Securitate

- Triggerele și RPC-urile folosesc `SECURITY DEFINER` cu `SET search_path = public` (consistent cu codebase-ul)
- RLS pe `notifications` deja permite doar `user_id = auth.uid()` să vadă/modifice — nicio schimbare necesară
- Email-urile folosesc `idempotencyKey` derivat din ID-ul evenimentului (ex: `kyc-approved-{caseId}`) pentru a preveni duplicate la retry
- Niciun conținut user-generated nu intră în subject/body fără escaping (React Email face escape automat la props)
- Toate apelurile `send-transactional-email` sunt non-blocking (`.catch(console.error)`) — eșecul email nu strică acțiunea principală

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `supabase/migrations/<timestamp>.sql` | NOU — 7 funcții+triggere pentru in-app notifications utilizator |
| `supabase/functions/_shared/transactional-email-templates/*.tsx` | 13 template-uri noi |
| `supabase/functions/_shared/transactional-email-templates/registry.ts` | Înregistrare 13 template-uri noi |
| `src/features/admin/kycApi.ts` | Apel `send-transactional-email` în 3 funcții (approve/reject/reupload) |
| `src/features/admin/adminProductsApi.ts` | Email la respingere produs |
| `src/features/admin/opsTicketsApi.ts` | Email la creare/răspuns/închidere ticket |
| `src/features/admin/banApi.ts` | Email la ban |
| `src/features/profile/profileApi.ts` (sau echivalent withdrawal) | Email la creare retragere |
| `src/pages/admin/AdminFinances.tsx` (locul aprobării withdrawal) | Email la aprobare/respingere |
| `supabase/functions/capture-rental-payment/index.ts` | Email payout către owner |
| `src/components/profile/NotificationsTab.tsx` | Iconițe + culori per tip nou |
| `src/pages/NotificationsPage.tsx` | Idem |

### Rezultat pentru bug-ul raportat

După implementare, când apeși "Solicită reupload" pe `/admin/kyc/<id>`:
1. Trigger DB `notify_user_kyc_decision` inserează în `notifications` cu `link='/verificare'`
2. `requestReupload` în TypeScript cheamă `send-transactional-email` cu template `kyc-reupload-requested`
3. Utilizatorul vede notificarea pe clopoțelul din header (realtime via Supabase Realtime, deja activ pe `notifications`)
4. Utilizatorul primește email branded de la `noreply@rentli.ro`

### Limitări recunoscute

- **Email-urile pot fi suppressed**: dacă utilizatorul s-a dezabonat sau email-ul a făcut bounce, sistemul îl ignoră (comportament corect)
- **Notificările in-app sunt per-user**, nu agregate (dacă adminul respinge KYC de 3 ori în 5 minute, userul vede 3 notificări — acceptabil, frecvența e foarte mică)
- **Backfill istoric NU se face** — doar evenimentele după deploy generează notificări
- **Push notifications** (browser/mobile) nu sunt incluse — doar in-app + email

