## Problema

Banarea unui utilizator scrie acum doar `profiles.is_banned = true`, dar nu blochează nimic — nici la nivel de bază de date (RLS), nici în UI. Utilizatorul `alesso.cwalk@yahoo.com` are `is_banned = true` dar poate posta anunțuri, face rezervări, trimite mesaje, etc.

## Soluție

Vreau să aplic banarea pe două straturi: **backend (sursă de adevăr, prin RLS)** și **frontend (UX clar și butoane dezactivate)**.

### 1. Backend — enforcement prin RLS

Creez un helper `public.is_user_banned(uuid)` (SECURITY DEFINER, stable) care întoarce `true` dacă userul are `is_banned = true`. Adaug apoi clauze `AND NOT public.is_user_banned(auth.uid())` la politicile de **INSERT/UPDATE** pe:

- `products` — nu poate crea/edita anunțuri
- `rentals` — nu poate face rezervări noi
- `messages` — nu poate trimite mesaje în chat
- `conversations` — nu poate iniția conversații
- `product_reviews`, `user_reviews` — nu poate posta review-uri
- `withdrawal_requests` — nu poate cere retragere din wallet (vezi mai jos)
- `favorites` — blocat (acțiune utilizator)
- `support_tickets` / `ticket_messages` — **rămân deschise** ca să poată contesta

Politicile de **SELECT** rămân neschimbate, ca userul să-și vadă istoricul (rentals trecute, anunțuri vechi marcate inactive, mesaje vechi).

În plus:
- Trigger pe `products` care la `is_banned = true` setează `status = 'inactive'` (sau `is_active = false`) pentru toate anunțurile userului — astfel dispar de pe site imediat.
- Trigger pe `profiles` la `UPDATE OF is_banned` care:
  - când devine `true`: dezactivează produsele userului
  - când devine `false`: le lasă neschimbate (admin le reactivează manual)

### 2. Frontend — UX vizibil pentru user

În `AuthContext` adaug un câmp `isBanned` citit din `profiles` la login + un canal realtime ca să se sincronizeze imediat.

Creez un hook `useIsBanned()` și un component `<BannedBadge />` (semn de interzis 🚫 / iconiță `Ban` din lucide):

- **Header (Navbar)**: lângă avatar/„Contul tău" apare badge-ul roșu cu iconița Ban + tooltip „Cont suspendat".
- **Dropdown din „Contul tău"**: banner roșu sus cu motivul banării și link către „Contestă" (suport).
- **Buton „Adaugă anunț nou"**: dezactivat, tooltip „Cont suspendat".
- **Buton „Chat" din header**: dezactivat, tooltip identic.
- **MobileBottomNav**: butonul portocaliu de acțiune (publish) dezactivat.
- **ProductDetail / Checkout**: butonul „Rezervă" dezactivat dacă userul logat e banat, cu mesaj inline.
- **Pagini /anunțuri și /rezervări**: banner sus „Contul tău este suspendat. Anunțurile nu sunt vizibile public, nu poți primi/face rezervări noi."
- **Messages**: input dezactivat în toate conversațiile, banner sus.

### 3. Wallet — recomandarea mea

**Da, păstrează accesul read-only la wallet, dar blochează retragerile.**

Motivație:
- Userul are dreptul legal să-și vadă banii (sold + tranzacții) — e proprietatea lui.
- Blocarea totală poate duce la dispute / reclamații.
- Dar **retragerea** trebuie blocată până se decide ce se întâmplă (ex: există rezervări active, trebuie returnați bani chiriașilor, etc.).

Așa că:
- `/wallet` rămâne accesibil, vede sold și istoric.
- Butonul „Retrage" e dezactivat, cu mesaj „Retragerile sunt blocate cât timp contul este suspendat. Contactează suportul."
- RLS pe `withdrawal_requests` blochează `INSERT` pentru useri banați.

### 4. Verificare după ban

După migrație, voi testa cu userul `alesso.cwalk@yahoo.com`:
- nu poate publica anunț (UI + DB)
- nu poate trimite mesaj
- anunțurile lui existente nu mai apar în search/category
- vede badge-ul de interzis în header
- vede wallet-ul dar nu poate retrage

## Fișiere vizate

**Backend:**
- `supabase/migrations/<timestamp>_ban_enforcement.sql` — funcția `is_user_banned`, update RLS policies pe `products`, `rentals`, `messages`, `conversations`, `product_reviews`, `user_reviews`, `withdrawal_requests`, `favorites`; trigger pe `profiles.is_banned`.

**Frontend:**
- `src/contexts/AuthContext.tsx` — expune `isBanned`, sincronizare realtime
- `src/hooks/useIsBanned.ts` — hook nou
- `src/components/common/BannedBadge.tsx` + `BannedBanner.tsx` — componente vizuale noi
- `src/components/layout/Navbar.tsx` — badge lângă avatar, dezactivare „Adaugă anunț" și „Chat"
- `src/components/layout/AccountHubMenu.tsx` — banner roșu în dropdown
- `src/components/layout/MobileBottomNav.tsx` — buton publish dezactivat
- `src/pages/ProductDetail.tsx` + `src/pages/Checkout.tsx` — blochează rezervarea
- `src/pages/Messages.tsx` + `src/components/messaging/*` — input dezactivat + banner
- `src/pages/EarningsPage.tsx` (wallet) — buton retragere dezactivat + tooltip
- `src/pages/ListingsPage.tsx`, `src/pages/RentalsPage.tsx`, `src/pages/RentalsOutPage.tsx` — banner sus

## Întrebare deschisă

Pe wallet sugerez **read-only (vede sold, dar nu poate retrage)**. Dacă vrei alt comportament (ex: ascuns complet, sau retragere permisă doar pentru sold „curat"), spune-mi în comentarii la plan și ajustez înainte de implementare.