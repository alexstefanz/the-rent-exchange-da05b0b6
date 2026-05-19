---
name: rental-request-popup
description: Global pop-up notifying owner of new rental request and renter of approval, with direct accept/refuse + open chat actions
type: feature
---
Pop-up global mount în App.tsx via `RentalPopupManager` (lazy, în Suspense interior).

- Sursă date: RPC `get_rental_popups()` (SECURITY DEFINER) returnează coadă combinată: owner pending + renter unseen confirmed (`renter_seen_confirmation = false`).
- Realtime: subscribe pe `rentals` (publication `supabase_realtime`, REPLICA IDENTITY FULL) — INSERT pe `owner_id=eq.<uid>` cu status pending; UPDATE pe `renter_id=eq.<uid>` cu trecere la confirmed.
- Persistență: coloană `rentals.renter_seen_confirmation` BOOLEAN; flag setat la 'true' de RPC `mark_renter_confirmation_seen(_rental_id)` la click pe orice buton din pop-up de chiriaș. Pentru proprietar persistența e implicită: pop-up reapare câtă vreme status='pending'.
- Acțiuni proprietar: `respondToRental(id, 'accept'|'reject')` → edge `respond-rental-request`.
- Acțiuni chiriaș (în funcție de `outcome` returnat de RPC):
  - `confirmed` → "Vezi produsul" navighează la `/produs/<slug>`.
  - `rejected` (status=cancelled & cancelled_by=owner_id) → "Vezi produse similare" navighează la `/categorie/<category_slug>` (fallback `/cautare?q=<title>`).
- RPC `get_rental_popups` / `get_rental_popup_by_id` returnează `outcome` (`pending|confirmed|rejected`) și `category_slug`. Realtime UPDATE pe rentals declanșează popup pentru ambele tranziții (pending→confirmed sau pending→cancelled by owner).
- Componenta vizuală: `RentalRequestPopup.tsx`, ancorată bottom-right desktop / bottom-center mobile, z-index 120.
