

## Plan: Banner global "Refă KYC-ul" pentru utilizatorii cu KYC respins

### Scop
Utilizatorii al căror KYC a fost **respins** (`profiles.kyc_status = 'REJECTED'`) văd, sub header pe toate paginile publice, un row roșu cu mesaj scurt + buton CTA care duce direct la `/verificare` pentru reîncărcare documente.

### Comportament

- **Vizibil**: doar dacă `useKycGate().isRejected === true` (utilizator autentificat, status `REJECTED`)
- **Invizibil**: pentru toți ceilalți (neautentificați, `VERIFIED`, `PENDING`, `NOT_VERIFIED`, `IN_PROGRESS`)
- **Nu afișat** pe rutele admin (`/admin/*`) și pe pagina `/verificare` însăși (evităm redundanța — utilizatorul e deja acolo)
- **Dismiss session-only**: buton X care ascunde row-ul în `sessionStorage` (`kyc_rejected_dismissed`); reapare la următoarea sesiune dacă statusul e tot `REJECTED`

### Design vizual

```text
┌──────────────────────────────────────────────────────────────────────┐
│ ⚠  Verificarea identității a fost respinsă.   [Refă KYC-ul →]   [X] │
└──────────────────────────────────────────────────────────────────────┘
```

- Background: `bg-destructive/10`
- Bordură jos: `border-b border-destructive/30`
- Iconiță: `ShieldAlert` în roșu (`text-destructive`)
- Buton CTA: `variant="default"` (gradient portocaliu existent), `size="sm"`, link `/verificare`
- Text bilingv RO/EN prin `useLanguage()`
- Sticky sub header sau în flux normal — în flux normal (mai puțin agresiv); apare deasupra conținutului paginii, sub `<Navbar>`

### Implementare

**Fișier nou**: `src/components/kyc/KycRejectedBanner.tsx`
- Folosește `useKycGate()` + `useLocation()` pentru a decide vizibilitatea
- Returnează `null` dacă: `!isRejected`, ruta începe cu `/admin` sau `/verificare`, sau e dismissed în session
- Card row simplu, full-width, responsive (CTA + X grupate la dreapta pe desktop, stivuite pe mobil)

**Modificare**: `src/App.tsx`
- Adaug `<KycRejectedBanner />` imediat după `<ScrollToTop />`, în interiorul `<Suspense>` (lazy import)
- Astfel apare pe toate rutele care includ `<Navbar>` (banner-ul stă în flux deasupra rutei, iar Navbar-ul fiecărei pagini rămâne sus — ordinea în DOM va fi: Navbar (din pagină) → banner (din App.tsx, dar randat înainte de `<Routes>`)

**Atenție la ordinea DOM**: `<Navbar>` este intern paginilor (nu în `App.tsx`). Pentru a apărea **sub** header, banner-ul trebuie să fie randat fie:
- (A) în interiorul fiecărui layout — prea invaziv
- (B) **fixat în top via CSS** cu `position: sticky; top: <navbar-height>` — fragil
- (C) **integrat în `<Navbar>`** — soluția cea mai curată

Aleg **opțiunea C**: adaug `<KycRejectedBanner />` în interiorul `Navbar.tsx`, randat imediat sub elementul `<header>` (în același return JSX). Avantaje: apare automat pe toate paginile care folosesc `Navbar`, nu apare în admin (care folosește `AdminLayout`), și e poziționat exact unde trebuie.

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/components/kyc/KycRejectedBanner.tsx` | **NOU** — componentă banner cu hook KYC + dismiss session |
| `src/components/layout/Navbar.tsx` | Import + render `<KycRejectedBanner />` imediat sub `</header>` |

### Limitări recunoscute

- **Doar utilizatori autentificați** — un user neautentificat nu poate fi `REJECTED`, deci nu apare
- **Nu apare în admin panel** (folosește `AdminLayout`, nu `Navbar`) — corect, adminii nu trebuie să vadă propriul banner
- **Nu apare pe `/verificare`** (utilizatorul e deja acolo, ar fi redundant)
- **Dismiss e per-sesiune browser** — nu salvăm în DB; la deschidere nouă reapare dacă statusul e tot `REJECTED`
- Mesajul de respingere detaliat (`rejection_reason`) NU e inclus în banner pentru a păstra row-ul scurt; utilizatorul îl vede pe pagina `/verificare`

