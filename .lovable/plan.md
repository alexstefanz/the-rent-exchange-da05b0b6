

## Plan: Notificări email esențiale pentru platformă

### Stare curentă
Email-urile existente acoperă deja:
- **Cerere nouă de închiriere** (owner + renter) ✅
- **Acceptare / Respingere cerere** (owner + renter) ✅
- **Mesaj nou în chat** (recipient) ✅
- **Anulare cerere** (owner + renter) ✅
- **Schimbare parolă** ✅

### Ce lipsește și vom adăuga

#### 1. Email de bun venit la înregistrare
- Se trimite după verificarea OTP cu succes (contul confirmat)
- Conținut: salut personalizat, ce poate face pe platformă, CTA spre homepage
- Trigger: apel din `Auth.tsx` după `verifyOtp` reușit

#### 2. Email review primit (recenzie nouă)
- Când cineva primește o recenzie pe profil sau pe un produs
- Trigger: apel din codul de creare recenzie (`productReviewsApi.ts` / `reviewsApi.ts`)
- Conținut: cine a lăsat recenzia, rating, comentariu, CTA spre profil

#### 3. Notificare produs nou publicat (confirmare proprietar)
- Când un utilizator publică un produs nou
- Trigger: apel din `NewProduct.tsx` după insert reușit
- Conținut: confirmare produs publicat, titlu, CTA spre anunț

### Implementare

#### Edge function nouă: `send-general-notification`
O singură edge function generică care acceptă un `type` și trimite email-ul corespunzător. Tipuri suportate:
- `welcome` — email bun venit (primește `email`, `full_name`)
- `review_received` — recenzie primită (primește `reviewer_name`, `rating`, `comment`, `recipient_user_id`, `product_title?`)
- `product_published` — produs publicat (primește `user_id`, `product_title`, `product_slug`)

Reutilizează `buildEmailTemplate` identic cu celelalte funcții, aceleași stiluri RentNow.

#### Modificări frontend
- `src/pages/Auth.tsx` — după OTP verificat, apelează `send-general-notification` cu type `welcome`
- `src/features/products/productReviewsApi.ts` — după insert recenzie, apelează cu type `review_received`
- `src/pages/NewProduct.tsx` — după publicare produs, apelează cu type `product_published`

#### Config
- Adaugă `[functions.send-general-notification] verify_jwt = false` în `config.toml` (gestionat automat)

### Fișiere
- **Creat**: `supabase/functions/send-general-notification/index.ts`
- **Modificat**: `src/pages/Auth.tsx`, `src/features/products/productReviewsApi.ts`, `src/pages/NewProduct.tsx`

