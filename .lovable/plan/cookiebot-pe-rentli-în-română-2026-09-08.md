# Cookiebot pe Rentli (în română)

Înlocuim banner-ul propriu de cookie-uri cu Cookiebot (ID domeniu `22dfb7ae-31ca-4a65-a044-86e4b671a477`), cu blocare automată a scripturilor până la acceptare și interfață în limba română.

## Ce se schimbă pentru vizitator

- La prima vizită apare banner-ul oficial Cookiebot, în română, cu opțiuni pe categorii (necesare, preferințe, statistici, marketing).
- Până la acceptare, scripturile care pun cookie-uri (Google Analytics, Google Maps, alte servicii externe) nu se încarcă.
- În pagina „Politica de cookies” apare lista completă și actualizată automat a cookie-urilor folosite (declarația Cookiebot), în română.
- În subsolul site-ului adăugăm linkul „Setări cookie-uri”, prin care oricine își poate schimba sau retrage consimțământul oricând (cerință GDPR).
- Banner-ul nostru vechi dispare complet.

## Pași

1. **Instalare Cookiebot** – scriptul Cookiebot devine primul script din pagină, cu blocare automată și limbă forțată română.
2. **Eliminarea banner-ului propriu** – ștergem componenta veche de consimțământ și afișarea ei; nu mai folosim preferința salvată local.
3. **Legarea cu Google Analytics** – păstrăm modul „consimțământ refuzat implicit”, iar la acceptarea din Cookiebot se activează automat categoria de statistici (și marketing, dacă e bifată). La retragere, se dezactivează.
4. **Declarația de cookie-uri** – în pagina „Politica de cookies” inserăm tabelul generat de Cookiebot în locul listei scrise manual, păstrând restul textului legal.
5. **Setări cookie-uri în footer** – link care redeschide banner-ul.
6. **Verificare** – deschidem site-ul, confirmăm că banner-ul apare în română, că Analytics nu se încarcă înainte de accept și că se încarcă după.

## Detalii tehnice

- `index.html`: `<script id="Cookiebot" src="https://consent.cookiebot.com/uc.js" data-cbid="22dfb7ae-31ca-4a65-a044-86e4b671a477" data-blockingmode="auto" data-culture="RO" type="text/javascript">` plasat ca prim element în `<head>`, înaintea oricărui alt script.
- Se păstrează blocul Consent Mode v2 (`default: denied`), dar se elimină citirea din `localStorage('rentli_cookie_consent')`; în loc se ascultă evenimentele `CookiebotOnAccept` / `CookiebotOnDecline` și se face `gtag('consent','update', …)` din categoriile `Cookiebot.consent.statistics` / `.marketing`. Loader-ul gtag primește `data-cookieconsent="ignore"` ca să nu fie blocat de auto-blocking înainte de a putea trimite semnalele de consimțământ.
- Se șterge `src/components/CookieConsent.tsx` și utilizarea din `src/App.tsx` (import lazy + `<CookieConsent />`).
- `src/lib/analytics.ts`: `setAnalyticsConsent` rămâne, dar este apelat din handler-ul Cookiebot, nu din banner.
- `src/pages/legal/CookiePolicy.tsx`: secțiunea cu tipurile de cookie-uri se înlocuiește cu `<script id="CookieDeclaration" src="https://consent.cookiebot.com/22dfb7ae-31ca-4a65-a044-86e4b671a477/cd.js" data-culture="ro" async>`, injectat la montarea paginii (script extern nu se randează direct în React).
- `src/components/layout/Footer.tsx`: buton „Setări cookie-uri” care apelează `window.Cookiebot.renew()`.
- Necesar în contul Cookiebot: domeniul `rentli.ro` adăugat și scanat; limba implicită setată pe română (fallback dacă `data-culture` nu e aplicat).

## De reținut

- Blocarea automată poate întârzia harta Google Maps până la acceptarea categoriei corespunzătoare — comportament corect GDPR.
- Varianta gratuită Cookiebot acoperă până la 50 de pagini scanate; paginile dinamice de produs pot depăși limita, caz în care scanarea acoperă doar o parte din site (banner-ul funcționează în continuare).
