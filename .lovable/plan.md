## Problemă

`conversations.rentals_id` are constraint UNIQUE (`conversations_rentals_id_unique`). Există deja o conversație între chiriaș și proprietar legată de rental, deci insertul admin cu `rentals_id` setat eșuează.

## Soluție

În `openAdminConversation` (`src/features/admin/cancellationRequestsApi.ts`):

1. **Nu mai seta `rentals_id`** la conversația admin↔user — păstrează rental-ul doar ca context, nu ca legătură unică în DB.
2. **Lookup**: caută o conversație existentă cu `(buyer_id = adminId, owner_id = otherUserId, product_id, rentals_id IS NULL)` (sau invers buyer/owner). Dacă există → reutilizează.
3. **Insert nou** doar cu `buyer_id = adminId`, `owner_id = otherUserId`, `product_id` (NOT NULL), fără `rentals_id`.
4. Eliminăm fallback-ul vechi care încerca să găsească după `rentals_id`.

Astfel adminul va avea o conversație separată cu fiecare parte (chiriaș și proprietar), iar conversația originală chiriaș↔proprietar nu este atinsă.

Fișier modificat: `src/features/admin/cancellationRequestsApi.ts` — doar funcția `openAdminConversation`. Niciun migration necesar.
