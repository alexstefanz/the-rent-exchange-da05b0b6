## Pop-up responsive: mobil bottom-center, butoane stacked

### Modificări

**`src/components/rentals/RentalPopupManager.tsx`**
- Schimb wrapperul overlay din `items-center justify-center` în responsive:
  - Mobil: `items-end justify-center pb-6` (bottom-center, cu spațiu față de marginea de jos pentru bottom nav)
  - Desktop (`sm:`): `sm:items-center sm:justify-center sm:pb-4` (rămâne centrat ca acum)
- Overlay-ul rămâne `bg-black/70 backdrop-blur-md`.

**`src/components/rentals/RentalRequestPopup.tsx`**
- Grid-ul de butoane: schimb `grid-cols-2 gap-2` în `grid grid-cols-1 gap-2 sm:grid-cols-2`
- Pe mobil: butoanele devin automat full-width unul sub altul.
- Reordonez pe mobil ca butonul primar (Acceptă / Discută cu proprietarul) să apară primul (sus), iar cel secundar (Refuză / Mai târziu) dedesubt. Folosesc `order-1 sm:order-none` pe primar și `order-2 sm:order-none` pe secundar.

### Ce rămâne neschimbat
- Conținutul cardului, logica, RPC-urile, realtime.
- Pe desktop layout-ul arată identic cu varianta actuală.