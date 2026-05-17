## Permite încărcarea de poze multiple în PV

**Fișier:** `src/components/rentals/PvPhotoUploadCard.tsx`

**Schimbări:**

1. `handleAddPhotos` — elimin `slice(0, Math.max(0, MIN_PV_PHOTOS - photoCount) || files.length)` care plafona la minim. Iterez peste TOATE fișierele selectate (`Array.from(files)`).
2. `EmptySlot` `<input>` — adaug `multiple` ca să poată selecta mai multe poze dintr-o singură dată chiar și din slot-urile dashed.
3. Buton principal de încărcare — păstrează `multiple` (deja există); actualizez label-ul ca să reflecte că minimul e 2 dar poți adăuga mai multe: `Incarca poze (X · min ${MIN_PV_PHOTOS})`.
4. Grid-ul deja randează `Math.max(MIN_PV_PHOTOS, photoCount)` slot-uri, deci pozele suplimentare apar automat. Adaug încă un slot gol la final după ce s-au atins minimul, pentru a permite adăugarea continuă.

**În afara scopului:** Nicio schimbare în DB/RLS, în logica de semnare sau în `PvSignatureDialog`. Doar UI-ul cardului de upload.
