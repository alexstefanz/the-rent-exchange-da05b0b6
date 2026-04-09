

## Plan: Panou detaliat utilizator în Admin

### Ce se adaugă pe pagina AdminUserDetail

Pagina actuală afișează doar informații de bază (nume, email, telefon, KYC, contoare), gestionare rol și ban. O extind cu secțiuni cu tab-uri în zona dreaptă (lg:col-span-2):

**Tab-uri noi** (folosind componenta Tabs existentă):

1. **Produse** — Lista produselor utilizatorului (titlu, categorie, preț, status activ/inactiv, approval_status, dată creare). Click duce la produs.

2. **Rezervări** — Rezervările ca chiriaș + ca proprietar (produs, date, zile, sumă, status, payment_status). 

3. **Recenzii** — Recenzii primite (user_reviews + product_reviews pe produsele lui) și recenzii date. Rating, comentariu, autor, dată.

4. **Conversații** — Lista conversațiilor în care e implicat (ca buyer sau owner). Produs, celălalt utilizator, ultimul mesaj, nr mesaje.

5. **Activitate** — Log-uri din user_activity_logs (acțiuni recente).

**Informații suplimentare în card-ul din stânga:**
- WhatsApp
- Tip cont (individual/business)
- Detalii companie (dacă business): company_name, CUI, reg_com, company_address
- Status dezactivare cont

### Modificări tehnice

**Fișier: `src/pages/admin/AdminUserDetail.tsx`**

- Extind hook-ul `useAdminUserDetail` să facă query-uri suplimentare:
  - `products` — filtrare pe `owner_id`
  - `rentals` — filtrare pe `renter_id` OR `owner_id`
  - `user_reviews` — primite (`reviewed_user_id`) + date (`reviewer_id`)
  - `product_reviews` — pe produsele lui (join prin product_id)
  - `conversations` — `buyer_id` OR `owner_id`
  - `user_activity_logs` — filtrare pe `user_id`, ultimele 50

- Înlocuiesc secțiunea de acțiuni (Role + Ban) cu un sistem de Tabs care include și acțiunile existente

- Adaug informații extra în card-ul lateral (whatsapp, account_type, company info)

**Nu sunt necesare modificări la baza de date** — toate datele sunt accesibile prin query-uri directe cu RLS admin.

### Fișiere afectate
- `src/pages/admin/AdminUserDetail.tsx` — refactorizare completă a zonei de conținut

