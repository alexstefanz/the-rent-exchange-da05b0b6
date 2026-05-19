## Footer restructure

Update `src/components/layout/Footer.tsx` from current 4-column grid (logo + Quicklinks + Support + Publish) to a 5-column grid: **logo/social block + 4 link columns** matching the attached Excel image.

Keep unchanged: logo, description text, Facebook/Instagram/TikTok social icons, copyright row at the bottom.

### New column structure

**Col 1 — Logo + description + social** (as today)

**Col 2 — Companie**
- Despre noi → `/despre-noi`
- Contactează-ne → `https://rentli.ro/contact`
- CSR - Economie circulară → `/despre-noi` *(no dedicated page exists; reuse About; will flag for user)*

**Col 3 — Utile**
- Vezi toate categoriile → `/categorii`
- Caută produse → `/cauta`
- Publică un anunț → `/adauga-anunt`

**Col 4 — Contul tău** (auth-aware — when logged out, only show "Intră în cont"; when logged in, show the rest)
- Intră în cont / Înregistrează-te → `/auth`
- Chat → `/mesaje`
- Anunțurile mele → `/anunturile-mele` (route: `/anunțuri` per ListingsPage; will verify exact path)
- Închirieri → `/inchirieri`
- Rezervări → `/rezervari`
- Favorite → `/favorite`
- Adaugă un anunț → `/adauga-anunt`
- Verificare eKYC → `/verificare-kyc`
- Suport & Tickete → `/tichetele-mele`

**Col 5 — Suport clienți**
- Cum funcționează → `/cum-functioneaza`
- Întrebări frecvente → `/intrebari-frecvente`
- Centru de ajutor → `/centru-asistenta`
- Termeni și condiții → `/termeni-si-conditii`
- Politica de confidențialitate → `/politica-confidentialitate`
- Politica de anulare → `/politica-anulare`
- Politica de cookies → `/politica-cookies`
- Sfaturi de securitate → `/centru-asistenta` *(no dedicated page; will flag)*
- GDPR → `/politica-confidentialitate` *(no dedicated page; will flag)*
- Electronic Know Your Customer (eKYC) → `/verificare-kyc`
- RentProtect - Închiriere sigură → `/cum-functioneaza` *(no dedicated page; will flag)*
- ANPC → `https://anpc.ro` (external)

### Layout

- Grid: `md:grid-cols-2 lg:grid-cols-5`, gap-8
- Logo column spans 1 (or full row on mobile)
- All link columns: `space-y-2 text-sm text-muted-foreground` (same styling as today)
- All RO labels also wired through `useLanguage` for EN fallback (mirror existing pattern: RO default, EN inline ternary)
- Copyright row preserved as-is

### Open items to confirm before coding

1. **Missing pages** — "CSR - Economie circulară", "Sfaturi de securitate", "GDPR", "RentProtect" don't have dedicated routes. Should I (a) point them to the closest existing page as above, (b) omit them, or (c) create placeholder pages?
2. **"Contul tău" column when logged out** — show all links anyway (clicking redirects to `/auth`), or only show "Intră în cont"?
3. **ANPC** — link to https://anpc.ro or to the SAL/SOL pages (https://anpc.ro/ce-este-sal/ and https://ec.europa.eu/consumers/odr)?

### Technical notes

- Only `src/components/layout/Footer.tsx` is touched.
- No new routes, no business logic changes — pure presentation.
- EN translations added inline (same pattern as the existing "About Us / Despre Noi").
