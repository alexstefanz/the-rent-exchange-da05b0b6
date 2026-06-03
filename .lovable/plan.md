## Problem

After consolidating the wizard from 5 to 4 steps, clicking **"Publică anunțul"** on step 4 (Verificare & publicare) advances to a non-existent step 5 (empty screen with "Continuă" button) instead of submitting the listing for admin approval.

## Root cause

In `src/components/publish/PublishWizard.tsx`, `goNext()` still checks the old step number:

```ts
const goNext = () => {
  if (step === 5) {        // ← never true now (max step is 4)
    handlePublish();
    return;
  }
  ...
};
```

So on step 4 it falls through and increments to step 5, which renders nothing. The `editingFromSummary` branch also still targets step 5. Step header eyebrows still say "Pasul X din 5".

## Fix

In `src/components/publish/PublishWizard.tsx`:

1. `goNext`: change `if (step === 5)` → `if (step === 4)` so the publish button triggers `handlePublish()` on the final step.
2. `goNext` edit-mode summary branch: change `setStep(5)` / `setMaxReached(m => Math.max(m, 5))` → `setStep(4)` / `Math.max(m, 4)`.
3. Update the four step header eyebrows from `"Pasul X din 5"` / `"Step X of 5"` to `"din 4"` / `"of 4"` (Step1Category, Step2Details, the merged Location+Pricing step 3, and Step6Review which currently shows "PASUL 5 DIN 5").

No backend changes — the existing `createProduct` / `updateProduct` flow already submits to admin approval (`approval_status = 'pending'`).

## Verification

- On a new listing, reach step 4, click **Publică anunțul** → toast "Anunț trimis spre aprobare" appears and navigates to `/owner`.
- On editing an approved listing, save → resubmitted for approval as before.
- Stepper shows 4 steps and headers read "Pasul X din 4".
