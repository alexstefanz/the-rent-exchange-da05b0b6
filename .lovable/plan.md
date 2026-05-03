## Goal
Adaugă o secțiune dedicată **Retrageri** în Admin ERP (separată de pagina Financiar), cu detalii complete pentru fiecare cerere: profil utilizator, IBAN, identitate KYC.

## 1. Rută & navigație
- Adaugă ruta `/admin/withdrawals` în `src/App.tsx` (lazy import `AdminWithdrawals`).
- În `src/components/admin/AdminSidebar.tsx`:
  - Inserez nou item "Retrageri" (icon `Banknote`) cu badgeKey `pending_withdrawals`, plasat sub "Financiar".
  - Mut badgeKey-ul `pending_withdrawals` de pe "Financiar" pe noul item (Financiar rămâne fără badge).
- În `src/pages/admin/AdminFinances.tsx`: scot tab-ul "Retrageri" și componenta `WithdrawalsAdminTab` (rămâne doar Tranzacții/sumare). Logica se mută în pagina nouă.

## 2. Pagină nouă `src/pages/admin/AdminWithdrawals.tsx`

Layout: `AdminLayout` cu:

### Header & KPI
- 4 carduri (StatsCard): În așteptare (count + sumă), Aprobate (sumă), Finalizate luna curentă (sumă), Respinse luna curentă.

### Filtre
- Tab-uri status: Toate / În așteptare / Aprobate / Finalizate / Respinse.
- Search după nume/email/IBAN.
- Sort: dată (default desc), sumă.

### Tabel principal (responsiv)
Coloane: data, utilizator (avatar+nume+email), sumă, IBAN (mascat: `RO** **** **** **** **** 1234`, click → reveal), status (badge cu paleta proiectului), KYC status (badge color-coded), acțiuni rapide (Aprobă/Respinge/Marchează transferat), buton "Detalii" → expand.

### Panel "Detalii cerere" (expand inline / Sheet)
Trei secțiuni:

1. **Profil utilizator**
   - Avatar, nume, email, telefon, dată înregistrare.
   - Buton "Vezi profil complet" → `/admin/users/:id`.
   - Statistici rapide: nr. produse, nr. rezervări (înch+închiriate), balanță curentă, total retras până acum.

2. **Cont bancar**
   - IBAN complet (cu buton copy).
   - Titular cont (`account_holder`).
   - Compară `account_holder` cu `full_name` din profil → afișează ⚠️ dacă diferă.
   - Listă "Retrageri anterioare" (ultimele 10) cu status & dată.

3. **Identitate KYC**
   - Status KYC (badge), nivel, dată ultima verificare.
   - Dacă există case KYC: cod public (KYC-XXXXXX), buton "Vezi caz KYC" → `/admin/kyc/:caseId`.
   - Galerie miniaturi documente (ID_FRONT, ID_BACK, SELFIE, PROOF_OF_ADDRESS) cu signed URLs (`fetchKycDocuments`); click → lightbox/preview.
   - Dacă utilizatorul nu e verificat → banner roșu "Utilizator NEVERIFIAT — recomandăm respingere până la KYC".

### Acțiuni
- Aprobă (`status=approved` + `processed_at`)
- Respinge (cu notă obligatorie)
- Marchează ca transferat (`status=completed`) → creează automat rând în `transactions` (type `withdrawal`)
- Toate acțiunile: confirm dialog + toast + invalidare query.

## 3. API helper nou `src/features/admin/withdrawalsApi.ts`
Funcții:
- `fetchWithdrawals(filters)` — `withdrawal_requests` cu join manual la `profiles` (id, full_name, email, phone, avatar_url, kyc_status, kyc_level, kyc_last_verified_at).
- `fetchWithdrawalContext(userId)` — agregare: total retras (sum completed), balanță (existing logic), produse count, rentals count, ultimul KYC case (`kyc_cases` ordered by `created_at` desc) + documente.
- `updateWithdrawalStatus(id, status, note?)`.
- `markWithdrawalCompleted(id)` — update + insert `transactions`.

## 4. Detalii tehnice
- KYC docs: refolosesc `fetchKycDocuments` din `kycApi.ts` (semnează URL-urile pentru bucketul privat `kyc-documents`).
- Mascarea IBAN: helper local `maskIban(iban)`.
- Culori status retragere reutilizate din convenția existentă: pending=galben, approved=albastru, completed=verde, rejected=roșu.
- React Query keys: `['adminWithdrawals', filter]`, `['withdrawalContext', userId]`.

## 5. Out of scope
- Nicio schimbare de schemă DB (RLS și coloane existente acoperă tot).
- Nu modific paginile KYC sau Users existente.
