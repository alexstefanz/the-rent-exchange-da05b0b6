# Ghid de integrare: Aplicație mobilă Emergent ↔ Rentli Web App

## Scop

Acest document explică cum să conectezi o aplicație nativă mobilă construită în **Emergent** la același backend folosit de web app-ul Rentli, astfel încât cele două aplicații să partajeze utilizatori, date, conversații, rezervări și plăți în timp real.

## Arhitectură

Web app-ul și aplicația mobilă sunt două frontend-uri separate care vorbesc cu același backend:

- **Backend comun**: Lovable Cloud (Supabase) — auth, PostgreSQL, RLS, RPCs, Realtime, Storage, Edge Functions.
- **Web app**: React + Vite + TypeScript + Tailwind.
- **Mobile app**: Aplicație nativă generată de Emergent (Expo + React Native + TypeScript).

Sincronizarea se realizează **nu prin copierea datelor**, ci prin conectarea directă la același backend. Orice modificare făcută pe mobil este vizibilă instant pe web (și invers) pentru că ambele citesc/scriu în aceleași tabele.

## 1. Variabile de mediu necesare în Emergent

Aplicația mobilă are nevoie de aceleași valori pe care le folosește și web app-ul:

```bash
SUPABASE_URL=<aceeași valoare ca VITE_SUPABASE_URL din web app>
SUPABASE_ANON_KEY=<aceeași valoare ca VITE_SUPABASE_PUBLISHABLE_KEY din web app>
```

> Aceste valori se găsesc în fișierul `.env` al web app-ului sau în configurarea proiectului Lovable. Sunt chei publice (anon key), deci pot fi incluse în build-ul mobil.

## 2. Configurare Supabase Auth pentru deep linking

Pentru ca login-ul social (Google / Apple) și resetarea parolei să funcționeze în aplicația nativă, trebuie adăugate URL-urile de redirect în Lovable Cloud:

1. Deschide **Cloud → Users → Auth Settings → URL Configuration**.
2. Adaugă următoarele redirect URLs:
   - `https://rentli.ro/auth/callback`
   - `https://www.rentli.ro/auth/callback`
   - `rentli://auth/callback`
   - `com.emergent.mobilemarketplace.da8t0c://auth/callback`

> Acestea sunt valorile confirmate pentru aplicația generată de Emergent.

## 3. Instalare client Supabase în aplicația mobilă

Dacă Emergent generează cod React Native / Expo, instalează clientul oficial:

```bash
npm install @supabase/supabase-js
# sau
yarn add @supabase/supabase-js
```

Pentru Expo, se poate folosi și `@supabase/supabase-js` cu AsyncStorage:

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

## 4. Fluxuri principale de replicat în mobil

Aplicația mobilă trebuie să implementeze aceleași fluxuri ca web app-ul, apelând aceleași RPCs și edge functions:

### Autentificare
- `supabase.auth.signUp` / `signInWithPassword`
- `supabase.auth.signInWithOtp` (SMS) + `verifyOtp`
- `supabase.auth.signInWithOAuth` (Google / Apple) cu `redirectTo`
- `supabase.auth.resetPasswordForEmail`
- `supabase.auth.updateUser({ password })` pe ecranul de resetare

### Produse și căutare
- Listare homepage: `get_homepage_popular_products()`
- Listare categorie: `get_products_map_points(lat, lng, radius_km, category, ...)`
- Detalii produs: `get_product_extended_stats(product_id)`
- Vizualizări: `track_product_view(product_id, visitor_hash)`
- Căutare/filtrare direct pe tabela `products` (RLS permite doar produsele `approved` și `deleted_at IS NULL`)

### Rezervări
- Creare: `supabase.from('rentals').insert(...)`
- Acceptare/refuz: `supabase.functions.invoke('respond-rental-request', { body: { rental_id, action, reason } })`
- Detalii: `get_rental_by_public_id(public_id)` sau `get_rental_full_detail(rental_id)`
- Predare/returnare: `confirm_rental_handover(...)`, `confirm_rental_return(...)`

### Plăți
- Stripe checkout: `supabase.functions.invoke('create-checkout-session', { body: { rental_id, ... } })`
- Verificare plată: `supabase.functions.invoke('verify-stripe-payment', { body: { rental_id } })`
- Wallet: `get_user_wallet_balance(user_id)` + `supabase.from('wallet_ledger').select(...)`

### Conversații și mesaje
- Listare conversații: `get_user_conversations(user_id)`
- Mesaje din conversație: `supabase.from('messages').select(...).eq('conversation_id', id)`
- Trimitere mesaj: `supabase.from('messages').insert(...)`
- Realtime: subscribe la `messages:conversation_id=...` pentru actualizări live

### Profil și KYC
- Profil: `supabase.from('profiles').select(...).eq('id', user_id).single()`
- Update profil: `supabase.from('profiles').update(...).eq('id', user_id)`
- KYC: `supabase.from('kyc_cases').select(...)` + upload documente în Storage

### Retrageri și IBAN
- IBAN-uri: `supabase.from('payout_ibans').select(...)`
- Cereri retragere: `supabase.from('withdrawal_requests').insert(...)`

