# Mutare frontend Rentli pe server propriu în Germania

## Context decizional

- **Backend-ul rămâne pe Lovable Cloud (Supabase):** baza de date, autentificare, plăți Stripe, storage, edge functions și secretele de serviciu rămân în Lovable Cloud, cu subscripție plătită. Aceste componente nu pot fi mutate fizic într-un VPS propriu fără a replica întregul backend Supabase.
- **Se mută doar frontend-ul (React + Vite):** build-ul static sau serverul de preview Vite va fi găzduit pe un server din Germania (Munich). Astfel obții control total asupra serverului web, certificatelor, firewall-ului, logurilor de acces și al cache-ului static.
- **Editorul Lovable se păstrează:** se folosește sync GitHub + CI/CD pentru a publica automat pe serverul german orice modificare făcută în Lovable.

## Arhitectura țintă

```text
Utilizator
    |
    v
rentli.ro / www.rentli.ro  (DNS A → IP server Germania)
    |
    v
VPS / server dedicat Germania
    Nginx (reverse proxy + SSL + cache static)
    |
    v
Build static Vite (dist/)
    |
    +---> API / auth / storage / edge functions
          Lovable Cloud (Supabase)
```

## Plan de implementare

### 1. Alegere infrastructură în Germania

Recomandăm un VPS cu datacenter în München sau la maximum 50 km (Nürnberg / Frankfurt):

| Provider | Locație datacenter | Recomandare configurație |
|---|---|---|
| **IONOS** | München | VPS XL: 4 vCore, 8 GB RAM, 160 GB SSD |
| **Contabo** | München | VPS S / VPS M: 4 vCore, 8 GB RAM, 200 GB SSD |
| **Hetzner Cloud** | Nürnberg / Falkenstein | CPX31 sau CPX41 (4–8 vCore, 16 GB RAM) |
| **DigitalOcean** | Frankfurt (FRA1) | Droplet Premium Intel/AMD 4 GB / 2 vCPU |

**Criterii de selecție:** SLA, backup automat, volum de trafic estimat, suport DDoS inclus, preț lunar.

### 2. Conectare GitHub în Lovable

1. În editorul Lovable: **Plus (+) → GitHub → Connect project**.
2. Autorizează aplicația Lovable și selectează contul/organizația.
3. Creează repository-ul. După sync, codul sursă va fi disponibil pe GitHub.
4. Notează URL-ul repo-ului; aici se va adăuga pipeline-ul CI/CD.

### 3. Pipeline CI/CD (GitHub Actions)

Se adaugă în repo fișierul `.github/workflows/deploy.yml` care:

- rulează `bun install` și `bun run build`;
- copiază folderul `dist/` pe server prin SSH (rsync) sau prin SFTP;
- rulează un script de restart Nginx / invalidare cache dacă este necesar.

**Secrete necesare în GitHub Settings → Secrets and variables → Actions:**

