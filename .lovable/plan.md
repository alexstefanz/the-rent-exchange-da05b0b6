# Rezolvare branding verification issues Google OAuth

## Probleme identificate

Ecranul „Branding verification issues" din Google Cloud Console arată două blocaje:

1. **Homepage URL not registered** — `https://www.rentli.ro` nu este înregistrat la tine în Google Search Console.
2. **Privacy policy insufficient content** — pagina `https://www.rentli.ro/politica-de-confidentialitate` nu are suficient conținut.

## Discrepanță de URL descoperită

În aplicație ruta reală este `/politica-confidentialitate` (fără "de"). Toate linkurile interne și sitemap-ul folosesc acest URL. Google citează însă `/politica-de-confidentialitate`, ceea ce înseamnă că așa ai trecut link-ul în OAuth consent screen. Vom corecta asta în două feluri: adăugăm un redirect de la `/politica-de-confidentialitate` către `/politica-confidentialitate` și/sau actualizăm linkul din Google Cloud, plus extindem conținutul paginii.

## Ce trebuie făcut

### 1. Verificare ownership `www.rentli.ro` în Google Search Console

- Dacă nu ai încă proprietatea `https://www.rentli.ro/` în Search Console, trebuie s-o adaugi și s-o verifici.
- Metoda cea mai rapidă: verificare prin tag HTML sau prin DNS TXT (dacă ai acces la DNS).
- După verificare, Google Cloud va recunoaște ownership-ul pentru homepage URL.

### 2. Extinderea paginii de confidențialitate

Vom adăuga secțiuni suplimentare în `src/pages/legal/PrivacyPolicy.tsx` pentru a satisface cerințele Google:

- **Introducere detaliată** — cine este operatorul de date, datele de contact DPO/suport.
- **Ce date colectăm** — extins cu exemple concrete: nume, e-mail, telefon, adresă, IP, cookie-uri, date plată, date bunuri.
- **Scopurile prelucrării** — furnizare servicii, verificare identitate, plăți, asistență, marketing (doar cu consimțământ), securitate, conformitate legală.
- **Baza legală** — contract, consimțământ, obligație legală, interese legitime.
- **Destinatari / partajare** — procesatori de plăți, servicii IT, autorități, alți utilizatori doar în măsura necesară închirierii.
- **Transferuri internaționale** — mențiune că unii furnizori pot fi în afara UE și că sunt asigurate garanții.
- **Perioada de stocare** — perioade concrete sau criterii de determinare.
- **Drepturile utilizatorilor** — acces, rectificare, ștergere, portabilitate, opoziție, retragere consimțământ, reclamație la ANSPDCP.
- **Cookie-uri și tehnologii de tracking** — trimitere către Politica de cookies.
- **Securitate** — măsuri tehnice și organizatorice.
- **Modificări ale politicii** — cum sunt anunțate.
- **Contact** — link către pagina de suport.

Textul va fi bilingv (RO/EN), la fel ca restul paginilor legale.

### 3. Suport pentru URL-ul citit de Google

Vom adăuga în `src/App.tsx` o rută suplimentară:

```text
/politica-de-confidentialitate  → redirect 301 către /politica-confidentialitate
```

Sau, alternativ, vom servi aceeași pagină pe ambele URL-uri, cu `canonical` către `/politica-confidentialitate`.

### 4. Actualizare link în Google Cloud OAuth consent screen

După publicare, în Google Cloud Console → APIs & Services → OAuth consent screen, link-ul „Privacy policy" trebuie să fie exact:

```text
https://www.rentli.ro/politica-confidentialitate
```

(sau `https://rentli.ro/politica-confidentialitate`, în funcție de domeniul principal setat).

### 5. Publicare și re-verificare

- Publicăm modificările din aplicație.
- Așteptăm propagarea (câteva minute).
- Reîncercăm verificarea brandului în Google Cloud → OAuth consent screen → Verification Center.

## Ce nu se schimbă

- Nu se modifică funcționalitatea de login Google sau codul din `SocialLoginButtons.tsx`.
- Nu se schimbă cheile OAuth (Client ID / Secret) sau redirect URIs.
- Nu se modifică politica de cookies sau termenii și condițiile, decât dacă este necesar pentru consistență.

## Rezultat așteptat

După implementare:
- Homepage URL `https://www.rentli.ro` este recunoscut ca verificat în Search Console.
- Pagina de confidențialitate are conținut suficient și URL-ul este accesibil atât pe `/politica-confidentialitate`, cât și pe `/politica-de-confidentialitate` (redirect).
- Google Cloud acceptă re-verificarea brandingului, iar în ecranul OAuth apare „Rentli" în loc de domeniul tehnic.
