

## Plan: Terms & Conditions Popup at Checkout

### What we'll build
A dialog that appears at checkout Step 4 (Review & Confirm) when the user clicks the confirm button. The dialog displays the full Terms & Conditions text in a scrollable container. The checkbox to accept terms is disabled until the user scrolls to the bottom. Only after checking the box can they proceed with the reservation.

### Implementation

#### 1. Create `TermsDialog` component (`src/components/checkout/TermsDialog.tsx`)
- A Dialog with the full T&C content inside a ScrollArea with a fixed max height
- Track scroll position via `onScroll` -- when scrolled to bottom, enable the checkbox
- Checkbox labeled "Am citit și accept Termenii și Condițiile"
- "Confirmă" button disabled until checkbox is checked
- On confirm, closes dialog and triggers the actual reservation creation

#### 2. Modify `Checkout.tsx` Step 4
- Replace the direct `handleConfirmReservation` call on the confirm button with opening the TermsDialog
- The terms notice text (line 252-253) becomes a clickable trigger that also opens the dialog
- After user accepts terms in the dialog, the reservation is created

### Flow
1. User clicks "Trimite cererea" at Step 4
2. Terms dialog opens with full T&C text
3. User scrolls to bottom → checkbox becomes enabled
4. User checks the checkbox → "Confirmă" button becomes enabled
5. User clicks confirm → dialog closes, reservation is created

### Technical details
- Reuses existing T&C content from `src/pages/legal/TermsAndConditions.tsx` sections array
- Uses existing `Dialog`, `ScrollArea`, and `Checkbox` UI components
- No database changes needed

