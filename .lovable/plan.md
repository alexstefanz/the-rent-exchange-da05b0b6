## Hide redundant account nav items in mobile drawer

In `src/components/layout/mobile-drawer/MobileDrawer.tsx`:

- Always remove "Contul meu" from the `accountItems` list (the profile hero card at the top already links to `/contul-meu`).
- Build `accountItems` dynamically: include "Verificare KYC" only when the user is **not** verified (i.e. `profile?.kyc_status !== "VERIFIED"`). When verified, the green KYC pill above already represents the state.
- If the resulting `accountItems` array is empty, skip rendering the entire "Cont" `DrawerNavGroup` (no empty-titled section).

No other components or business logic change.