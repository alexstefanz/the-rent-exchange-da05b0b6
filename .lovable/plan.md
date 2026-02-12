

# Fix Resetare Parola - Detectare prin eveniment PASSWORD_RECOVERY

## Problema root cause

Cand utilizatorul da click pe linkul din email, Supabase:
1. Verifica token-ul la `/verify`
2. Redirectioneaza la URL-ul specificat cu token-urile in **hash fragment** (`#access_token=...&type=recovery`)
3. Supabase JS client preia token-urile si emite evenimentul `PASSWORD_RECOVERY` prin `onAuthStateChange`

Problema: codul actual se bazeaza pe `?reset=true` in URL, dar Supabase nu pastreaza mereu query params-urile in redirect. In plus, `useEffect` detecteaza `user` si redirectioneaza la `/` inainte sa se verifice `isResetMode`.

## Solutia

Inlocuim detectarea prin URL param cu detectarea prin evenimentul `PASSWORD_RECOVERY` din Supabase Auth -- aceasta este metoda standard si fiabila.

### 1. Modificare `src/contexts/AuthContext.tsx`
- Adaugam un state `isPasswordRecovery` care devine `true` cand `onAuthStateChange` primeste evenimentul `PASSWORD_RECOVERY`
- Exportam `isPasswordRecovery` si o functie `clearPasswordRecovery()` in context
- Cand evenimentul `PASSWORD_RECOVERY` e detectat, setam flag-ul fara sa mai depindem de URL

### 2. Modificare `src/pages/Auth.tsx`
- Inlocuim `isResetMode` (bazat pe URL param) cu `isPasswordRecovery` din AuthContext
- Cand formularul de resetare e trimis cu succes, apelam `clearPasswordRecovery()` pentru a curata starea
- Eliminam dependenta de `useSearchParams` pentru modul reset (pastram doar pentru alte utilizari)
- `useEffect` va verifica `isPasswordRecovery` in loc de `isResetMode` pentru a preveni redirect-ul la `/`

### Flow corect dupa fix

1. Utilizatorul cere resetare parola -> primeste email
2. Click pe "Reset Password" in email -> Supabase verifica token-ul
3. Supabase redirectioneaza la `/auth` cu hash fragments
4. Supabase JS client detecteaza token-urile, emite `PASSWORD_RECOVERY`
5. AuthContext seteaza `isPasswordRecovery = true`
6. Auth.tsx vede flag-ul si afiseaza formularul de resetare parola
7. Dupa succes -> `clearPasswordRecovery()`, sign out, redirect la login

## Fisiere modificate

| Fisier | Schimbare |
|--------|-----------|
| `src/contexts/AuthContext.tsx` | Adauga `isPasswordRecovery` state + `clearPasswordRecovery()` |
| `src/pages/Auth.tsx` | Foloseste `isPasswordRecovery` din context in loc de URL param |

