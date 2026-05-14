## Redesign carduri "Cereri de închiriere"

În `src/components/dashboard/RentalsOutTab.tsx`, secțiunea premium cu cererile noi/confirmate fără PV:

### Layout
- Wrapper actual (stack vertical) → grid responsiv: `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`
- Fiecare card devine mai compact, vertical, ca să încapă 3 pe rând pe desktop

### Imagine produs
- Adăugare bandă imagine în partea de sus a fiecărui card: `aspect-[16/10]` cu `object-cover`, colțuri rotunjite sus
- Sursă: `rental.products.images[0]` (deja disponibil în query) cu fallback `/placeholder.svg`
- Badge status (`Cerere nouă` / `Confirmată`) suprapus dreapta-sus peste imagine
- "pentru [Nume produs]" rămâne ca titlu sub imagine

### Conținut card (rearanjat pentru lățime mai mică)
- Header: "CERERE DE LA / Nume chiriaș" (compact)
- Titlu produs (link)
- Cele 3 mini-tile (Perioadă / Zile / Câștig) → grid 3 coloane rămâne, dar cu padding redus și text mai mic (`text-xs`)
- Butoane Acceptă/Refuză: stack vertical pe cardul îngust (`flex-col`), full-width
- "Vezi detalii" + "Solicită anularea cererii" rămân full-width în partea de jos

### Restul paginii
- Stats summary (4 carduri) — neschimbat
- Accordion istoric — neschimbat

Fișier modificat: `src/components/dashboard/RentalsOutTab.tsx`
