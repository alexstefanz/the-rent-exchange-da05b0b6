

## Plan: Sincronizare lungime cod OTP (8 cifre)

### Problema
Supabase Auth generează coduri OTP de **8 cifre**, dar UI-ul acceptă doar **6 cifre** — utilizatorul nu poate introduce codul complet.

### Soluție
Actualizăm UI-ul din ambele fișiere pentru a accepta **8 cifre** în loc de 6.

### Fișiere afectate

**1. `src/pages/Auth.tsx`**
- `maxLength={6}` → `maxLength={8}`
- Adăugare 2 sloturi OTP noi (index 6, 7)
- `otpCode.length !== 6` → `otpCode.length !== 8` (2 locuri)

**2. `src/components/checkout/LoginDialog.tsx`**
- `maxLength={6}` → `maxLength={8}`
- Adăugare 2 sloturi OTP noi (index 6, 7)
- `otpCode.length !== 6` → `otpCode.length !== 8` (2 locuri)

Sunt doar schimbări de numere și adăugare de 2 sloturi în fiecare fișier.

