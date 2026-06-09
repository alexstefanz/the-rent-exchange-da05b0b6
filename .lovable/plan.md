## Problem

When a user has already submitted KYC documents, the page sometimes still shows the upload form and allows re-uploading new documents instead of a "verification in progress" state.

Root cause is in `src/components/kyc/KycInlineFlow.tsx`:

- The "already submitted" state only triggers when `kyc_cases.status` is `SUBMITTED` or `NEEDS_MANUAL_REVIEW`.
- In the database we already have at least one case stuck in `IN_PROGRESS` with all 3 documents uploaded (case `bc8f5eeb…`, 3 docs, `submitted_at = null`, `profiles.kyc_status = NOT_VERIFIED`). This happens when the final `UPDATE … status='SUBMITTED'` step silently doesn't complete (tab closed, network drop, transient RLS hiccup), leaving the row at `IN_PROGRESS` even though documents are already in storage.
- Because `canUpload = !isAlreadySubmitted && !isVerified`, the user sees the upload form again and can re-upload.

## Fix (UI + light data-recovery, no schema changes)

### 1. Treat "in processing" more broadly in `src/components/kyc/KycInlineFlow.tsx`

- Load existing `kyc_documents` for the current case (count of `id_front` / `id_back` / `selfie`).
- Define `hasAllDocsUploaded = front && back && selfie`.
- Expand the gating:
  - `isInProcessing = isAlreadySubmitted || (kycCase?.status === "IN_PROGRESS" && hasAllDocsUploaded)`
  - `canUpload = !isInProcessing && !isVerified`
- Render the existing amber "Verificare în curs / Verification in progress" card whenever `isInProcessing` is true (including stuck `IN_PROGRESS` cases that already have all 3 docs).
- Hide the file picker, name input, and "Submit" button while `isInProcessing`.

### 2. Self-heal stuck `IN_PROGRESS` cases

When the component loads a case with status `IN_PROGRESS` and 3 documents are already present:
- Fire a best-effort update `kyc_cases.status = 'SUBMITTED'`, `submitted_at = now()` (RLS already allows this transition for the owner).
- Also update `profiles.kyc_status = 'SUBMITTED'` so the global gate (`useKycGate`, `DrawerKycPill`, account dashboard) shows the correct "in progress" state everywhere.
- Invalidate `kycGate` and `currentUserProfile` queries.

### 3. Make the submit flow resilient

In `handleSubmit`, capture and surface the error from the final `.update({ status: 'SUBMITTED' })` and the `profiles` update (currently both are awaited without error handling). If either fails, keep the user on the page with a toast instead of silently leaving them in `IN_PROGRESS`.

### 4. Out of scope

- No DB schema, RLS, or trigger changes.
- No changes to the admin KYC review flow.
- No changes to `extract-id-data` edge function.

## Files to change

- `src/components/kyc/KycInlineFlow.tsx` — gating logic, doc-count query, self-heal, error handling on the final updates.

## Verification

- User with `kyc_cases.status = IN_PROGRESS` + 3 docs sees the amber "Verificare în curs" card, no upload UI.
- New submission flow still works end-to-end and ends at `SUBMITTED` with `profiles.kyc_status = SUBMITTED`.
- `DrawerKycPill` shows the amber "Verificare în curs" pill consistently.
