

## Plan: Eliminare logo Lovable din ecranul de consent Apple/Google

### Problemă
Când utilizatorul apasă "Continuă cu Apple" (sau Google), apare un ecran de permisiuni cu **logo-ul Lovable** și textul "Grant permission to Rentli". Acesta este ecranul de consent al **OAuth broker-ului managed** al Lovable Cloud (`oauth.lovable.app`), care folosește credențialele OAuth ale Lovable.

### De ce apare logo-ul Lovable
Folosim acum **Managed OAuth** (din `src/integrations/lovable/index.ts` cu `createLovableAuth()`). În acest mod, fluxul trece prin infrastructura Lovable care afișează propria pagină de consent înainte de a redirecta la Apple/Google. Brandingul acelei pagini (logo + nume aplicație) este controlat de Lovable, **nu poate fi customizat din cod**.

### Soluție: trecerea la BYOC (Bring Your Own Credentials)

Singurul mod de a elimina ecranul Lovable și de a afișa direct ecranul Apple cu brandingul Rentli este să **înregistrăm propriile credențiale Apple Sign In** și să le configurăm în Lovable Cloud. Astfel:
- Nu mai apare ecranul intermediar Lovable
- Utilizatorul vede direct prompt-ul Apple cu numele "Rentli" și icoana aplicației tale Apple Developer

#### Pași necesari (în Apple Developer Console — îi facem împreună)

1. **Creează un Services ID** la https://developer.apple.com/account/resources/identifiers/list
   - Activează "Sign In with Apple"
   - Numește-l ex. `ro.rentli.web`
2. **Creează o cheie privată (.p8)** la https://developer.apple.com/account/resources/authkeys/list
   - Activează "Sign In with Apple" pentru cheie
   - Descarcă fișierul `.p8` (disponibil o singură dată!)
   - Notează **Key ID** (10 caractere)
3. **Notează Team ID** (colțul dreapta sus în Apple Developer Console — 10 caractere)
4. **Configurează domeniile** în Services ID → Sign In with Apple → Configure:
   - Adaugă: `rentli.ro`, `www.rentli.ro`, `the-rent-exchange.lovable.app`
   - Adaugă URL-ul callback Supabase: `https://tsffyecastudajmgrckt.supabase.co/auth/v1/callback`

#### Configurare în Lovable Cloud (după ce ai datele de mai sus)

1. Deschizi backend-ul → Users → Authentication Settings → Sign In Methods → Apple
2. Selectezi "Use your own credentials"
3. Click "Generate Secret" și completezi: Team ID, Key ID, Services ID, conținutul fișierului `.p8`
4. Salvezi — gata, fluxul Apple va afișa direct brandingul Rentli

**Important**: JWT-ul Apple expiră după **6 luni** — trebuie regenerat periodic (îți pot pune un memo).

### Pentru Google (opțional, similar)
Dacă vrei să elimini ecranul Lovable și pentru Google, procedeul este identic — creezi propriul OAuth Client ID în Google Cloud Console și îl configurezi în Lovable Cloud → Authentication Settings → Google.

### Ce NU pot face din cod
- Nu pot edita logo-ul ecranului de consent Lovable (nu e în codul tău, e în infrastructura `oauth.lovable.app`)
- Nu pot înregistra automat credențiale Apple în numele tău (necesită cont Apple Developer plătit — $99/an)

### Următorii pași
1. Confirmi dacă ai cont **Apple Developer** activ
2. Dacă da, parcurgi pașii 1–4 din Apple Developer Console și îmi dai înapoi: Services ID, Team ID, Key ID, conținutul `.p8`
3. Te ghidez prin configurarea în Lovable Cloud cu acțiunea `<lov-open-backend>`

### Acțiune disponibilă acum

Pentru a deschide backend-ul și a vedea unde se configurează:

<lov-actions>
  <lov-open-backend>Deschide Backend</lov-open-backend>
</lov-actions>

