

## Plan: Validare parolă custom + mesaj generic la eșec login

### Cerințe
- **Parolă**: minim 8 caractere, cel puțin o literă mare, o literă mică, și (o cifră SAU un simbol)
- **Mesaj eroare unitar**: "Email sau parolă incorecte" — afișat identic pentru:
  - Login eșuat (credențiale greșite)
  - Login eșuat din alte motive (cont neconfirmat, dezactivat etc. — generic, fără să dezvăluim detalii)
  - Signup eșuat din motive ce țin de parolă (HIBP, weak)
- **HIBP rămâne activ** în backend (Supabase blochează parolele compromise public)

### Arhitectură schimbări

#### 1. `src/lib/passwordValidation.ts` (nou)
Funcție Zod refinată reutilizabilă:
```ts
export const strongPasswordSchema = z.string()
  .min(8, "Parola trebuie să aibă minim 8 caractere")
  .refine(v => /[a-z]/.test(v), "Trebuie să conțină o literă mică")
  .refine(v => /[A-Z]/.test(v), "Trebuie să conțină o literă mare")
  .refine(v => /[0-9]/.test(v) || /[^A-Za-z0-9]/.test(v), "Trebuie să conțină o cifră sau un simbol");
```
Helper bonus: `getPasswordStrengthHints()` — returnează array de cerințe nerespectate, pentru afișare live sub câmp.

#### 2. `src/data/uxCopy.ts`
Adaug chei noi (RO/EN):
- `passwordRequirements`: "Min. 8 caractere, o literă mare, o literă mică și o cifră sau simbol"
- `passwordTooWeak`: "Parola este prea slabă. Folosește minim 8 caractere, o literă mare, o literă mică și o cifră sau simbol."
- Modific `invalidCredentials` → "Email sau parolă incorecte" (este deja aproape — ajustez plural)

#### 3. `src/pages/Auth.tsx`
- Înlocuiesc `z.string().min(6, copy.auth.passwordMin)` cu `strongPasswordSchema` în:
  - `loginSchema.password` → **doar** `.min(1)` (nu validăm lungimea la login, doar non-empty — altfel divulgăm regulile)
  - `registerSchema.password` → schema completă
  - `resetPasswordSchema.newPassword` → schema completă
- **Helper text** sub câmpul parolă la register + reset: afișez `copy.auth.passwordRequirements`
- **handleLogin**: indiferent de tipul erorii Supabase, afișez **întotdeauna** `copy.auth.invalidCredentials` ("Email sau parolă incorecte"). Excepție: erori de rețea (status 0/500) — afișăm "Eroare de conexiune".
- **handleRegister**: dacă Supabase returnează eroare cu mesaj "weak", "pwned", "compromised", "easy to guess" → afișez `copy.auth.passwordTooWeak`. Restul rămân cu mesajele existente (`accountExists` etc.).

#### 4. `src/components/checkout/LoginDialog.tsx`
- Aceleași modificări ca Auth.tsx pentru consistență:
  - Validare strong password la signup
  - Mesaj generic "Email sau parolă incorecte" la eșec signin (înlocuiește detection-ul curent pe "Invalid login")
  - Detect mesaje weak password la signup → afișez "Parolă prea slabă"
- Adaug helper text sub câmpul parolă la modul signup

### Diagrama fluxului mesajelor de eroare

```text
Login fail (orice motiv auth)  ─→ "Email sau parolă incorecte"
Network error                  ─→ "Eroare de conexiune"

Signup: validare client (zod)  ─→ inline sub field (regula specifică)
Signup: HIBP / weak password   ─→ "Parolă prea slabă..."
Signup: email duplicat         ─→ "Un cont cu acest email există deja"
Signup: alt error              ─→ mesaj original
```

### Securitate / UX
- **Nu divulgăm** dacă emailul există (login) — mesaj identic indiferent de cauza eșecului
- **Validare client-side** previne 90% din încercările cu parole slabe înainte de a atinge backend-ul
- **HIBP server-side** rămâne ca al doilea strat — pentru parolele care trec validarea custom dar sunt în breach-uri publice
- Helper text vizibil → utilizatorul știe regula înainte de a tasta, nu primește erori surpriză

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/lib/passwordValidation.ts` | NOU — schema Zod + helper |
| `src/data/uxCopy.ts` | adaug `passwordRequirements`, `passwordTooWeak`, ajustez `invalidCredentials` |
| `src/pages/Auth.tsx` | folosesc strong schema la register/reset, mesaj generic la login, helper text |
| `src/components/checkout/LoginDialog.tsx` | aceleași schimbări (consistență) |

### Limitări recunoscute
- HIBP rămâne activ → unele parole care respectă regula custom vor fi totuși respinse de backend (cu mesajul nostru "Parolă prea slabă")
- Nu modificăm config Supabase Auth (păstrăm min 6 default-ul backendului — validarea noastră este mai strictă pe client/UX, deci backend-ul nu va respinge niciodată o parolă care a trecut de noi pe motiv de lungime)
- Mesajul generic la login NU va distinge contul dezactivat de parola greșită — pentru conturile dezactivate avem deja flow separat (alert după login reușit care invalidează sesiunea)

