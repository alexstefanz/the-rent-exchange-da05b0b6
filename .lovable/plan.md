

## Plan: Dashboard Cards cu badge-uri de notificare

### Ce se schimbă

Transformăm secțiunea `BalanceCard` (cardul unic cu balanța) într-un grid de 5 carduri compacte, fiecare cu badge numeric (stil NotificationBell) când există noutăți:

1. **Balanță** - sumă RON (fără badge)
2. **Favorite** - nr. favorite, badge dacă există discount-uri pe produse favorite (placeholder - momentan = nr. favorite)
3. **Mesaje** - badge cu mesaje necitite
4. **Recenzii** - badge cu recenzii noi (necitite/recente)
5. **Notificări** - badge cu notificări necitite

Fiecare card va fi clickable și va naviga la tab-ul corespunzător din profil.

### Implementare

**Fișier modificat:** `src/components/profile/BalanceCard.tsx` → redenumit logic în `DashboardCards` (sau rescris în loc)

- Rescriu componenta `BalanceCard` ca un grid responsive (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`) cu 5 mini-carduri
- Fiecare card: icon cu badge numeric suprapus (stil `absolute -top-1 -right-1 rounded-full bg-destructive`), titlu, valoare
- Query-uri existente reutilizate din `Profile.tsx` + query-uri noi:
  - **Mesaje necitite**: query pe `messages` cu `is_read = false` și `sender_id != user.id`
  - **Recenzii noi**: query pe `product_reviews` + `user_reviews` din ultimele 30 zile unde `reviewed_user_id = user.id` sau produsele userului
  - **Notificări necitite**: query existent pe `notifications`
  - **Favorite count**: query pe `favorite_products`
- Click pe card → `navigate('#tab-id')` pentru navigare la tab-ul corespunzător

**Fișier modificat:** `src/pages/Profile.tsx` - importul rămâne `BalanceCard` (sau actualizez numele)

### Stil vizual
- Grid cu carduri cu fundal gradient subtil (similar cu cardul actual de balanță)
- Badge roșu cu număr (identic cu cel din NotificationBell) pe iconul fiecărui card
- Hover effect subtil pe fiecare card

