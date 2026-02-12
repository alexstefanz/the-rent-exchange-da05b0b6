

# Formular Resetare Parola

## Problema
Cand utilizatorul da click pe "Reset Password" din email, este redirectionat la `/auth?reset=true`. Insa pagina Auth.tsx nu detecteaza parametrul `reset=true` si afiseaza formularul de login in loc de un formular de resetare parola.

## Solutia

### 1. Detectare mod resetare in `src/pages/Auth.tsx`
- Citeste parametrul `?reset=true` din URL folosind `useSearchParams`
- Cand `reset=true` este prezent, afiseaza un formular dedicat de resetare parola **in loc de** tab-urile login/register
- Formularul contine: "Parola noua" + "Confirma parola noua" + buton "Reseteaza parola"
- Validare zod: minim 6 caractere, parolele trebuie sa se potriveasca

### 2. Logica de resetare
- Foloseste `supabase.auth.updateUser({ password: newPassword })` pentru a seta noua parola
- Dupa succes, afiseaza toast de confirmare si redirectioneaza la pagina de login (stergand parametrul `reset` din URL)

### 3. Email de confirmare dupa resetare
- Creez o noua edge function `send-password-changed-notification` care trimite un email de confirmare ca parola a fost schimbata
- Template-ul va folosi acelasi design modern (verde `#3DB86A`, card, buton)
- Emailul va include: mesaj de confirmare, data/ora schimbarii, si buton "Acceseaza contul" catre `/auth`
- Functia este apelata din Auth.tsx dupa `updateUser` reusit, pasand emailul utilizatorului

### 4. Adaugare copy UX in `src/data/uxCopy.ts`
- Adaug texte noi: `newPassword`, `confirmNewPassword`, `resetSuccess`, `resetSuccessDesc`, `resettingPassword`, `passwordChanged`

## Fisiere modificate

| Fisier | Schimbare |
|--------|-----------|
| `src/pages/Auth.tsx` | Detectare `?reset=true`, formular resetare, apel edge function |
| `src/data/uxCopy.ts` | Texte noi pentru formularul de resetare |
| `supabase/functions/send-password-changed-notification/index.ts` | Edge function noua pentru email confirmare |

## Flow complet

1. Utilizatorul cere resetare parola -> primeste email
2. Click "Reset Password" in email -> ajunge pe `/auth?reset=true`
3. Vede formularul cu "Parola noua" + "Confirma parola"
4. Completeaza si trimite -> parola se actualizeaza
5. Primeste email de confirmare ca parola s-a schimbat
6. Este redirectionat la formularul de login