## 5. Edge functions disponibile

Toate funcțiile de mai jos pot fi apelate din mobil cu `supabase.functions.invoke('<nume>', { body: {} })`:

| Funcție | Scop |
|---------|------|
| `create-checkout-session` | Inițiază plată Stripe pentru o rezervare |
| `verify-stripe-payment` | Verifică statusul plății Stripe |
| `capture-rental-payment` | Capturează fondurile reținute |
| `respond-rental-request` | Proprietar acceptă/refuză o cerere de închiriere |
| `send-message-notification` | Notificare la mesaj nou |
| `send-rental-notification` | Notificare la evenimente rezervare |
| `generate-pv-pdf` | Generează Procesul Verbal de predare/returnare |
| `translate-product` | Traduce automat titlu/descriere RO→EN |
| `scan-url` | Verifică siguranța unui link |
| `odoo-proxy` | Sync lead-uri către Odoo CRM |
| `process-email-queue` | Procesare emailuri (intern) |

> Toate funcțiile returnează header-urile CORS necesare, deci sunt compatibile cu apeluri cross-origin și din aplicații native.

## 6. Realtime / sincronizare live

Pentru sincronizare în timp real, abonează-te la canalele Supabase Realtime:

```typescript
const channel = supabase
  .channel('messages:' + conversationId)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload) => {
      // Adaugă mesajul nou în state
    }
  )
  .subscribe();
```

Canale utile:
- `messages:conversation_id=eq.<id>` — mesaje noi în conversația activă
- `rentals:renter_id=eq.<id>` și `rentals:owner_id=eq.<id>` — schimbări de status la rezervările utilizatorului
- `notifications:user_id=eq.<id>` — notificări noi

## 7. Imagini și Storage

Imaginile produselor sunt stocate în bucket-ul public al Supabase Storage. URL-urile sunt salvate în coloana `products.images` (array de string-uri).

Pentru a obține un URL public valid:

```typescript
const { data } = supabase.storage.from('product-images').getPublicUrl(path);
const url = data.publicUrl;
```

La upload din mobil (camera/galerie):

```typescript
const { data, error } = await supabase.storage
  .from('product-images')
  .upload(`${userId}/${productId}/${fileName}`, file, {
    contentType: 'image/jpeg',
  });
```

> Bucket-ul folosit de web app pentru imagini de produse este `product-images`.

## 8. Securitate și constrângeri

- Aplicația mobilă trebuie să respecte aceleași reguli RLS ca web app-ul. Nu poate citi/scrie date ale altor utilizatori.
- Proprietarii nu se pot auto-aproba; statusurile `approved`/`rejected` sunt controlate de admin.
- Plățile necesită KYC `VERIFIED`.
- Mesajele sunt moderate; nu se permite date de contact în titluri/descrieri/chat.
- Toate acțiunile sunt logate în `user_activity_logs`.

## 9. Checklist de testare cross-platform

După ce aplicația mobilă este funcțională, testează:

- [ ] Creează un cont pe web → loghează-te pe mobil cu aceleași credențiale.
- [ ] Creează un anunț pe mobil → apare pe web în moderare.
- [ ] Aprobă anunțul din admin → apare în listarea de pe mobil.
- [ ] Trimite o cerere de închiriere de pe mobil → proprietarul o vede pe web.
- [ ] Acceptă cererea de pe web → chiriașul primește notificare pe mobil.
- [ ] Trimite un mesaj în conversație → apare instant pe celălalt dispozitiv.
- [ ] Efectuează o plată Stripe test → statusul se actualizează pe ambele platforme.
- [ ] Completează PV de predare pe mobil → statusul se schimbă și pe web.

## 10. Deep links configurate în Emergent

Conform configurării `app.json` din Emergent, aplicația mobilă recunoaște următoarele deep links:

| Deep link | Acțiune |
|-----------|---------|
| `rentli://product/<id>` | Deschide pagina unui produs |
| `rentli://rental/<id>` | Deschide detaliile unei închirieri |
| `rentli://chat/<id>` | Deschide o conversație |
| `rentli://notifications` | Deschide lista de notificări |

Aceste link-uri pot fi folosite în notificări push, emailuri sau SMS-uri pentru a direcționa utilizatorul direct în aplicația mobilă.

## 11. Ce trebuie să faci în continuare

1. **Configurează redirect URLs în Lovable Cloud** cu valorile de la secțiunea 2.
2. **Setează variabilele de mediu** `SUPABASE_URL` și `SUPABASE_ANON_KEY` în proiectul Emergent.
3. **Instalează `@supabase/supabase-js`** în proiectul mobil și inițializează clientul (vezi secțiunea 3).
4. **Replică fluxurile principale** din web app în aplicația mobilă, folosind RPC-urile și edge functions listate mai sus.
5. **Testează sincronizarea** cu checklist-ul de la secțiunea 9.

Dacă vrei, pot genera un template de proiect Expo/Emergent cu conexiunea Supabase deja configurată și câteva ecrane de bază (login, listare produse, detalii produs).
