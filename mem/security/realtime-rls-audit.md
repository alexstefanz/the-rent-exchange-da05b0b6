---
name: Realtime RLS audit
description: Per-table SELECT RLS coverage for every table in supabase_realtime publication, used to validate that postgres_changes cannot leak other users' events
type: feature
---
Supabase Realtime `postgres_changes` evaluates each table's SELECT RLS per subscriber JWT before delivering events. Client `filter:` args are convenience only, not security. Any new table added to `supabase_realtime` must be re-audited against this matrix.

## Tables in `supabase_realtime` (22) and SELECT scope

| Table | SELECT scope | Notes |
|---|---|---|
| admin_notifications | admin only | OK |
| conversations | buyer/owner (+admin) | OK |
| favorite_products | user_id = auth.uid() | OK |
| favorite_users | user_id = auth.uid() OR favorite_user_id = auth.uid() | Second policy added so "someone followed me" tick fires |
| kyc_cases | user_id = auth.uid() (+admin) | OK |
| kyc_documents | owner of parent case (+admin) | OK |
| messages | participant + not hidden (+admin) | OK |
| notifications | user_id = auth.uid() | OK |
| ops_tickets | requester_user_id (+admin) | OK |
| ops_ticket_messages | requester + NOT is_internal (+admin) | Admin internal notes correctly hidden |
| ops_ticket_attachments | requester + non-internal parent msg (+admin) | OK |
| product_reviews | public (true) | Intentional |
| products | active+approved+!deleted OR owner (+admin) | OK |
| profiles | auth.uid() = id (+admin) | Only self; other users' avatars/names must come from a public view, not realtime |
| rentals | renter/owner (+admin) | OK |
| rental_inspections | renter/owner of parent (+admin) | OK |
| rental_pv_documents | renter/owner of parent (+admin) | OK |
| transactions | user_id (+admin) | OK |
| user_reviews | public (true) | Intentional |
| wallet_ledger | user_id (+admin) | OK |
| withdrawal_requests | user_id (+admin) | OK |

`user_blocks` was removed from the publication (admin-only SELECT, no client subscribed).

## Rules
- Never add a table to `supabase_realtime` without a SELECT RLS policy that scopes rows to the intended audience.
- Never widen a SELECT policy purely to make a realtime feed work without weighing PII exposure — prefer a server-side aggregate or a public view.
- Channels created from an unauthenticated supabase client only receive rows visible to the `anon` role; double-check public-readable tables (`products`, `product_reviews`, `user_reviews`).