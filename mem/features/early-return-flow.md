---
name: Early Return Flow
description: Dual-approval early return with date picker, price recalculation, available in "Produs predat" step
type: feature
---
- Visible on `RentalDetailPage` when `handoverDoneEarly && !returnDoneEarly` via `EarlyReturnCard`.
- Window: today must be strictly between `start_date` and `end_date` (first/last day excluded).
- Proposed `new_end_date` must be strictly between `start_date` and `end_date` (DB trigger `validate_early_return_request`).
- Either party can initiate; counterparty must approve via `respond-early-return` (`approve` | `reject`).
- Initiator is auto-approved; when both `early_return_renter_approved_at` and `early_return_owner_approved_at` set, status becomes `accepted` and `end_date`, `rental_days`, `subtotal` are overwritten with `early_return_new_*`.
- Price: `new_subtotal = daily_price * new_days`, refund = `subtotal - new_subtotal` (stored in `early_return_refund_amount`). Platform fee remains on original subtotal.
- Edge functions: `request-early-return` (initiate), `respond-early-return` (approve/reject). Legacy "accept" still mapped to "approve" for back-compat.
- DB columns added on `rentals`: `early_return_new_end_date`, `early_return_initiator`, `early_return_renter_approved_at`, `early_return_owner_approved_at`, `early_return_new_subtotal`, `early_return_new_rental_days`.
