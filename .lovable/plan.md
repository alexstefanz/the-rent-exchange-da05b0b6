
# Refactor onboarding Persoană Juridică

Trecem de la formularul actual (un singur card cu toate câmpurile) la un flow progresiv în 3 pași, cu autofill CUI din ANAF și KYC amânat până la prima retragere.

## Flow nou

```text
[1] Cont rapid  →  [2] Verificare email  →  [3] Setup companie  →  Dashboard
   ~30s              OTP 8 cifre              cu autofill CUI
```

Progres vizual (stepper) prezent pe toate ecranele: `Cont · Verificare · Firmă · Gata`.

### Pas 1 — Cont rapid (`/auth?tab=register`)
- Toggle premium: **Persoană fizică / Companie** (segmented control, accent orange)
- Câmpuri: Email, Parolă (cu indicator de putere), checkbox Termeni + GDPR
- CTA principal „Continuă” + „Continuă cu Google” / „Continuă cu Apple”
- Link „Ai deja cont? Autentifică-te”
- **Nu cerem** CUI, denumire firmă, IBAN, adresă — doar contul

### Pas 2 — Verificare email
Reutilizăm ecranul OTP existent (cod 8 cifre), îl restilăm cu noul stepper și microcopy nou:
- „Am trimis un cod pe email. Verifică inbox-ul în câteva secunde.”
- Resend cu countdown 60s

### Pas 3 — Setup companie (`/onboarding/business`)
Pagină nouă, accesibilă doar pentru utilizatori autentificați cu `account_type = business` și `company_name` lipsă.

**Secțiunea A — CUI (focus automat)**
- Input mare, `inputMode="numeric"`, acceptă `RO12345678` sau `12345678`
- Debounce 600ms → apel `lookup-cui` edge function → ANAF v9
- Stări vizuale:
  - Loading: skeleton + spinner discret („Căutăm firma în ANAF…")
  - Success: card verde `✅ Firma verificată în Registrul Comerțului` cu denumire + adresă auto-completate
  - Inactivă: warning galben `⚠️ Firmă inactivă fiscal`
  - Eroare: `❌ CUI invalid sau firmă inexistentă`

**Secțiunea B — Câmpuri auto-completate (read-only by default, editabile via „Editează”)**
- Denumire companie
- Nr. Registrul Comerțului
- Adresă sediu social
- Status TVA (badge)

**Secțiunea C — Date de contact (manuale)**
- Persoană de contact (înlocuiește „Nume complet”)
- Telefon (cu prefix +40)
- IBAN (validare format RO)
- Email facturare (opțional)

**Trust strip jos:**
`✅ Protecție tranzacții` · `✅ Wallet business` · `✅ Facturi pentru companii` · `✅ Suport dedicat`

Microcopy KYC: *„Verificarea identității va fi necesară doar înainte de prima retragere.”*

CTA sticky pe mobil: „Finalizează setup”.

## UX / UI

- Carduri soft, `rounded-2xl`, shadow subtilă, spacing generos
- Inputuri `h-12` pe mobil, label deasupra, helper text dedesubt
- Pe mobil: toate câmpurile **stacked vertical** (inclusiv CUI + Reg. Com.)
- Micro-animații: fade-in la autofill, success checkmark animat
- Accent #F59E0B doar pe CTA și status success
- Stepper sticky top pe mobil, inline pe desktop

## Componente noi

- `src/components/onboarding/OnboardingStepper.tsx` — progres vizual 4 pași
- `src/components/onboarding/AccountTypeToggle.tsx` — segmented control PF/PJ
- `src/components/onboarding/CuiLookupField.tsx` — input CUI + stări (loading/success/error/inactive)
- `src/components/onboarding/CompanyAutofillCard.tsx` — afișează datele găsite, editabil
- `src/components/onboarding/TrustStrip.tsx` — bară 4 beneficii
- `src/pages/BusinessOnboarding.tsx` — pagina Pas 3
- `src/lib/ibanValidation.ts` — checksum mod-97 pentru IBAN RO

## Modificări existente

- `src/pages/Auth.tsx`: simplificare formular register — scoatem complet câmpurile companie (CUI, denumire, regCom). Păstrăm doar Email + Parolă + toggle tip cont. Adăugăm stepper.
- După verificare OTP: dacă `account_type === "business"` și nu există `company_name` → redirect la `/onboarding/business`, altfel `/`.
- `src/App.tsx`: route nou `/onboarding/business`
- `src/data/uxCopy.ts`: chei noi pentru onboarding PJ (RO + EN)

## Backend (edge function nouă)

`supabase/functions/lookup-cui/index.ts`:
- Input: `{ cui: string }`
- Curăță prefixul „RO”, validează 2-10 cifre
- Apel POST către `https://webservicesp.anaf.ro/PlatitorTvaRest/api/v9/ws/tva` cu `[{ cui, data: "YYYY-MM-DD" }]`
- Returnează `{ found, denumire, adresa, nrRegCom, scpTVA, statusInactivi }`
- Rate limit per IP (10/min), CORS, validare Zod
- `verify_jwt = true` (default) — doar useri autentificați pot căuta

Nu sunt necesare migrații DB — coloanele `company_name`, `cui`, `reg_com`, `company_address`, `account_type` există deja în `profiles`.

## Sugestii pentru creșterea conversiei

1. **Skip & complete later**: în Pas 3, buton secundar „Completez mai târziu” → salvează doar `account_type=business`, permite browse dar blochează publicare anunț până completează
2. **Social login PJ**: același Google/Apple acceptat pentru companii — reduce frecarea
3. **Auto-save draft** la fiecare câmp (debounce 1s) pentru a evita pierderea progresului
4. **Progress percentage**: „60% complet — încă 2 câmpuri”
5. **Pre-fill din Google profile** pentru persoana de contact + email
6. **Single-CTA per ecran** — niciodată două butoane primare în viewport

## Notă tehnică

ANAF API e public, fără cheie, dar cu rate limit ~1 req/sec per IP. Edge function va cache-ui răspunsurile 24h într-o tabelă mică `anaf_cache (cui, data jsonb, fetched_at)` pentru a evita blocările. Adăugăm migrația în implementare.
