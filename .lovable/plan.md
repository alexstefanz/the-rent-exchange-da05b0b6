
# Rental flow end-to-end + Proces verbal blocking

## Goal
Make the digital PV (handover + return) a **mandatory, in-timeline, blocking** step that protects both parties, with clear next-action cards, gating, dispute path, and notifications. Reuse existing 7-step `RentalTimeline`, `InspectionDialog`, `rental_inspections`, `NextActionCard`, `useNotifications`. No payment/Stripe contract changes.

## Status mapping (kept compatible with current DB)
We keep current `rentals.status` values and **derive** the richer states from columns instead of renaming:

| Spec status | Derived from |
|---|---|
| `request_sent` | `status=pending` |
| `approved` | `status=confirmed` AND no `pickup_agreed_at` |
| `handover_pending` | `status=confirmed` AND `pickup_agreed_at` set, no `handover_confirmed_at` |
| `received_confirmed` | `handover_confirmed_at` set (transient — flips to active_rental same step) |
| `active_rental` | `status=active` |
| `return_pending` | `status=active` AND end_date past, no `return_confirmed_at` |
| `completed` | `status=completed` |
| `cancelled` | `status=cancelled` |
| `dispute_review` | new column `dispute_status='open'` (any phase) |

New columns needed (single migration):
- `rentals.pickup_agreed_at timestamptz` + `pickup_location text` + `pickup_time timestamptz` (set when both parties confirm meeting in chat via a dedicated card).
- `rentals.dispute_status text` (`none|open|resolved`, default `none`) + `dispute_opened_at`, `dispute_phase` (`handover|return`), `dispute_reason text`.
- `rental_inspections`: add `locked_at timestamptz` (set when both parties confirmed that phase — prevents edits/deletes via RLS).
- Tighten RLS: deny UPDATE/DELETE on `rental_inspections` once `locked_at IS NOT NULL`.

Server-side validation triggers (no CHECK on time):
- Trigger on `rentals` UPDATE: forbid setting `handover_confirmed_at` unless both `owner` + `renter` `checkout` inspections exist with `photos_count >= 3`. Forbid setting `return_confirmed_at` unless both `checkin` inspections exist with `photos_count >= 3`. Bypass for service_role / admins.
- Trigger to auto-lock matching inspections (set `locked_at = now()`) when both parties' inspections of a phase are present.

## Frontend changes

### 1. `RentalTimeline.tsx`
Keep 7 steps, but compute richer sub-states for the **current step badge** and color (e.g. step 3 highlights "PV în așteptare", step 6 shows "Returnare în desfășurare"). Add a small `dispute_review` overlay (red ring + "În verificare" label) on whichever step is active when `dispute_status='open'`.

### 2. New `PickupArrangementCard.tsx` (between approved → handover_pending)
Shown when `status=confirmed` and `pickup_agreed_at` is null. Two CTAs:
- "Discută în chat" → opens conversation
- "Confirmă predarea organizată" → opens small sheet with date/time + place inputs; both parties must press Confirm. We store proposals in a tiny new `rental_pickup_proposals` table OR (simpler) a single `pickup_proposal jsonb` on `rentals` with `{proposed_by, time, place, owner_confirmed_at, renter_confirmed_at}`. When both confirmed → set `pickup_agreed_at`. **Blocks step 4 until done.**

### 3. `NextActionCard.tsx` (extend, do not rewrite)
Add new variants per derived status:
- `handover_pending` (owner): "Completează PV-ul de predare (min 3 poze, checklist)" → opens `InspectionDialog` (phase=`checkout`, role=`owner`).
- `handover_pending` (renter, after owner): "Verifică și confirmă primirea" → opens `InspectionDialog` (phase=`checkout`, role=`renter`) with a "Semnalează probleme" link → opens `OpenDisputeDialog`.
- `return_pending` (renter first): "Completează PV-ul de returnare".
- `return_pending` (owner, after renter): "Verifică produsul returnat" + "Semnalează probleme".
- `dispute_review`: red card "Rezervarea este în verificare" + "Vezi tichetul".
Each card shows a checklist progress (`Poze 2/3 · Checklist 4/6`) so the user knows exactly what's missing. Pulse animation only on the active step (already done).

