## Obiectiv
În popup-ul global care îi apare chiriașului când proprietarul i-a aprobat cererea, butonul principal nu va mai duce la pagina produsului, ci la pagina închirierii respective (`/rezervari/<public_id>`).

## Modificări

### 1. `src/components/rentals/RentalRequestPopup.tsx`
- Schimbă eticheta butonului din modul renter (`outcome === "confirmed"`) din **„Vezi produsul" / „View item"** în **„Vezi închirierea" / „View rental"**.
- Restul comportamentului (loading state, dismiss, „Mai târziu") rămâne identic.
- Cazul `isRejected` (Vezi produse similare) și modul `owner` (Acceptă/Refuză) nu se modifică.

### 2. `src/components/rentals/RentalPopupManager.tsx`
- În `handleViewProduct`, înlocuiește navigarea către `/produs/<slug>` cu navigare către `/rezervari/<public_id>`.
- Dacă `public_id` lipsește din vreun motiv, fallback la `/inchirierile-mele` (lista chiriașului) — nu mai cădem niciodată pe pagina produsului în acest flux.
- Opțional: redenumire internă a callback-ului în `handleViewRental` pentru claritate (păstrând prop-ul `onViewProduct` în componentă pentru compatibilitate minimă, sau redenumindu-l în `onViewRental` consistent în ambele fișiere — vom alege redenumirea completă fiindcă singurul consumator este `RentalPopupManager`).

## Ce NU se schimbă
- RPC-urile (`get_rental_popups`, `get_rental_popup_by_id`) — `public_id` este deja inclus în payload.
- Logica pentru cererile refuzate (rămâne „Vezi produse similare").
- Logica owner (Acceptă/Refuză).
- Notificările/realtime.

## Memory
Voi actualiza `mem/features/rental-request-popup.md` ca să reflecte că butonul renter `confirmed` duce la `/rezervari/<public_id>`, nu la `/produs/<slug>`.
