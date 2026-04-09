

## Plan: Sistem de retragere manuală (cerere + transfer bancar)

### Cum funcționează

1. Proprietarul adaugă IBAN-ul în profilul său (câmp nou pe profil)
2. Din pagina de Câștiguri, apasă butonul **„Retrage"**
3. Introduce suma dorită (validare: nu poate depăși balanța disponibilă)
4. Se creează o cerere de retragere (withdrawal request) în baza de date
5. Adminul vede cererile în panoul financiar, le aprobă/respinge
6. La aprobare, adminul face transferul bancar manual și marchează cererea ca „completată"
7. Balanța proprietarului se actualizează automat (deja funcționează: `owner_payout - withdrawal`)

### Modificări necesare

**1. Migrare DB — Tabel nou `withdrawal_requests`**
```sql
CREATE TABLE withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  iban text NOT NULL,
  account_holder text,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, completed, rejected
  admin_note text,
  processed_by uuid,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);
```
+ RLS: utilizatorii văd doar propriile cereri, adminii văd tot și pot actualiza

**2. Migrare DB — Câmp IBAN pe profil**
```sql
ALTER TABLE profiles ADD COLUMN iban text;
ALTER TABLE profiles ADD COLUMN account_holder_name text;
```

**3. `src/components/profile/EarningsTab.tsx`** — Adaug buton „Retrage bani" + dialog cu formular (sumă, IBAN pre-populat din profil). Afișez și lista cererilor de retragere anterioare cu statusul lor.

**4. `src/components/profile/AccountTab.tsx`** — Adaug câmpuri IBAN și titular cont în secțiunea de detalii cont.

**5. `src/pages/admin/AdminFinances.tsx`** — Tab nou „Retrageri" cu lista cererilor de retragere. Adminul poate aproba/respinge. La aprobare, se creează automat o tranzacție de tip `withdrawal` în tabela `transactions`.

### Fișiere afectate
- `supabase/migrations/` — 1 migrare (tabel + câmpuri profil + RLS)
- `src/components/profile/EarningsTab.tsx` — buton retragere + dialog + istoric
- `src/components/profile/AccountTab.tsx` — câmpuri IBAN
- `src/pages/admin/AdminFinances.tsx` — tab retrageri admin

