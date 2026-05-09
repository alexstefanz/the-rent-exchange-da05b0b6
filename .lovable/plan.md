
# Sistem de securitate linkuri în chat

## 1. Rezumat funcțional

Orice mesaj din chat este scanat pentru URL-uri. Fiecare URL primește un **risk score** și o **clasificare** (SAFE / WARNING / BLOCKED). În UI, linkurile sunt redate cu badge-uri și bannere de avertizare. Linkurile către `rentli.ro` / `rentli.com` sunt mereu SAFE. Linkurile BLOCKED nu sunt clickabile direct — necesită confirmare.

## 2. Scope (ce intră acum)

- Detectare URL în mesaje (la randare + la trimitere).
- Normalizare: lowercase domeniu, decode percent-encoding, strip zero-width chars, detecție punycode/IDN homograph.
- Scoring euristic + verificare Google Safe Browsing (GSB).
- Allowlist intern (`rentli.ro`, `rentli.com`, `*.rentli.ro`).
- Cache rezultate în Postgres (TTL 7 zile pentru SAFE, 24h pentru WARNING/BLOCKED).
- Endpoint = Supabase Edge Function `scan-url`.
- UI bilingv în `ChatPanel` (RO/EN via `t()`).
- Logging linkuri BLOCKED + sistem de "Raportează acest link" (insert în tabel).

**Out of scope (faza ulterioară, menționăm dar nu construim):** Redis, ML heuristics, reputație utilizatori, VirusTotal/PhishTank (necesită chei și quote separate), rate-limiting (per directiva proiectului — backend nu are primitive).

## 3. Arhitectură

```text
Mesaj nou ──► extractUrls() ──► pentru fiecare URL:
                                    │
                                    ├─ allowlist? → SAFE (skip)
                                    │
                                    └─ supabase.functions.invoke('scan-url')
                                             │
                                             ├─ cache hit (url_scan_cache) → return
                                             │
                                             └─ scoring local + GSB API
                                                       │
                                                       └─ insert cache + return
```

## 4. Schema bază de date

Tabel nou `url_scan_cache`:
- `url_hash` text PK (SHA-256 din URL normalizat)
- `normalized_url` text
- `host` text
- `classification` text (SAFE | WARNING | BLOCKED)
- `risk_score` int (0-100)
- `reasons` jsonb (listă motive: ['gsb_match','idn_homograph','shortener',...])
- `gsb_threat` text nullable
- `expires_at` timestamptz
- `created_at`, `updated_at`

Tabel nou `url_reports` (raportări user):
- `id`, `reporter_id` (uuid → auth.users), `url`, `host`, `reason`, `message_id` nullable, `created_at`
- RLS: insert pentru orice user autentificat; select doar admin.

Tabel nou `url_allowlist` (gestionat de admin):
- `host` text PK, `note` text, `created_at`
- Seed inițial: `rentli.ro`, `rentli.com`, `www.rentli.ro`, `www.rentli.com`.

## 5. Edge function `scan-url`

`supabase/functions/scan-url/index.ts`:
- Input: `{ url: string }` validat cu Zod (max 2048 chars).
- Pași:
  1. Normalizare URL (URL API + decoders).
  2. Verifică allowlist (DB) → return SAFE.
  3. Cache lookup pe `url_hash` (dacă nu expirat).
  4. Scoring euristic:
     - `+30` non-HTTPS
     - `+25` IDN/punycode + asemănare cu brand cunoscut (Levenshtein ≤ 2 față de listă: rentli, google, paypal, stripe, revolut, ing, brd, bcr, emag, olx)
     - `+20` shortener (bit.ly, tinyurl, t.co, goo.gl, ow.ly, is.gd, cutt.ly, rb.gy, s.id, shorturl.at)
     - `+15` >4 subdomenii
     - `+15` caractere suspecte în host (`@`, `--xn`, mix scripts)
     - `+10` TLD high-risk (.zip, .mov, .top, .xyz, .click, .country, .work)
     - `+10` path/query conține cuvinte phishing (login, verify, secure, account, wallet, bank, password)
  5. Apel Google Safe Browsing v4 `threatMatches:find`. Match → `+70` și `gsb_threat = MALWARE/SOCIAL_ENGINEERING/...`.
  6. Clasificare:
     - score ≥ 70 sau GSB hit → **BLOCKED**
     - score ≥ 30 → **WARNING**
     - altfel → **SAFE**
  7. Upsert cache cu `expires_at` adecvat.
  8. Răspuns: `{ classification, risk_score, reasons, host, normalized_url }`.
