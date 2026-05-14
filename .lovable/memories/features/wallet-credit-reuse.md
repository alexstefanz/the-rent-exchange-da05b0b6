---
name: Wallet Credit Reuse
description: Owners can pay accepted rentals fully from their wallet balance via pay_rental_with_wallet RPC; cancellations auto-refund to wallet
type: feature
---
- `wallet_ledger` table (signed amounts) tracks wallet debits (`rental_credit_capture`) and refunds (`rental_credit_release`).
- `rentals.wallet_credit_applied` records amount applied from wallet.
- `get_user_wallet_balance(uuid)` returns total_earnings, total_withdrawn, pending_withdrawals, wallet_spent, available.
- `pay_rental_with_wallet(rental_id)`: only renter, status=confirmed, payment_status=pending, available>=subtotal. Sets payment_status='paid', payment_method='wallet'. MVP: FULL wallet only (no Stripe split).
- `release_wallet_credit_on_cancel` trigger auto-refunds wallet_credit_applied back to renter when status flips to cancelled.
- Frontend: `useWalletBalance` hook + extra "Plătește din wallet" button in `RentalDetailPage` next to Stripe pay button (shown only when balance >= subtotal). Info note in `WalletHeroCard`.
