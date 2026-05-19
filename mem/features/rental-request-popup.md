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
- Acțiune chiriaș: `getOrCreateRentalConversation(rentalId)` → navigate `/mesaje?conv=<id>`.
- Componenta vizuală: `RentalRequestPopup.tsx`, ancorată bottom-right desktop / bottom-center mobile, z-index 120.
