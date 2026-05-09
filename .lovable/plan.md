## Wallet Dashboard Redesign — `/castiguri`

Pagina actuală arată 4 carduri simple + 2 tabele basic. Acest plan o transformă într-un Wallet premium (Stripe Express + Airbnb Earnings + Revolut), păstrând logica financiară existentă (`rentals.owner_payout` × `payment_status` minus `withdrawal_requests` aprobate/în curs) și sursa unică pentru IBAN (`profiles.iban` / `account_holder_name`) — exact cum este declarat în memoria proiectului.

### Componente noi

```
src/components/earnings/
  WalletHeroCard.tsx          — card mare cu balanță disponibilă, CTA "Retrage"
  BalanceBreakdown.tsx        — pills: Disponibil / În așteptare / Retras / Total
  WithdrawalMethodCard.tsx    — afișează IBAN + titular din profile, edit / empty state
  TransactionsTable.tsx       — tabel desktop + listă cards mobile, status badges, filtre
  TransactionDetailDrawer.tsx — Sheet cu detalii produs/perioadă/comision/ID
  WithdrawalsTable.tsx        — istoric cereri retragere cu PayoutTimeline
  PayoutTimeline.tsx          — mini stepper: Cerută → Procesare → Trimis → Finalizat
  WithdrawDrawer.tsx          — wizard multi-step (Sheet) cu STEP 1-4
  EmptyEarnings.tsx           — empty state premium
src/hooks/
  useEarnings.ts              — fetch + agregare (extras din EarningsTab existent)
  useWithdrawalsRealtime.ts   — Supabase Realtime pe withdrawal_requests
```

### Refactor

**`src/components/profile/EarningsTab.tsx`** — devine orchestrator slim (~120 linii):
- Folosește `useEarnings` (logica de calcul rămâne identică — păstrăm formula curentă: `total - pending - completedWithdrawals - pendingWithdrawals`).
- Compoziție: `WalletHeroCard` → `BalanceBreakdown` → `WithdrawalMethodCard` → `WithdrawalsTable` (dacă există) → `TransactionsTable` → `WithdrawDrawer`.
- `useWithdrawalsRealtime` invalidează datele când admin aprobă/respinge.

**`src/pages/EarningsPage.tsx`** — păstrat aproape identic (Navbar + container). Adaug breadcrumbs și un mic header cu icon Wallet.

**`src/components/profile/WithdrawalDialog.tsx`** — înlocuit cu `WithdrawDrawer.tsx` (Sheet din dreapta, mobile-first full-screen).

### Wallet Hero Card

- Card mare (rounded-2xl, shadow elegant), fundal `from-primary/5 via-background to-background`, accent border-primary/20.
- Stânga: icon Wallet în cerc primary/10, label "Disponibil pentru retragere", suma mare (text-4xl bold tabular-nums) + animație count-up la load.
- Dreapta (desktop) / dedesubt (mobile): CTA `Retrage bani` (size lg, primary), disabled cu tooltip dacă `availableBalance ≤ 0` sau `!profileIban`.
- Sub: micro-row cu "Câștiguri luna aceasta + X RON" (text verde delta).

### Balance Breakdown

4 pills inline (grid-cols-2 sm:grid-cols-4):
- **Disponibil** (verde, CheckCircle) — `availableBalance`
- **În așteptare** (amber, Clock) — `pendingPayout`, tooltip explicativ
- **Retras** (slate, ArrowUpRight) — sumă completed
- **Total câștiguri** (primary, TrendingUp) — `totalAllTime`

Fiecare pill: icon mic + label uppercase + valoare + sublabel optional. Hover: ring-primary/20.

### Withdrawal Method Card

- Dacă `profile.iban` există: card cu icon Bank, IBAN mascat (`RO49 •••• •••• •••• 0000`), titular, badge "Implicit", buton "Editează" (link spre `/contul-meu` secțiunea `payout`).
- Dacă nu există: empty state premium cu copy + CTA "Adaugă IBAN" → `/contul-meu#section-payout`.
- Notă trust: "Datele tale bancare sunt criptate și protejate." cu icon Lock.

**Notă:** card bancar (Stripe SetupIntent) nu este implementat — afișăm doar IBAN, fără opțiune "Adaugă card" (ar fi `disabled` cu badge "În curând" doar dacă userul cere ulterior).

