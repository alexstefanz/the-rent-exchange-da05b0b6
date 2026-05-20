# Fix: balanța proprietarului nu reflectă rentalurile plătite din wallet

## Cauza reală (confirmată în DB pentru RNT-000124)

`useAccountDashboard.ts` calculează `availableBalance` sumând rândurile din tabela `transactions`. Dar `pay_rental_with_wallet` **nu inserează nimic în `transactions`** — actualizează doar `rentals` (payment_status='paid', payment_method='wallet') și inserează un debit în `wallet_ledger` pentru chiriaș.

Rezultat: proprietarul X (gps@primaconstruct.ro) are real 4 RON disponibili (confirmat: `get_user_wallet_balance` returnează `available: 4`), dar dashboardul afișează 0 pentru că nu există nicio tranzacție de tip `owner_payout` în `transactions`.

## Modificări

### `src/hooks/useAccountDashboard.ts`

1. **Înlocuiește calculul din `transactions`** cu apel RPC `get_user_wallet_balance(_user_id)` — singura sursă de adevăr, care include: `owner_payout` din rentalurile paid/captured/authorized − withdrawals − pending + `wallet_ledger`.
2. **`monthlyEarnings`** se calculează din `rentalsAsOwner` (rentaluri cu `payment_status ∈ {paid, captured, authorized}` create luna curentă), nu din `transactions`.
3. **Realtime**: în callback-ul `invalidate`, invalidez și `["walletBalance", userId]` (folosit de `useWalletBalance`), nu doar `["accountDashboard", userId]`. Adaug subscription nou pe `wallet_ledger` filtrat pe `user_id`, ca să prind debitele/creditele de wallet (cancel-refund, plată wallet).

### Migrație DB

Adaug `wallet_ledger` în publicația `supabase_realtime` (dacă nu e deja) pentru ca subscription-ul de mai sus să primească evenimente.

## Out of scope
- Nu modific `pay_rental_with_wallet` și nu introduc înregistrări în `transactions` pentru plățile din wallet — RPC-ul `get_user_wallet_balance` deja gestionează corect ambele căi (Stripe + wallet).
- Nu schimb UI-ul casetei de balanță; doar sursa de date din hook.

## Verificare
După deploy, pentru owner `gps@primaconstruct.ro` dashboardul trebuie să afișeze **4 RON disponibili** (în loc de 0), iar la finalizarea unui rental plătit din wallet balanța proprietarului trebuie să se actualizeze în realtime fără refresh.
