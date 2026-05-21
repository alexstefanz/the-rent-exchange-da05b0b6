## Obiectiv
Eliminăm necesitatea de refresh manual pe toată platforma — auditul a identificat câteva zone unde lipsește realtime sau unde abonamentele existente au bug-uri silențioase.

## Constatări (audit)

### Tabele care NU sunt în publicația `supabase_realtime`
Relevante pentru UI care necesită realtime:
- `product_reviews`
- `user_reviews`
- `favorite_products`
- `favorite_users`
- `ops_ticket_attachments`
- `kyc_documents` (utilă în KYC inline)
- `user_blocks` (blocare/deblocare nu se reflectă instant în chat)

### Bug-uri în abonamentele existente
- `src/hooks/useGlobalRealtime.ts` linia 204 filtrează `ops_tickets` după `user_id=eq.${userId}`, dar coloana reală e `requester_user_id` → INSERT/UPDATE pe tichet **nu invalidează niciodată** cache-urile din global. Inbox-ul de tichete depinde acum doar de `useUserTicketsRealtime` (corect), dar invalidarea pentru `["user-tickets"]` / `["ticket", id]` din global e moartă.

### Componente fără realtime
- **`/recenzii` (`ReviewsTab`)** — 4 query-uri pe `product_reviews` și `user_reviews`, fără abonament. Dacă cineva îți lasă o recenzie acum, nu apare până la refresh.
- **`UserProfile`** — secțiunea de recenzii și statistici (`statistics.reviews_count`, rating) se calculează la mount; nu se reactualizează.
- **`ProductReviewsSection` + `ReviewSummaryCard`** pe pagina produsului — recenziile noi nu apar live.
- **`BalanceCard` / dashboard hero** — `reviewsCount` se ia o singură dată.
- **Favorite (inimă)**: dacă adaugi/scoți pe alt device sau tab, nu se reflectă. La fel pentru favorite_users (urmărit).
- **`useTicketRealtime`** — nu invalidează cache pentru atașamente noi (`ops_ticket_attachments`).

### Zone deja OK (verificate)
- Mesaje, conversații, notificări, rentals, rental_pv_documents, rental_inspections, products (owner), wallet_ledger, transactions, withdrawal_requests, kyc_cases, profiles (self), admin notifications, ops_tickets (admin + user via `useUserTicketsRealtime`).

## Plan de implementare

### 1. Migrație: adăugare tabele lipsă în publicație
```sql
ALTER TABLE public.product_reviews    REPLICA IDENTITY FULL;
ALTER TABLE public.user_reviews       REPLICA IDENTITY FULL;
ALTER TABLE public.favorite_products  REPLICA IDENTITY FULL;
ALTER TABLE public.favorite_users     REPLICA IDENTITY FULL;
ALTER TABLE public.ops_ticket_attachments REPLICA IDENTITY FULL;
ALTER TABLE public.kyc_documents      REPLICA IDENTITY FULL;
ALTER TABLE public.user_blocks        REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE
  public.product_reviews,
  public.user_reviews,
  public.favorite_products,
  public.favorite_users,
  public.ops_ticket_attachments,
  public.kyc_documents,
  public.user_blocks;
```

### 2. Fix bug ops_tickets în `useGlobalRealtime.ts`
Schimbăm `filter: user_id=eq.${userId}` → `filter: requester_user_id=eq.${userId}` și extindem invalidarea pe `["userTickets"]` (cheia reală folosită de inbox).

### 3. Extindere `useGlobalRealtime` cu abonamente noi (per user)
Adăugăm la canalul global:
- `user_reviews` filtrat pe `reviewed_user_id=eq.${userId}` → invalidează `["user-reviews", userId]`, `["accountDashboard", userId]`, `["userStatistics", userId]`.
- `product_reviews` (event `*`, fără filtru — RLS este public) → invalidează `["product-reviews-received", userId]`, `["product-reviews-given", userId]`, `["product-reviews", productId]`, `["accountDashboard", userId]`.
- `favorite_products` filtrat pe `user_id=eq.${userId}` → invalidează `["favorite-products", userId]`.
- `favorite_users` filtrat pe `user_id=eq.${userId}` și `favorite_user_id=eq.${userId}` → invalidează `["favorite-users", userId]`, `["followers", userId]`.

### 4. Hook nou `useProductReviewsRealtime(productId)`
Pentru paginile publice de produs (`ProductReviewsSection`, `ReviewSummaryCard`, `ProductCard` rating) — abonament local cu filter `product_id=eq.${productId}` care invalidează query-urile relevante. Mount în `ProductDetail`.

### 5. Extindere `useTicketRealtime`
Adăugăm `.on(..., table: "ops_ticket_attachments", filter: ticket_id=eq.${ticketId})` → invalidează aceleași chei ca pentru mesaje.

### 6. Cleanup
- Verificăm că nicio invalidare nouă nu rulează la utilizator neautentificat.
- Numele canalelor includ userId / productId pentru izolare.

## Detalii tehnice
- Toate filtrele realtime folosesc coloanele reale (confirmate în schema).
- RLS-ul existent permite SELECT public pe `product_reviews` și `platform_*` (deja folosite), deci realtime va livra corect payload-ul.
- `favorite_users` are 2 abonamente (urmăritor/urmărit) pentru a actualiza ambele liste.
- Nu modificăm UI; doar adăugăm invalidări — randările se fac prin React Query.

## Verificare
1. Deschid /recenzii într-un tab și las o recenzie din alt cont/tab → apare instant.
2. Adaug favorită pe alt device → inima se umple fără refresh.
3. Admin aprobă KYC → /verificare se actualizează (deja confirmat în iterația anterioară, dar revalidăm).
4. Suport: admin răspunde la tichet → utilizatorul vede mesajul + atașamentul live.
5. Recenzie nouă pe produs → secțiunea recenzii + rating mediu se actualizează fără refresh.
