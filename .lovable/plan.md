## Obiectiv
Utilizatorul poate adăuga maxim **3 IBAN-uri** în secțiunea „Cum primești banii". Toate trebuie să fie pe **același nume și prenume** = `profiles.full_name`. Unul este marcat „Implicit" și se folosește automat la retrageri / payout.

## Backend (migration nouă)

**Tabelă nouă `public.payout_ibans`**
- `id uuid pk`, `user_id uuid not null`, `iban text not null`, `account_holder_name text not null`, `is_default boolean not null default false`, `created_at timestamptz default now()`.
- `UNIQUE (user_id, iban)` (anti-duplicat).
- GRANT SELECT/INSERT/UPDATE/DELETE pentru `authenticated`; GRANT ALL pentru `service_role` (fără anon).
- RLS deny-by-default: policies pentru SELECT/INSERT/DELETE doar pe `auth.uid() = user_id`. UPDATE doar pentru câmpul `is_default` (policy cu USING + WITH CHECK pe owner).

**Trigger `enforce_payout_ibans_rules` (BEFORE INSERT/UPDATE)**
- Refuză dacă utilizatorul are deja 3 rânduri (la INSERT).
- Forțează `account_holder_name` = `trim(profiles.full_name)` (lookup); refuză dacă `full_name` e gol.
- Validează formatul (regex RO + mod-97, prin re-folosirea logicii deja existente în SQL sau un check rapid de format `^RO\d{2}[A-Z0-9]{20}$`).

**Trigger `sync_default_payout_iban` (AFTER INSERT/UPDATE)**
- Dacă noul rând e `is_default = true`, resetează `is_default = false` la celelalte rânduri ale aceluiași user.
- Dacă utilizatorul nu are niciun default după operație, marchează cel mai vechi ca default.
- Sincronizează `profiles.iban` și `profiles.account_holder_name` cu IBAN-ul implicit (păstrăm compatibilitatea cu withdrawals + edge functions existente).

**Backfill**
- Pentru fiecare profil cu `iban` setat, inserează un rând în `payout_ibans` (default `true`) dacă nu există deja.

**Funcție RPC `delete_payout_iban(p_id uuid)` (SECURITY DEFINER)**
- Refuză dacă există `withdrawals` în stare `pending` pentru `user_id` care folosește exact acel IBAN.
- Șterge rândul; dacă era default, triggerul promovează altul.

## Frontend

**`src/components/profile/AccountTab.tsx` — secțiunea Payout**
- Înlocuiesc `PayoutForm` cu un component `PayoutIbansSection` care:
  - Listează IBAN-urile existente ca **carduri** (același design ca în screenshot: icon, label „IBAN" + badge „Implicit", IBAN mascat, nume titular).
  - Fiecare card: buton „Setează implicit" (dacă nu e), „Șterge" (cu confirm; blocat dacă pending withdrawal).
  - Buton „**Adaugă alt IBAN**" vizibil doar dacă `count < 3`. La click deschide un mic form inline cu input IBAN; titularul e read-only = `profile.full_name` (afișat ca text explicativ: „Titular: Alex Test — trebuie să fie același nume pe toate IBAN-urile").
  - La salvare: insert în `payout_ibans` (primul devine automat default).
  - Banner-ul „IBAN configurat" rămâne dacă există cel puțin un IBAN.
  - Mesajul de securitate „IBAN-ul e blocat pentru schimbare" rămâne, dar reformulat: schimbarea titularului se face doar prin suport; IBAN-urile pot fi adăugate/eliminate liber.

**`src/components/earnings/WithdrawDrawer.tsx` + `src/hooks/useEarnings.ts`**
- `useEarnings` returnează lista de `payout_ibans` în loc de un singur `method`.
- WithdrawDrawer: dacă există mai multe IBAN-uri, afișează un select („Trimite în contul…") cu opțiunile mascate; preselectează cel default. La submit trimite IBAN-ul selectat în `withdrawal_requests` (același flux).

**`src/components/earnings/WithdrawalMethodCard.tsx`**
- Adaptat să afișeze lista (sau redirect către secțiunea Payout din AccountTab dacă rămâne ca shortcut).

## În afara scope-ului
- Tabela `withdrawals` nu se modifică — stochează în continuare IBAN-ul ca string copiat la momentul cererii.
- Edge functions de payout/email rămân neschimbate (citesc tot din `profiles.iban` / din `withdrawals.iban`).
- Nu se modifică UI-ul admin pentru withdrawals.

## Detalii tehnice
- Validare IBAN: re-folosim `isValidRomanianIban` din `src/lib/ibanValidation.ts` în client; trigger-ul SQL face doar verificare de format.
- Comparația „același nume" e case-insensitive pe `trim()`. Triggerul forțează valoarea din `profiles.full_name`, deci utilizatorul nu poate tasta alt nume — câmpul e ascuns/read-only în UI.
- Toate operațiunile de scriere se fac din client cu Supabase JS (RLS + triggers asigură integritatea); ștergerea folosește RPC pentru verificarea pending-withdrawal cu privilegii ridicate.
