## Problem
La acceptarea unei cereri din popup-ul de proprietar (`RentalRequestPopup` via `RentalPopupManager`), proprietarul rămâne pe pagina curentă. Trebuie redirecționat la pagina închirierii (`/rezervari/{public_id}`). Dacă în coadă există mai multe cereri și sunt acceptate consecutiv, prima să facă redirect în tab-ul curent, iar următoarele să se deschidă în tab-uri noi (ca să nu piardă navigarea inițială).

## Plan

### `src/components/rentals/RentalPopupManager.tsx`

1. Adaug un `useRef<boolean>(false)` numit `redirectedRef` care marchează dacă deja s-a făcut redirect în tab-ul curent ca urmare a unui Accept.

2. Modific `handleAccept`:
   - Apelez `respondToRental(current.id, "accept")` (neschimbat).
   - Obțin `publicId` din `current.public_id`. Fallback URL: `publicId ? "/rezervari/" + publicId : "/inchirierile-mele"`.
   - Dacă `redirectedRef.current === false`:
     - Marchez `redirectedRef.current = true`.
     - `removeItem(current.id)`, `invalidate()`, `toast.success(...)`.
     - `navigate(url)` în tab-ul curent.
   - Altfel (deja a fost o navigare în această sesiune de popup-uri):
     - `removeItem(current.id)`, `invalidate()`, `toast.success(...)`.
     - `window.open(url, "_blank", "noopener,noreferrer")`.
   - În catch: păstrez toast-ul de eroare existent.

3. Resetez `redirectedRef.current = false` atunci când coada se golește, ca să nu păstrez starea între sesiuni separate de popup-uri:
   - Adaug `useEffect` care urmărește `queue.length`; când devine 0, setez `redirectedRef.current = false`.

4. Nu modific celelalte handler-e (reject, viewProduct, viewSimilar, dismiss).

### Considerații
- `window.open` în handler de click este permis de browser (gest user), așa că nu va fi blocat ca pop-up.
- Fluxul renter (mode === "renter") nu se modifică.
- Nu se ating funcțiile RPC sau ownerRentalsApi.

## Files
- `src/components/rentals/RentalPopupManager.tsx` — `redirectedRef`, `handleAccept` rescris, reset pe coadă golită.