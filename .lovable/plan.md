## Plan

1. **Fac anularea idempotentă pentru tichetele automate**
   - În `cancel-rental-by-renter`, înainte de `insert` în `ops_tickets`, caut un tichet existent pentru aceeași rezervare, același utilizator, aceeași categorie `REFUND_REQUEST` și același motiv/tag automat (`renter-cancel`, `stripe-fallback`, tier).
   - Dacă există un tichet încă activ (`NEW`, `OPEN`, `IN_PROGRESS` / status neînchis), nu mai creez unul nou; adaug cel mult o notă internă pe tichetul existent sau returnez referința lui în răspuns.

2. **Aplic aceeași protecție și pe funcția separată de ticket de anulare**
   - În `create-renter-cancellation-ticket`, caut mai întâi un tichet existent pentru aceeași rezervare + motiv (`renter-cancel`, `stripe-hold`).
   - Dacă există, returnez tichetul existent în loc să creez altul.

3. **Adaug protecție la nivel de bază de date împotriva curselor rapide**
   - Creez un index unic parțial pe `ops_tickets` pentru tichetele automate de anulare active, pe combinația: `reservation_id`, `requester_user_id`, `category_type` și tagul relevant.
   - Indexul se aplică doar pentru tichetele active și doar pentru tagurile automate de anulare, ca să nu blocheze tichetele manuale legitime.

4. **Curăț duplicatele existente din test**
   - Închid duplicatele pentru aceeași rezervare/motiv, păstrând cel mai vechi tichet activ și marcând restul ca rezolvate/închise cu o notă internă de deduplicare.

## Detalii tehnice

- Nu schimb fluxul de Stripe/refund.
- Nu schimb interfața de anulare.
- Logica va fi defensivă: codul evită duplicatele, iar indexul DB previne duplicatele create de click-uri rapide sau requesturi paralele.