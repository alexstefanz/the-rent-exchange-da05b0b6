## Problem

The two pending cancellation requests exist in the database (`cancel_request_status = 'pending'`), but the admin "Anulări rezervări" tab shows an empty list because the RPC `list_pending_cancellation_requests` errors out:

```
ERROR: column r.total_days does not exist
HINT: Perhaps you meant to reference the column "r.rental_days".
```

The `rentals` table uses `rental_days`, not `total_days`.

## Fix

Create a migration that recreates `public.list_pending_cancellation_requests()` with `r.rental_days` aliased as `total_days` (so the function signature and the frontend `PendingCancellationRequest.total_days` field stay unchanged — no client code edits needed).

All other fields, ordering, admin role check, and SECURITY DEFINER stay identical.

## Verification

After the migration, calling the RPC will return the 2 pending rows; the admin panel will render them automatically (React Query already polls).
