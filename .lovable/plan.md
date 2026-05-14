## Goal
Add explicit "change" and "delete" actions for the payout method (IBAN / cont bancar) in the user account, so users can replace or remove their saved bank account.

## Current state
- IBAN + Titular cont sunt salvate pe `profiles.iban` și `profiles.account_holder_name`.
- În `AccountTab.tsx → PayoutForm` există deja câmpurile editabile + butonul „Salvează IBAN" (efectiv „schimbă"), dar:
  - Când un IBAN e configurat, câmpul e mascat (`formatIbanMask`) și nu e clar cum îl schimbi.
  - Nu există acțiune de **ștergere**.
- `WithdrawalMethodCard` din /castiguri are doar buton „Editează" care duce la `/contul-meu?section=payout`.

## Changes (frontend only — `src/components/profile/AccountTab.tsx → PayoutForm`)

1. **Modul „card configurat" vs „edit"**
   - Când există IBAN salvat: afișăm un bloc read-only stilizat (icon Landmark, IBAN mascat `RO49 •••• •••• •••• 0000`, titular), cu două butoane:
     - „Schimbă" (Pencil) → trece formularul în mod editabil cu inputurile goale (forțează re-introducerea completă, nu pre-completate cu vechiul IBAN, ca să eviți modificarea accidentală a unei singure cifre).
     - „Șterge" (Trash, variant `outline` cu text destructive) → deschide un `AlertDialog` de confirmare.
   - Când nu există IBAN sau utilizatorul a apăsat „Schimbă": formularul actual cu IBAN + Titular + butoane „Salvează" și „Anulează" (revine la modul read-only fără modificări).

2. **Ștergere IBAN**
   - `AlertDialog` cu titlu „Șterge IBAN-ul?" și descriere care explică că nu vei mai putea solicita retrageri până la adăugarea altuia.
   - **Blocare**: înainte de delete, verifică dacă există `withdrawal_requests` cu `status='pending'` pentru user; dacă da, arată toast destructive „Ai o cerere de retragere în așteptare. Așteaptă procesarea ei înainte să ștergi IBAN-ul." și nu execută delete.
   - La confirmare: `update profiles set iban=null, account_holder_name=null where id=user`. Toast de succes „IBAN șters". Resetează state local și apelează `onSaved("", "")` ca să sincronizeze părintele.

3. **Validare la salvare** (mică îmbunătățire ca să fie consistent):
   - Trim + uppercase, regex `/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/`. Dacă invalid → toast destructive, fără update.

## Out of scope
- `WithdrawalMethodCard` din /castiguri rămâne neschimbat (deja link-uiește către secțiunea Payouts unde acum apar ambele acțiuni).
- Niciun edge function / migrație necesare — folosim RLS-ul existent pe `profiles` (`Users can update their own profile`).
- Nu atingem `WithdrawalDialog.tsx` (e flow-ul vechi, separat).