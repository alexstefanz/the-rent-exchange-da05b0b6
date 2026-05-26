## Goal

Re-audit every table in the `supabase_realtime` publication and confirm that, given current RLS SELECT policies, a subscribed client cannot receive realtime events on rows it cannot SELECT — i.e. Realtime row-filtering equals RLS row-visibility for every flagged table.

## Background

Supabase Realtime `postgres_changes` evaluates the table's `SELECT` RLS policy per subscriber, using their JWT, before delivering each INSERT/UPDATE/DELETE event. The client-supplied `filter:` argument is a convenience, not a security boundary. Therefore the audit checks RLS — not the client filters.

## Tables currently in `supabase_realtime`

22 tables: `admin_notifications, conversations, favorite_products, favorite_users, kyc_cases, kyc_documents, messages, notifications, ops_ticket_attachments, ops_ticket_messages, ops_tickets, product_reviews, products, profiles, rental_inspections, rental_pv_documents, rentals, transactions, user_blocks, user_reviews, wallet_ledger, withdrawal_requests`.

## Audit matrix (already inspected)

```text
Table                    | SELECT scope                                | Verdict
-------------------------|---------------------------------------------|----------
admin_notifications      | admin only                                  | OK
conversations            | buyer/owner or admin                        | OK
favorite_products        | user_id = auth.uid()                        | OK
favorite_users           | user_id = auth.uid()                        | OK (1)
kyc_cases                | user_id = auth.uid() (+admin)               | OK
kyc_documents            | owner of parent kyc_case (+admin)           | OK
messages                 | participant + not hidden (+admin)           | OK
notifications            | user_id = auth.uid()                        | OK
ops_tickets              | requester_user_id (+admin)                  | OK
ops_ticket_messages      | requester + not internal (+admin)           | OK (2)
ops_ticket_attachments   | requester + not internal-msg (+admin)       | OK
product_reviews          | public (true)                               | INTENTIONAL
products                 | active+approved+!deleted OR owner (+admin)  | OK (3)
profiles                 | auth.uid() = id (+admin)                    | REVIEW (4)
rentals                  | renter / owner (+admin)                     | OK
rental_inspections       | renter/owner of parent (+admin)             | OK
rental_pv_documents      | renter/owner of parent (+admin)             | OK
transactions             | user_id = auth.uid() (+admin)               | OK
user_blocks              | admin only                                  | REVIEW (5)
user_reviews             | public (true)                               | INTENTIONAL
wallet_ledger            | user_id = auth.uid() (+admin)               | OK
withdrawal_requests      | user_id = auth.uid() (+admin)               | OK
```

## Items to verify / flag

(1) **favorite_users** — `useGlobalRealtime` listens on `favorite_user_id=eq.userId` to know "someone favorited me". The current SELECT policy only allows the row owner (`user_id = auth.uid()`), so the favorited user will NOT receive the event. Not a leak, but a functional gap. Confirm whether intended. If a "followers" realtime feed is desired, add a SELECT policy `favorite_user_id = auth.uid()` (privacy trade-off: exposes who follows whom — fine if profile follower lists are already public).

(2) **ops_ticket_messages** — Realtime delivers only non-internal messages to the requester. `useTicketRealtime` and `useGlobalRealtime` both rely on this. Admin notes (`is_internal=true`) correctly stay hidden. OK.

(3) **products** — Anyone (incl. anon) receives events for active/approved rows. Owners get UPDATE events on their own non-approved/draft products. Admin sees all. RLS is evaluated against the **new** row for INSERT/UPDATE and **old** row for DELETE — confirm REPLICA IDENTITY is FULL (verified for the 7 tables added in `20260521133647`); the rest rely on default identity which still leaks only the PK on delete. No payload leakage beyond PK.

(4) **profiles** — `SELECT` policy is `auth.uid() = id` only. The app subscribes to `profiles UPDATE` filtered on `id=eq.userId` in `useProfileRealtime` / `useAccountDashboard`. Per-user gating is correct, no PII leaks. However, parts of the UI display other users' avatar/name — those reads must go through a public view (`profiles_public` or similar). Verify that no realtime listener subscribes to other users' profiles (none found in the search). OK as long as we keep it that way.

(5) **user_blocks** — In publication but SELECT is admin-only. Non-admin subscribers receive nothing. Either:
   - Remove from `supabase_realtime` (no client uses it), or
   - Add `(blocker_id = auth.uid() OR blocked_id = auth.uid())` SELECT policy if needed for live block UX.
   No leak today; cleanup recommendation only.

(6) **Implicit cross-user broadcasts to audit at runtime**:
   - `useAccountDashboard` subscribes `messages` with no filter — RLS scopes delivery to participants. ✓
   - `useHomepageActivity` subscribes `rentals` with no filter — non-participants see no events (rentals SELECT denies them). Expected behaviour, but it means the "homepage live activity" widget only ticks for the viewer's own rentals. Functional, not security. Confirm UX intent (likely fine since the widget uses cached aggregate data and only needs a tick to refresh).
   - `AdminReports.tsx`, `useAdminTicketsRealtime` subscribe with no filter — RLS restricts to admins. ✓

## Verification steps

1. Run `pg_publication_tables` snapshot and check each table has RLS enabled (`pg_class.relrowsecurity = true`). Already shown enabled in the schema context; re-confirm with a single query.
2. For each table above, generate the SELECT policy list (already collected) and record the matrix in `mem://security/realtime-rls-audit.md` as the authoritative reference.
3. Spot-test 4 scenarios with two test users A and B using a throwaway Node script that opens an authenticated realtime channel and inserts rows as the other user:
   - A subscribes `notifications`, B inserts a notification for A's user_id (only via service role) → A receives. B inserts for self → A receives nothing.
   - A subscribes `messages` for a conversation it does not belong to → no events.
   - A subscribes `rentals` (no filter) while B creates a rental owned by C → A receives nothing.
   - A subscribes `profiles` UPDATE → updates to B's profile produce no event for A.
4. Document any failures and open follow-up migrations.

## Proposed follow-up actions (only after verification)

- Drop `user_blocks` from `supabase_realtime` if no client needs it, OR add the self-block SELECT policy.
- Optional: add `favorite_users` SELECT policy `favorite_user_id = auth.uid()` to enable the "followed me" realtime tick.
- Persist the audit matrix as a memory file so future Realtime additions get reviewed.

## Out of scope

- Changing existing public RLS on `product_reviews` / `user_reviews` (intentional).
- Edge function / service-role write paths.
- Realtime Broadcast/Presence channels (not in the postgres_changes audit).
