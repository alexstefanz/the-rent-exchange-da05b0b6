# Pasul 3 pliabil: bară generală de progres + părți care se pliază

## Ce se schimbă

Pe pagina închirierii (`/inchirieri/:publicId`), fluxul devine vizibil ca un singur drum cu etape, iar secțiunile finalizate nu mai umplu ecranul:

1. **Bară generală de progres sus în pagină** (ca în captura de referință), cu 6 etape:
   `Cerere trimisă → Confirmat → Plată efectuată → Predare produs → Returnare → Finalizat`
   - Etapele trecute: bifă verde/portocalie; etapa curentă: evidențiată cu inel; etapele viitoare: gri.
   - Pe mobil bara se derulează orizontal (overflow-x), ca stepper-ul existent din chat.

2. **Click pe o etapă din bară** derulează fin (smooth scroll) la partea corespunzătoare:
   - Etapele 1–3 (Cerere, Confirmat, Plată) → deschid **Partea 1** dacă e pliată și fac scroll la ea.
   - Etapele 4–6 (Predare, Returnare, Finalizat) → deschid **Partea 2** dacă e deblocată și fac scroll la ea (Predare → direct la secțiunea PV `#pv-section`).
   - Etapele viitoare/blocate nu reacționează la click.

3. **Plierea automată rămâne și se extinde**:
   - Partea 1 finalizată (plată + întâlnire agreată) → bandă compactă cu bifă, „Vezi detalii" o redeschide (există deja).
   - **Partea 2 finalizată (returnare confirmată / închiriere încheiată) → se pliază automat la fel**, cu sumarul „Predare ✓ · Returnare ✓" în bandă.
   - Partea activă rămâne mereu deschisă; părțile blocate rămân cu lacăt, nepliabile.

## Fișiere afectate

- `src/pages/RentalDetailPage.tsx` — singurul fișier modificat:
  - componentă nouă internă `RentalProgressBar` (6 etape, derivate din stările existente: status, isPaidEarly, handoverDoneEarly, returnDoneEarly);
  - `ProcessCard` primește control extern de pliere (prop `expandSignal`) ca click-ul din bară să poată deschide partea pliată;
  - bara randată deasupra gridului, sub antetul paginii.

## Detalii tehnice

- Etapa curentă se calculează din stările deja existente în pagină (fără query-uri noi):
  `pending→0, confirmed/approved→1, paid→2, handover→3, return initiated→4, completed→5`; anulată/respinsă → bara arată starea de anulare.
- `ProcessCard` primește `expandSignal: number` — la schimbarea valorii, dacă partea e pliabilă, se deschide (`useEffect` pe semnal); scroll cu `document.getElementById("part-N").scrollIntoView({behavior:"smooth"})` (id-urile `part-1`/`part-2` există deja).
- Texte bilingve RO/EN prin `t()` existent.
- Fără schimbări de backend, fără tabele noi, fără dependențe noi.

## Validare

- Build fără erori.
- Verificare vizuală cu Playwright pe RNT-000237: bara cu etapa curentă corectă, click pe etapă deschide partea pliată și derulează la ea, Partea 2 pliată după finalizare.
