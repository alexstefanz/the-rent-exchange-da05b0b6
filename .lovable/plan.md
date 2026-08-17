# Sincronizare aplicație nativă Emergent cu web app-ul Rentli

## Context

Web app-ul Rentli existent rulează pe React + Vite + TypeScript și folosește Lovable Cloud (Supabase) ca backend comun: auth, baza de date PostgreSQL, RLS, RPCs, realtime subscriptions, storage pentru imagini și edge functions pentru plăți, emailuri, notificări.

Aplicația nativă mobilă va fi construită în Emergent (platformă de vibe coding pentru mobil). Sincronizarea se face prin conectarea directă la același backend — nu se construiește un backend separat.

## Obiectiv

Să avem o aplicație nativă iOS/Android care:
- Partajeze aceiași utilizatori, autentificare și sesiuni cu web app-ul.
- Afișeze și modifice aceleași date: produse, prețuri, rezervări, conversații, wallet, retrageri, categorii, imagini.
- Primească actualizări în timp real (chat, status rezervări, notificări).
- Respecte aceleași reguli de securitate (RLS, RPCs, edge functions).

## Arhitectură propusă

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web App       │     │   Mobile App    │     │   Admin ERP     │
│   (React/Vite)  │     │   (Emergent)    │     │   (React/Vite)  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │   Lovable Cloud /         │
                    │   Supabase                │
                    │  - auth.users             │
                    │  - public.* tables        │
                    │  - RLS policies           │
                    │  - RPCs                   │
                    │  - Realtime               │
                    │  - Storage                │
                    │  - Edge Functions         │
                    └───────────────────────────┘
```

## Ce trebuie expus din backend pentru aplicația mobilă

### 1. Conexiune Supabase

Aplicația mobilă are nevoie de:
- `VITE_SUPABASE_URL` (sau echivalentul mobil)
- `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key)

Acestea sunt deja folosite de web app. Pentru aplicația nativă se vor folosi aceleași valori, dar configurate în variabilele de mediu ale aplicației Emergent.

### 2. Autentificare

- Folosim același flux Supabase Auth (email/parolă, OTP telefon, Google/Apple OAuth).
- Pentru OAuth nativ, configurăm deep linking: `rentli://auth/callback` sau un URL public pe domeniu (`https://rentli.ro/auth/callback`) care să redirecționeze către aplicație.
- Sesiunea este partajată la nivel de cont — un utilizator creat pe web se poate loga pe mobil și invers.

### 3. Acces la date

Toate datele sunt accesibile prin aceleași mecanisme:
- **SELECT/INSERT/UPDATE/DELETE** direct pe tabele publice, protejate de RLS (ex. `products`, `rentals`, `conversations`, `messages`).
- **RPCs** pentru logică complexă (ex. `get_homepage_popular_products`, `get_products_map_points`, `track_product_view`, `soft_delete_my_product`, `get_rental_by_public_id`).
- **Edge functions** pentru plăți Stripe, notificări, emailuri, generare PV.

Aplicația mobilă va replica pattern-urile din web app: va folosi aceleași RPCs și edge functions, nu va accesa tabele direct acolo unde există deja funcții securizate.

### 4. Imagini și fișiere

- Storage bucket-urile existente rămân aceleași.
- Aplicația mobilă va încărca imagini în același bucket, cu aceleași reguli RLS.
- Afișarea imaginilor se face prin signed URLs sau public URLs generate de Supabase Storage.

### 5. Realtime și notificări

- **Supabase Realtime** pentru mesaje noi, schimbări de status la rezervări, notificări.
- **Push notifications** (opțional, pas ulterior): se poate adăuga un edge function care trimite push prin Expo / Firebase / APNs, declanșat de triggeri pe `notifications` sau `messages`.

### 6. CORS și securitate

- Edge functions au deja CORS headers configurate (`corsHeaders` din `@supabase/supabase-js`).
- Pentru aplicația nativă, CORS nu este o problemă la fel ca pe web, dar deep links și schemele de redirect OAuth trebuie configurate corect în Supabase Auth.

## Pași de implementare

### Faza 1: Pregătire backend (fără schimbări majore)

1. **Documentare API internă**: listă cu tabelele, RPC-urile și edge functions critice pentru mobil (produse, rezervări, chat, wallet, notificări).
2. **Verificare RLS**: ne asigurăm că toate politicile funcționează corect pentru utilizatori autentificați — aplicația mobilă va folosi același rol `authenticated`.
3. **Verificare CORS pentru edge functions**: confirmăm că toate funcțiile returnează `corsHeaders` inclusiv la erori.
4. **Configurare redirect URLs în Supabase Auth**: adăugăm schemele necesare pentru mobil (ex. `rentli://`, `com.rentli.app://`) și URL-urile publice (`https://rentli.ro/auth/callback`).

### Faza 2: Aplicația mobilă în Emergent

1. **Inițializare proiect** în Emergent cu framework nativ (React Native / Expo, dacă permite Emergent).
2. **Instalare client Supabase** în proiectul mobil.
3. **Configurare environment**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, scheme deep link.
4. **Replicare fluxuri principale**:
   - Login / register / OTP / reset parolă
   - Listare produse, filtre, categorii, hartă
   - Pagină produs, rezervare, checkout Stripe
   - Conversații și mesaje (realtime)
   - Wallet, retrageri, profil, KYC
5. **Reutilizare componente logice**: se pot copia/adapta hook-urile și funcțiile din `src/` (fără JSX) pentru a păstra consistența.

### Faza 3: Sincronizare în timp real

1. **Realtime subscriptions** pentru `messages`, `rentals`, `notifications`.
2. **Invalidare cache** la schimbări (dacă Emergent foloseșse React Query / SWR, se poate replica pattern-ul din web).
3. **Push notifications** (opțional): edge function `send-push-notification` + trigger pe `notifications`.

### Faza 4: Testare și publicare

1. **Testare end-to-end** pe același cont: acțiuni pe web văzute pe mobil și invers.
2. **Testare plăți Stripe** în modul test, inclusiv deep link de retur.
3. **Publicare App Store / Google Play** cu domeniul și deep links configurate.

## Riscuri și decizii

- **Emergent nu exportă cod React Native**: dacă Emergent generează doar web/PWA, planul se adaptează către o PWA sau Capacitor wrapper. Trebuie confirmat ce tehnologie produce.
- **Stripe nativ**: checkout-ul Stripe pe mobil poate necesita Stripe SDK nativ în loc de redirect web. Se poate păstra redirect web ca MVP.
- **KYC cu upload de documente**: funcționează pe mobil prin camera → storage, dar UI-ul trebuie adaptat.
- **Mapă**: Google Maps API key-ul actual este restricționat la `*.lovable.app`. Pentru mobil se va folosi același key cu restricții de aplicație/iOS/Android sau se va genera un key separat.

## Livrabile

1. Document cu variabilele de mediu și schemele de redirect necesare în Emergent.
2. Lista de RPCs și edge functions esențiale pentru mobil (cu semnături).
3. Configurare Supabase Auth pentru deep links.
4. (Opțional) Edge function pentru push notifications.
5. Ghid de testare cross-platform.

## Primul pas imediat

Înainte de a începe implementarea, confirmăm ce tehnologie generează Emergent (React Native, Expo, Flutter, PWA etc.) pentru a adapta configurația de Supabase Auth și deep linking.
