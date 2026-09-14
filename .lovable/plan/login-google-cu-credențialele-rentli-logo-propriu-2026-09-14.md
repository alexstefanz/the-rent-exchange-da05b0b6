# Login Google cu credențialele Rentli (logo propriu)

## Situația reală

Cele două valori (Client ID și Client Secret) sunt salvate în seiful de secrete al proiectului, dar ecranul de login **nu** le citește de acolo. Furnizorul Google al backendului folosește în continuare credențialele gestionate de Lovable — de aceea în fereastra de autentificare apare logo-ul și numele Lovable, atât pe web cât și pe mobil.

Nu pot activa eu credențiale proprii din cod: unealta de configurare a login-ului social comută furnizorul pe credențialele gestionate de Lovable, adică exact opusul a ce vrem. Introducerea credențialelor proprii se face doar din panoul de autentificare al backendului, de către tine.

## Pașii de făcut (în panoul backend)

1. Deschide **Backend → Users → Auth Settings → Sign In Methods → Google**.
2. Activează opțiunea de credențiale proprii și lipește:
   - Client ID (valoarea salvată ca `GOOGLE_OAUTH_CLIENT_ID`)
   - Client Secret (valoarea salvată ca `GOOGLE_OAUTH_CLIENT_SECRET`)
3. Copiază **adresa de callback** afișată acolo și adaug-o în Google Cloud Console la „Authorized redirect URIs” pentru clientul OAuth.
4. În Google Cloud Console → ecranul de consimțământ: nume aplicație **Rentli**, logo Rentli încărcat, domenii autorizate `rentli.ro` și `www.rentli.ro`.
5. Salvează în ambele locuri și așteaptă câteva minute.

## Ce verific eu după ce confirmi

- Deschid ecranul de login cu Google într-o sesiune curată și confirm că apare **Rentli**, nu Lovable.
- Verific că autentificarea se finalizează corect și utilizatorul rămâne logat.
- Verific că adresele de întoarcere pentru aplicația mobilă (`rentli://auth/callback`, `rentli://**`, `exp://**`) sunt în continuare active, ca fluxul pe telefon să nu se rupă.

## Despre aplicația mobilă

Nu e nevoie de nimic separat. Aplicația mobilă folosește același backend, deci preia automat noile credențiale imediat ce le salvezi. Logo-ul Rentli va apărea și pe telefon, fără modificări de cod.

## Detalii tehnice

- Web: `src/components/auth/SocialLoginButtons.tsx` apelează `lovable.auth.signInWithOAuth("google", ...)`; mobil: `mobile-template/lib/auth.tsx` folosește `supabase.auth.signInWithOAuth`. Ambele rutează prin același furnizor Google al proiectului — schimbarea credențialelor nu cere modificări de cod.
- `supabase--configure_social_auth` nu poate seta credențiale BYOC; ar reseta furnizorul pe cele gestionate. Nu îl voi apela.
- Nicio modificare de fișiere nu este necesară pentru acest task.
