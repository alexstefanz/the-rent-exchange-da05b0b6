

## Plan

### 1. Make KYC table rows clickable (remove Acțiuni column)

In `src/pages/admin/AdminKYC.tsx`:
- Remove the "Acțiuni" `TableHead` and corresponding `TableCell` with the "Detalii" button
- Add `onClick` + `cursor-pointer` + `hover:bg-muted/50` to each `TableRow` to navigate to `/admin/kyc/${kycCase.id}` using `useNavigate`

### 2. Create user activity logs system

This requires a new database table and corresponding UI.

**Database migration** -- create `user_activity_logs` table:
- `id` (uuid, PK)
- `user_id` (uuid, not null)
- `action` (text) -- e.g. `PRODUCT_CREATED`, `PRODUCT_DELETED`, `PRICE_CHANGED`, `KYC_SUBMITTED`, `KYC_APPROVED`, `PHONE_UPDATED`, `IDENTITY_VERIFIED`
- `entity_type` (text, nullable) -- e.g. `product`, `kyc_case`, `profile`
- `entity_id` (text, nullable)
- `metadata` (jsonb, nullable) -- extra details like old/new price, product title
- `created_at` (timestamptz, default now())
- RLS: admin-only read access

**Add a "Logs" tab in KYC Detail page** (`AdminKYCDetail.tsx`):
- New tab alongside "Documente" and "Audit Log" showing activity logs for that user
- Query `user_activity_logs` filtered by `user_id`
- Display timeline with action descriptions, timestamps, and metadata

**Create API and hook**:
- `src/features/admin/userActivityLogsApi.ts` -- fetch logs by user ID
- Add hook in `src/hooks/queries/useUserActivityLogs.ts`

**Log insertion points** -- add inserts to `user_activity_logs` in existing API functions:
- `productsApi.ts` -- on create/delete product, price change
- `kycApi.ts` -- on KYC status changes (already has audit log, will also write to activity logs)
- `profileApi.ts` -- on phone/identity updates

Alternatively, database triggers could auto-log changes to products and profiles, which would be more reliable. We can create triggers on the `products` and `profiles` tables that insert into `user_activity_logs` on INSERT/UPDATE/DELETE.

### Technical details

- The `user_activity_logs` table uses `jsonb` for flexible metadata storage
- Database triggers on `products` (INSERT, UPDATE, DELETE) and `profiles` (UPDATE of phone, kyc_status) will automatically capture events without modifying existing frontend code
- The KYC audit log already exists separately and will remain; the new activity logs provide a broader user-level view
- Conversations are already stored in the `messages`/`conversations` tables -- the Logs tab will show a summary count or link, not duplicate message content

