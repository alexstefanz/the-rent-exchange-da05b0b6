

## Plan: Dezactivare cont cu confirmare prin email

### Flux
1. User click "Dezactivează contul" → apare dialog de confirmare (existent deja)
2. User confirmă → se apelează un edge function care generează un token unic de dezactivare, îl salvează în DB și trimite un email cu link de confirmare
3. User click link din email → se deschide o pagină `/dezactivare-cont?token=...` care apelează alt edge function pentru a dezactiva efectiv contul (setează `is_deactivated = true`, face sign out)

### Modificări

**1. Migrare DB** — adăugăm coloane pe `profiles`:
- `is_deactivated boolean DEFAULT false`
- `deactivation_token text`
- `deactivation_token_expires_at timestamptz`

**2. Edge function `request-account-deactivation`**:
- Primește user ID din JWT
- Generează token random, salvează în profiles cu expirare 24h
- Trimite email cu Resend (RESEND_API_KEY existent) conținând link de confirmare
- Returnează success

**3. Edge function `confirm-account-deactivation`**:
- Primește token din query
- Verifică token valid + neexpirat
- Setează `is_deactivated = true`, golește tokenul
- Face invalidarea sesiunii prin admin API (sau user-ul va fi blocat la login)

**4. Pagină `/dezactivare-cont`** — `src/pages/DeactivateAccount.tsx`:
- Citește token din URL
- Apelează edge function-ul de confirmare
- Afișează mesaj de succes/eroare

**5. Modificări `AccountTab.tsx`**:
- `handleDeactivateAccount` apelează edge function-ul `request-account-deactivation`
- Afișează toast de succes: "Verifică-ți emailul pentru a confirma dezactivarea"
- Update dialog text: menționează că va primi email de confirmare

**6. Blocare login** — modificare `AuthContext.tsx`:
- După login, verifică `is_deactivated` pe profil
- Dacă `true`, face sign out și afișează mesaj

**7. Rută nouă în `App.tsx`**: `/dezactivare-cont`

### Fișiere afectate
- **Migrare SQL**: coloane noi pe `profiles`
- **Creat**: `supabase/functions/request-account-deactivation/index.ts`, `supabase/functions/confirm-account-deactivation/index.ts`, `src/pages/DeactivateAccount.tsx`
- **Modificat**: `AccountTab.tsx`, `AuthContext.tsx`, `App.tsx`