- `SSH_HOST` — IP-ul serverului german;
- `SSH_USER` — utilizatorul de deploy;
- `SSH_PRIVATE_KEY` — cheie SSH dedicată;
- `DEPLOY_PATH` — calea unde se salvează build-ul pe server (ex. `/var/www/rentli`);
- Toate variabilele publice Vite necesare build-ului: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`, `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID`.

### 4. Configurare server (Ubuntu 24.04 LTS)

Componente de instalat:

- **Nginx** — servește fișierele statice din `dist/`, comprimare gzip/brotli, cache, redirect `www` → non-www sau invers.
- **Certbot (Let’s Encrypt)** — certificate SSL wildcard sau pentru `rentli.ro` + `www.rentli.ro`.
- **Firewall (UFW)** — permite doar 22 (SSH restrict), 80 și 443.
- **Fail2Ban** — protecție brute-force SSH.
- **Unattended-upgrades** — patch-uri de securitate automate.
- (Opțional) **CrowdSec** — WAF ușor open-source dacă nu se folosește Cloudflare.

Configurație Nginx exemplu:

```nginx
server {
  listen 443 ssl http2;
  server_name rentli.ro www.rentli.ro;
  root /var/www/rentli/dist;
  index index.html;

  ssl_certificate     /etc/letsencrypt/live/rentli.ro/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/rentli.ro/privkey.pem;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location ~* \.(js|css|png|webp|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  add_header X-Content-Type-Options nosniff;
  add_header X-Frame-Options DENY;
  add_header Referrer-Policy "strict-origin-when-cross-origin";
}

server {
  listen 80;
  server_name rentli.ro www.rentli.ro;
  return 301 https://$host$request_uri;
}
```

> Atenție: fișierul `_headers` din proiect este specific Lovable Hosting; la self-host prin Nginx regulile de cache/headers se mută în configurația Nginx.

### 5. Variabile de mediu și secrete

Pe server nu este nevoie de `.env` în repo. Variabilele se injectează în build prin GitHub Actions secrets. Se va evita expunerea cheilor în log-uri.

Chei care trebuie setate în pipeline:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`
- `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID`

### 6. Reconfigurare DNS

1. Așteaptă să ai IP-ul public fix al serverului german.
2. În registrarul domeniului `rentli.ro`:
   - setează/actualizează înregistrările A pentru `@` și `www` către IP-ul serverului;
   - elimină vechile înregistrări A care pointau către Lovable (`185.158.133.1`) sau Cloudflare dacă nu se mai folosesc;
   - păstrează TTL mic (300s) în perioada de tranziție.
3. Așteaptă propagarea DNS (de la câteva minute până la 24h, de regulă mult mai puțin).

### 7. Testare și rollback

1. **Test pre-producție:**
   - accesează `https://rentli.ro` după deploy;
   - verifică funcționarea login, căutare, pagină produs, checkout, plăți Stripe, notificări;
   - verifică SSL (certificatele Let’s Encrypt) cu SSL Labs;
   - verifică headerele de securitate în Network tab.
2. **Rollback rapid:**
   - păstrează în `/var/www/rentli/dist-previous` copia anterioară înainte de fiecare deploy;
   - în caz de problemă, se restaurează directorul rapid prin SSH.
3. **Monitorizare:**
   - logwatch / logrotate pentru Nginx;
   - (opțional) uptime monitor (UptimeRobot, HetrixTools) cu alerte pe email/SMS.

### 8. Securitate suplimentară

- Dezactivează loginul cu parola la SSH; folosește doar chei SSH.
- Schimbă portul SSH într-un port non-standard sau limitează accesul SSH la IP-urile echipei.
- Activează automatic security updates.
- Limitează exponențial rate-ul la nivel de Nginx pentru endpoint-uri sensibile (ex. `/auth/v1` proxy dacă se adaugă vreodată).
- Ia în considerare un WAF profesionist (Cloudflare Pro, AWS WAF) doar dacă se dorește protecție DDoS; acesta introduce un intermediar suplimentar față de serverul german.

## Rezultat așteptat

- Frontend-ul Rentli este servit de pe un server aflat în Germania, cu control direct asupra OS-ului, certificatelor, firewall-ului și logurilor.
- Modificările din Lovable ajung automat pe server prin GitHub Actions în câteva minute.
- Backend-ul (date utilizatori, plăți, mesaje, documente) rămâne în Lovable Cloud / Supabase.
- Domeniul `rentli.ro` servește noua infrastructură.

## Riscuri și note

- **Datele utilizatorilor rămân în backend-ul Lovable Cloud.** Dacă obiectivul de securitate este stocarea datelor personale în UE, acest aspect trebuie tratat separat prin DPA (Data Processing Addendum) cu Lovable sau prin migrarea completă a backend-ului (opțiune mult mai complexă, în afara acestui plan).
- Dacă renunți la publicarea Lovable, funcțiile de hosting Lovable (social-preview, SPA fallback, cache headers custom `_headers`) nu mai sunt active; ele trebuie replicate în Nginx.
- Build-ul Vite este static; pentru SSR nu este necesar, dar pentru edge functions trebuie să rămână în Lovable Cloud.