### 4. `InspectionDialog.tsx` — make it production-grade PV
- **Min 3 photos** (not 1). Disable submit otherwise; show clear counter `Poze X/3 minim`.
- Add an explicit "Declar că produsul este predat în starea descrisă" checkbox required to submit.
- After submit, if I'm the **second** party, render a green "Confirm primirea / returnarea" button that calls `confirmHandover` / `confirmReturn` server-side (which will only succeed if the trigger conditions are met), and a secondary outline "Semnalează probleme" button.
- Once `locked_at` is set, render read-only with a small "PV blocat" badge.
- Capture device/timestamp metadata in `rental_inspections` (extend `notes` → add a `metadata jsonb` column with `userAgent`, `viewport`, `submittedAt`).

### 5. New `OpenDisputeDialog.tsx`
Reason textarea (min 20 chars) + photos already uploaded auto-attached. On submit:
- Sets `rentals.dispute_status='open'`, `dispute_phase`, `dispute_reason`.
- Calls existing ops-tickets API to create a TCK with linked rental + product + last inspections.
- Sends notifications to both parties and admins.

### 6. `confirmHandover` / `confirmReturn` (`ownerRentalsApi.ts`)
Wrap in try/catch around the new trigger error (`PV_INCOMPLETE`) and surface a toast: "Nu poți confirma predarea înainte ca ambele părți să completeze procesul verbal".

### 7. Reminders
`supabase/functions/notify-return-day` already exists — verify it triggers 24h before `end_date`. Add a new daily cron entry that emits a "Pregătește predarea" notification when `pickup_agreed_at` is within 12h. Use existing `send-general-notification` + `send-rental-notification` paths; no new email templates required (reuse generic).

### 8. Notifications
Add types in `notificationCategory.ts`: `pv_handover_required`, `pv_handover_completed`, `pv_return_required`, `pv_return_completed`, `dispute_opened`. Routed to category `reservation` (or new `dispute` red category for the last one).

### 9. Review prompt (already exists)
After `completed`, the existing `LeaveReviewDialog` is shown via NextActionCard step 7. Add "Amintește-mi mai târziu" (snooze 24h via localStorage) + "Skip" (also persisted). Review remains accessible from rental history.

## Files to create
- `src/components/dashboard/PickupArrangementCard.tsx`
- `src/components/dashboard/OpenDisputeDialog.tsx`
- `src/components/dashboard/PvProgressBadge.tsx` (small "Poze 2/3 · Checklist 4/6")
- `supabase/migrations/<ts>_pv_handover_gate.sql` (columns + triggers + RLS lock)

## Files to edit
- `src/features/rentals/inspectionApi.ts` — min photos = 3, declaration field, metadata.
- `src/components/dashboard/InspectionDialog.tsx` — declaration checkbox, locked state, dispute button, second-party confirm CTA.
- `src/features/rentals/ownerRentalsApi.ts` — handle PV_INCOMPLETE error, add `agreePickup`, `openDispute` helpers.
- `src/components/dashboard/NextActionCard.tsx` — new variants + PV progress.
- `src/components/dashboard/RentalTimeline.tsx` — dispute overlay.
- `src/data/uxCopy.ts` — new RO/EN strings for PV gates, dispute, pickup arrangement.
- `src/lib/notificationCategory.ts` — new types.
- `src/hooks/useRentalRealtime.ts` — subscribe to `rental_inspections` + `rentals` updates so timeline + cards refresh instantly.

## Out of scope
- No Stripe flow change (capture still happens on `confirmReturn`; if dispute opens, capture is simply deferred until dispute resolves — admins resolve via existing `AdminReservations`).
- No new email templates (reuse `send-general-notification`).
- No category/messaging redesign (uses existing chat/timeline).

## Acceptance
1. Owner cannot confirm handover before owner PV (3+ photos, checklist, declaration) AND renter PV exist — server returns PV_INCOMPLETE.
2. Renter sees "Verifică și confirmă primirea" only after owner submitted his PV; can either confirm or open dispute.
3. After both PVs are saved, both rows become read-only (`locked_at` set), enforced by RLS.
4. Same gating for return PV.
5. `dispute_review` displays a red overlay on timeline + locks `confirmReturn` until admin resolves (`dispute_status='resolved'`).
6. Pickup arrangement card blocks transition to step 4 until both confirm time + place.
7. Notifications + 24h reminder fire for both PV phases.
