# Activare Google Auth cu credențiale proprii Rentli

## Context actual verificat
- Aplicația folosește deja `@lovable.dev/cloud-auth-js` (`src/integrations/lovable/index.ts`) și butonul „Continuă cu Google" (`src/components/auth/SocialLoginButtons.tsx`) apelează `lovable.auth.signInWithOAuth("google")`.
- Seiful proiectului conține deja `GOOGLE_OAUTH_CLIENT_ID` și `GOOGLE_OAUTH_CLIENT_SECRET`.
- Redirecturile mobile `rentli://auth/callback`, `rentli://**`, `exp://**` au fost adăugate anterior în backend.
- Backendul este Lovable Cloud (proiect gestionat de Lovable), deci pașii din Supabase Dashboard trebuie efectuați prin panoul Lovable Backend.

## Ce trebuie făcut
1. **Activez Google Sign-In în Lovable Backend.**
   - Deschid Backend → Users → Auth Settings → Sign In Methods → Google.
   - Activez toggle-ul / optiunea „Use your own credentials".
   - Lipeșt Client ID și Client Secret din seiful proiectului (`GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`).
   - Salvez.

2. **Configurez redirectul autorizat în Google Cloud.**
   - Copiaz exact „Authorized redirect URI" afișat în panoul Lovable pentru Google (conform indicației tale, probabil `https://tsffyecastudajmgrckt.supabase.co/auth/v1/callback`).
   - În Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID (Web application) → adaug acel URI la „Authorized redirect URIs" și salvez.

3. **Configurez ecranul de consimțământ Google cu brandul Rentli.**
   - Nume aplicație: **Rentli**.
   - Logo: logo Rentli.
   - Domenii autorizate / link-uri: `rentli.ro`, `www.rentli.ro`.
   - Scopes: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile` (default).

4. **Verific redirecturile mobile în Lovable Backend.**
   - Backend → Auth Settings → URL Configuration → Redirect URLs.
   - Confirm că există: `rentli://auth/callback`, `rentli://**`, `exp://**`.
   - Dacă vreunul lipsește, îl adaug.

5. **Testez fluxul.**
   - În browser incognito, accesez `/auth` și dau „Continuă cu Google".
   - Confirm că ecranul de consimțământ Google arată **Rentli** (nu Lovable).
   - După login, utilizatorul este redirecționat corect în aplicație.
   - Testez și pe aplicația mobilă / Expo Go: `rentli://auth/callback` sau `exp://**`.

6. **Dacă este necesar, rulez configurarea prin tool.**
   - Dacă panoul Lovable nu expune toggle-ul direct, folosesc tool-ul `supabase--configure_social_auth` cu `providers: ["google"]` pentru a activa providerul, apoi completez credențialele proprii în backend.

## Rezultat așteptat
- Login-ul cu Google funcționează pe web și mobil.
- Utilizatorul vede brandul Rentli în ecranul OAuth Google, nu Lovable.
- Aplicația mobilă revine corect în app prin schema `rentli://`.