### Withdraw Drawer (wizard)

Sheet din dreapta (mobile: full-screen), header cu progress dots (1-4) și buton Back.

- **STEP 1 — Sumă:** input mare cu sufix " RON", presetări (25%, 50%, 100%), buton "Retrage tot", hint "Disponibil: X RON". Validare: `min 50 RON, max availableBalance`.
- **STEP 2 — Metodă:** radio cu cardul IBAN existent (preselectat). CTA inline "Adaugă/schimbă IBAN" → deschide drawer secundar sau redirect către `/contul-meu`.
- **STEP 3 — Confirmare:** sumar (sumă, IBAN mascat, comision = 0 RON deocamdată, estimare 1-3 zile lucrătoare). Checkbox confirmare.
- **STEP 4 — Succes:** animație checkmark, copy "Retragerea a fost inițiată cu succes", două butoane: "Vezi cererea" / "Închide".

La submit: insert în `withdrawal_requests` (păstrăm logica existentă din `WithdrawalDialog`); IBAN-ul nu se mai re-salvează în profile (sursa rămâne `profiles`).

### Transactions Table

**Desktop (table):** Imagine produs (12px rounded), titlu, sumă (verde), tip (Închiriere finalizată / Avans blocat), dată, status badge, buton "Detalii" (icon ChevronRight).

**Mobile (cards):** stack vertical cu thumbnail + titlu + sumă + status + chevron, tap → drawer.

**Status badges:**
- Disponibil — emerald
- Blocat (în așteptare) — amber
- Retragere inițiată — blue
- Procesare — blue cu pulse
- Plătit — emerald solid
- Eșuat — destructive
- Anulat — slate

Filtre topbar: chips (Toate / Câștiguri / Retrageri) + select status + range dată (compact).

### Transaction Detail Drawer

Sheet cu: imagine produs mare, titlu, perioadă închiriere, chiriaș (link profil), breakdown financiar (sumă brută, comision platformă 5%, sumă netă), status, data disponibilizării, ID rezervare (`RNT-XXXXXX` cu copy), link "Vezi rezervarea" → `/rezervare/{public_id}`.

### Withdrawals Table + Payout Timeline

Sub Hero (dacă există cereri), card cu listă cereri. Fiecare rând expandabil dezvăluie `PayoutTimeline`: 4 pași (Cerută ✓ / Procesare ⏳ / Trimis către bancă / Finalizat). Dacă status `rejected`: motivul (`admin_note`) cu icon AlertCircle + CTA "Schimbă IBAN" / "Încearcă din nou".

### Realtime & micro-interactions

- `useWithdrawalsRealtime` — Supabase channel pe `withdrawal_requests` filter `user_id=eq.${user.id}`, invalidare React Query.
- `useRentalRealtime`-like pe `rentals` (filter owner_id) pentru update balanță live.
- Skeleton loaders pentru hero, breakdown și tabele.
- Framer-motion: fade+slide-in pe secțiuni la mount, count-up pe sumă, stagger pe pills.
- Toast confirmări la fiecare acțiune.

### Bilingv

Adaug toate stringurile noi în `src/data/uxCopy.ts` sub `wallet.*` (RO/EN).

### Out of scope (explicit)

Aceste cereri necesită backend nou și NU sunt incluse în acest redesign de UI; rămân ca task-uri viitoare separate:
- **OTP confirmare retragere** (necesită edge function + table tokens).
- **Blocare retragere dacă IBAN schimbat recent** (necesită `iban_changed_at` în profiles + trigger).
- **Audit log schimbare metodă retragere** (tabel nou).
- **Adăugare card bancar (Stripe Connect Express)** — model curent este IBAN manual aprobat de admin.
- **Email-uri tranzacționale noi** pentru `withdrawal initiated/processed/failed` — există deja templateuri `withdrawal-*` în `supabase/functions/_shared/transactional-email-templates/`; integrarea trigger-ului poate fi cerută separat.
- **Admin dashboard** — `AdminWithdrawals.tsx` rămâne neschimbat; redesign-ul este focusat pe userul final.

Vom semnaliza în UI fiecare zonă "În curând" relevantă, fără a falsifica funcționalitate.
