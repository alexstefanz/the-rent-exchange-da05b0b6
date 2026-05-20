## Fix

În `src/pages/RentalDetailPage.tsx` linia 336-337, scoate numele orașului din mesajul pasului 5 (vizibil pentru chiriaș):

- RO: `"PV-ul a fost semnat de ambele parti. Mergi la locatia stabilita si confirma primirea dupa ce ai produsul in mana."`
- EN: `"The handover document is signed by both parties. Go to the agreed location and confirm receipt after you have the product in hand."`

Fără interpolare cu `rental.product_location_city`. Restul componentei rămâne neschimbat.