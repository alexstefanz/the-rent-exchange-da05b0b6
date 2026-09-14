# Activare Google Auth cu credențiale proprii în Google Cloud

## Ce se întâmplă acum
În Google Cloud Console → Credentials nu apare secțiunea „OAuth 2.0 Client IDs" pentru că proiectul nu are încă creat un client OAuth. Pentru a crea unul, trebuie mai întâi configurat „OAuth consent screen".

## Pași de făcut în Google Cloud Console

### 1. Configurează OAuth consent screen
- Mergi la **APIs & Services → OAuth consent screen**.
- Alege **External** (pentru utilizatori publici).
- Completează:
  - **App name:** Rentli
  - **User support email:** adresa ta
  - **App logo:** logo Rentli (opțional, recomandat pentru branding)
  - **Developer contact information:** adresa ta
- La **Scopes**, adaugă:
  - `openid`
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
- Salvează și, dacă e în testing, adaugă test users (inclusiv adresa ta).

### 2. Creează OAuth 2.0 Client ID
- Revino la **APIs & Services → Credentials**.
- Apasă **+ Create credentials → OAuth client ID**.
- **Application type:** Web application.
- **Name:** Rentli Web.
- **Authorized JavaScript origins:**
  - `https://rentli.ro`
  - `https://www.rentli.ro`
- **Authorized redirect URIs:**
  - `https://tsffyecastudajmgrckt.supabase.co/auth/v1/callback`
- Apasă **Create**.
- Copiază **Client ID** și **Client Secret** într-un loc sigur.

### 3. Salvează secretele în Lovable Cloud
- Deschide **Cloud → Secrets**.
- Actualizează:
  - `GOOGLE_OAUTH_CLIENT_ID`
  - `GOOGLE_OAUTH_CLIENT_SECRET`

### 4. Activează credențialele proprii în Backend
- Deschide **Backend → Users → Auth Settings → Sign In Methods → Google**.
- Activează opțiunea **„Use your own credentials"**.
- Lipește Client ID și Client Secret.
- Salvează.
- Copiază **adresa de callback** afișată și asigură-te că este adăugată în Google Cloud la „Authorized redirect URIs".

### 5. Verificare
- Testez login-ul cu Google în incognito pentru a confirma că apare brandul **Rentli**, nu Lovable.

## Note
- Cheia de Maps rămâne separată; acest plan nu o afectează.
- Aplicația mobilă folosește același backend, deci preia automat noile credențiale.
- Redirecturile mobile (`rentli://auth/callback`, `rentli://**`, `exp://**`) trebuie să rămână active în backend.
