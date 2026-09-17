# Configurare server (Nginx) pentru SEO

Frontend-ul Rentli rulează pe serverul propriu (Nginx), iar backendul pe Lovable Cloud.
Două rute trebuie trimise către backend ca site-ul să fie indexat corect.

Adresa de bază a funcțiilor:
`https://tsffyecastudajmgrckt.supabase.co/functions/v1`

## 1. Harta site-ului mereu actualizată

`/sitemap.xml` se servește din baza de date, nu din fișierul static.

```nginx
location = /sitemap.xml {
    proxy_pass https://tsffyecastudajmgrckt.supabase.co/functions/v1/sitemap;
    proxy_set_header Host tsffyecastudajmgrckt.supabase.co;
    proxy_ssl_server_name on;
}
```

Fișierul `public/sitemap.xml` rămâne generat la build ca rezervă: dacă regula de mai sus
lipsește, site-ul servește tot o hartă validă, dar actualizată doar la publicare.

## 2. Pagini cu titluri corecte pentru roboți

Doar cererile venite de la roboți (Google, Bing, rețele sociale) pentru paginile de
produs, categorie și subcategorie sunt trimise către funcția `seo-prerender`.
Vizitatorii obișnuiți primesc aplicația normală, neschimbată.

```nginx
map $http_user_agent $rentli_is_bot {
    default 0;
    "~*(googlebot|bingbot|duckduckbot|yandexbot|baiduspider|applebot|slurp)" 1;
    "~*(facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|pinterest)" 1;
}

server {
    # ... configurația existentă ...

    location ~ ^/(produs|categorie|subcategorie)/ {
        if ($rentli_is_bot) {
            proxy_pass https://tsffyecastudajmgrckt.supabase.co/functions/v1/seo-prerender?path=$request_uri;
        }
        try_files $uri /index.html;
    }
}
```

Note:
- `proxy_ssl_server_name on;` este necesar și aici (adaugă-l în blocul `server` sau în `location`).
- Funcția citește `https://rentli.ro/index.html` pentru scheletul paginii, deci regula nu trebuie
  să prindă `/index.html` — nu îl prinde, pentru că filtrul este doar pe cele trei prefixe.
- Dacă funcția nu răspunde, ea returnează oricum pagina normală, deci robotul nu primește eroare.

## 3. Un singur domeniu oficial

Adresa canonică este `https://rentli.ro` (fără www). `www.rentli.ro` trebuie să redirecteze
permanent (301) către varianta fără www — redirectul este deja activ în Cloudflare.

## Verificare rapidă

```bash
curl -s https://rentli.ro/sitemap.xml | grep -c "<loc>"
curl -s -A "Googlebot" https://rentli.ro/produs/<slug> | grep "<title>"
```

A doua comandă trebuie să afișeze titlul produsului, nu titlul general al site-ului.
