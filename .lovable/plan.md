## Problemă
Textul Pasului 4 sugerează că PV-ul se semnează ÎNAINTE de întâlnire („PV-ul a fost semnat de ambele parti. Mergi la locatia stabilita..."). În realitate, PV-ul se semnează la fața locului, când chiriașul vede produsul. După semnare, predarea a avut deja loc.

## Soluție (doar copy, fără modificări de flux)

În `src/pages/RentalDetailPage.tsx`, pasul 4 (`handoverDoneEarly && !rental.handover_confirmed_at`):

- **Titlu** rămâne: „Pasul 4 — Predare produs" / „Step 4 — Handover".
- **Descriere chiriaș** (înlocuire):
  - RO: „Ai semnat PV-ul de predare împreună cu proprietarul, la fața locului. Confirmă că ai primit produsul pentru a debloca etapa de utilizare."
  - EN: „You signed the handover PV together with the owner, in person. Confirm that you received the product to unlock the in-use stage."
- **Descriere proprietar** (înlocuire):
  - RO: „PV-ul a fost semnat la predare. Așteptăm chiriașul să confirme că a primit produsul."
  - EN: „The handover PV was signed in person. Waiting for the renter to confirm receipt."
- Restul (butonul „Am primit produsul", „Vezi PV", badge „Asteptam confirmarea chiriasului") rămâne identic.

Nu se modifică logica, RPC-urile sau timeline-ul — doar textele care creau confuzia.
