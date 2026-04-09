

## Plan: Adăugare autentificare Google și Apple

### Important: Facebook NU este suportat
Lovable Cloud suportă nativ doar **Google** și **Apple** ca provideri OAuth sociali. Facebook, GitHub, Discord și alți provideri sociali **nu sunt disponibili**.

### Ce vom face

**1. Configurare social login (Google + Apple)**
- Se va folosi tool-ul intern "Configure Social Auth" pentru a genera modulul `src/integrations/lovable/` cu funcția `lovable.auth.signInWithOAuth()`
- Google funcționează automat (managed credentials) — nu e nevoie de configurare suplimentară
- Apple funcționează automat (managed credentials)

**2. Actualizare `src/pages/Auth.tsx`**
- Adăugare butoane "Continuă cu Google" și "Continuă cu Apple" deasupra formularului de login/register
- Import `lovable.auth.signInWithOAuth` din modulul generat
- Separator vizual "sau" între butoanele sociale și formularul cu email

**3. Actualizare `src/components/checkout/LoginDialog.tsx`**
- Aceleași butoane Google + Apple în dialogul de login din checkout

**4. UI butoane**
- Buton Google: iconă Google, text "Continuă cu Google"
- Buton Apple: iconă Apple, text "Continuă cu Apple"
- Stil: `variant="outline"`, full width, deasupra formularului

### Fișiere afectate
- `src/integrations/lovable/` — generat automat de tool
- `src/pages/Auth.tsx` — butoane sociale
- `src/components/checkout/LoginDialog.tsx` — butoane sociale

### Notă despre Facebook
Dacă ai nevoie de Facebook login, acest lucru nu este posibil cu Lovable Cloud. Vrei să continuăm doar cu Google și Apple?