- CORS standard, `verify_jwt = true` (default) — chemat de utilizatori autentificați.
- Secret necesar: `GOOGLE_SAFE_BROWSING_API_KEY` (cer prin `add_secret` la implementare; dacă nu există, pasul GSB se sare degradat).

Înregistrare în `supabase/config.toml` doar dacă schimbăm setări implicite (probabil nu).

## 6. Frontend

### Utilitar nou `src/lib/urlScanner.ts`
- `extractUrls(text)`: regex robust (RFC-style, suportă `www.`).
- `normalizeUrl(url)`: lowercase host, decode, strip `\u200B-\u200F\uFEFF`.
- `isAllowlisted(host)`: check sincron `rentli.ro`/`rentli.com`.
- `scanUrl(url)`: cache memorie (Map) + apel `supabase.functions.invoke('scan-url')`.

### Hook nou `src/hooks/useScannedUrls.ts`
- Primește `text` mesaj, returnează `Map<url, ScanResult | 'loading'>` + reactive React Query (`['url-scan', hash]`, staleTime 1h).

### Componentă nouă `src/components/messaging/MessageContent.tsx`
- Înlocuiește randarea curentă `<p>{msg.content}</p>` în `ChatPanel` (linia 203) și `ChatDialog` (analog).
- Tokenizează textul în segmente text/URL.
- Pentru fiecare URL:
  - **SAFE**: `<a target="_blank" rel="noopener noreferrer nofollow ugc">` cu icon shield verde mic.
  - **WARNING**: `<a>` + banner galben sub bula mesajului: "Atenție: link extern neverificat (host)." Click deschide direct, dar cu confirm dialog rapid.
  - **BLOCKED**: text non-clickable cu strikethrough + banner roșu: "Link blocat pentru protecția ta." Buton "Văd riscul, deschide oricum" → `AlertDialog` cu detalii (motive, score) → confirmare → `window.open`.
  - Fiecare link are buton mic "Raportează" → insert `url_reports`.
- Loader subtil cât timp `scanning`.

### Modificări puncte de integrare
- `src/components/messaging/ChatPanel.tsx` — folosește `<MessageContent text={msg.content} />`.
- `src/components/messaging/ChatDialog.tsx` — la fel.

### Bilingv
- Toate stringurile noi prin `t('RO','EN')` din `useLanguage`. Adăugăm chei dedicate în `src/data/uxCopy.ts` la secțiunea messaging: `linkSafeBadge`, `linkWarningBanner`, `linkBlockedBanner`, `linkOpenAnyway`, `linkReport`, `linkReportSuccess`, `linkScanning`.

## 7. Securitate & detalii tehnice

- Toate apelurile către `scan-url` necesită JWT (default Supabase) — previne abuz anonim.
- RLS:
  - `url_scan_cache`: SELECT public (read-only), INSERT/UPDATE doar service_role (din edge function).
  - `url_reports`: INSERT pentru `auth.uid() IS NOT NULL`; SELECT doar `has_role(auth.uid(),'admin')`.
  - `url_allowlist`: SELECT public; ALL doar admin.
- Edge function validează input cu Zod, escapează totul, nu execută SQL raw.
- Cache hash = `sha256(normalized_url)` pentru a ține tabela mică și a evita PII în chei.
- Conform regulii proiectului, **nu adăugăm rate limiting** la edge function (notăm ca gap).

## 8. Plan de implementare (pași)

1. Migrație: tabele `url_scan_cache`, `url_reports`, `url_allowlist` + RLS + seed allowlist.
2. Cer secret `GOOGLE_SAFE_BROWSING_API_KEY` (dacă utilizatorul confirmă să-l furnizeze; altfel scoring rulează doar euristic).
3. Edge function `scan-url`.
4. `src/lib/urlScanner.ts` + `src/hooks/useScannedUrls.ts`.
5. `src/components/messaging/MessageContent.tsx`.
6. Integrare în `ChatPanel.tsx` și `ChatDialog.tsx`.
7. Chei UX bilingve în `src/data/uxCopy.ts`.
8. Test manual: link safe (rentli.ro), link extern necunoscut (example.com), shortener (bit.ly/test), URL phishing test GSB (`http://malware.testing.google.test/testing/malware/`).

## 9. Întrebări înainte de implementare

- Vrei să folosim **Google Safe Browsing** acum (necesită API key gratuit de la Google Cloud)? Alternativ rulăm doar scoring euristic în prima fază.
- Vrei tab admin separat în dashboard pentru `url_reports` și gestionarea `url_allowlist`, sau lăsăm pe mai târziu?
