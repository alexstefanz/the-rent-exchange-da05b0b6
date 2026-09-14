# Google Sign-In: verificare credențiale proprii

## Rezultatul verificării (făcut acum)

Login-ul cu Google folosește deja credențialele tale, nu pe cele Lovable:

- ID-ul de client folosit la login: `582322940802-75g29r0hs0lk6d7nao7d7g71hmodepch.apps.googleusercontent.com`
- Adresa de întoarcere configurată corect: `https://tsffyecastudajmgrckt.supabase.co/auth/v1/callback`
- Ecranul Google se deschide fără eroare, deci Client ID + Secret au fost acceptate.

Deci pasul din panoul de autentificare este finalizat corect.

## Ce a mai rămas (branding)

Pe ecranul Google scrie acum „pentru a continua către tsffyecastudajmgrckt.supabase.co”, nu „Rentli”.
Asta vine din Google Cloud, nu din aplicație. Pași, în Google Cloud Console:

1. APIs & Services → OAuth consent screen → Branding
   - App name: `Rentli`
   - App logo: logo-ul Rentli (pătrat, minim 120x120)
   - Application home page: `https://www.rentli.ro`
   - Privacy policy: `https://www.rentli.ro/politica-de-confidentialitate`
   - Terms of service: `https://www.rentli.ro/termeni-si-conditii`
   - Authorized domains: `rentli.ro` și `supabase.co`
2. Audience → dacă aplicația e în „Testing”, apasă „Publish app” (altfel doar utilizatorii de test se pot autentifica).
3. Dacă încarci logo, Google cere verificarea brandului — durează de la câteva ore la câteva zile. Numele „Rentli” apare imediat după verificare.

## Fără modificări în aplicație

Codul de login rămâne neschimbat. Aplicația mobilă folosește același backend și preia automat aceleași credențiale.

## Verificare finală

După ce salvezi branding-ul și publici aplicația în Google, redeschid ecranul de login și confirm că apare „Rentli”.
