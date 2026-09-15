# Rezolvarea problemelor de verificare a brandului Google

## Stare curentă (verificat acum)

Login-ul cu Google **funcționează**: eroarea `redirect_uri_mismatch` a dispărut, ecranul Google se deschide cu clientul tău (`582322940802-...`) și adresa de întoarcere corectă.

Singura problemă rămasă: pe ecranul de login scrie „pentru a continua către tsffyecastudajmgrckt.supabase.co" în loc de „Rentli". Asta ține de verificarea brandului la Google, nu de cod.

Google a semnalat două probleme:
1. Adresa `https://www.rentli.ro` nu este înregistrată pe numele tău (în Search Console este verificată doar `https://rentli.ro/`).
2. Pagina de politică de confidențialitate nu are conținut suficient.

## Ce am pregătit deja în aplicație

- Politica de confidențialitate a fost extinsă complet (16 secțiuni, română și engleză): operator, date colectate, scopuri, temeiuri legale, partajare, transferuri, stocare, cookie-uri, securitate, drepturi GDPR, profilare, breșe, parteneri, lege aplicabilă, modificări.
- Am adăugat o redirecționare de la adresa `/politica-de-confidentialitate` (varianta pe care ai trecut-o în Google) către pagina reală `/politica-confidentialitate`, ca linkul tău din Google să funcționeze oricum.
- Am adăugat codul de verificare Google Search Console în pagină și fișierul de verificare.

Toate acestea există doar în varianta de lucru — nu sunt încă pe site-ul public.

## Pașii propuși

1. **Public site-ul** (cu acordul tău) ca Google să vadă politica extinsă și verificările.
2. **Tu, în Google Cloud Console → OAuth consent screen → Branding**, schimbi adresele pe varianta fără `www`, cea înregistrată pe numele tău:
   - Homepage: `https://rentli.ro/`
   - Privacy policy: `https://rentli.ro/politica-confidentialitate`
   - Terms of service: `https://rentli.ro/termeni-si-conditii`
   - Authorized domains: `rentli.ro` și `supabase.co`
3. **Retrimiți verificarea** din Google Cloud.
4. Eu verific apoi că paginile răspund corect public și că ecranul de login rămâne funcțional.

## Detalii tehnice

- Nu se modifică nimic în logica de autentificare, nici pe web, nici pe mobil.
- Nu se schimbă cheile OAuth sau adresele de întoarcere.
- Modificările deja făcute: `src/pages/legal/PrivacyPolicy.tsx` (secțiuni RO/EN extinse), `src/App.tsx` (redirect 301), `index.html` (meta de verificare), `public/google25e7e360652da019.html`.
- Aplicația publicată trebuie actualizată pentru ca Google să poată citi conținutul nou.
