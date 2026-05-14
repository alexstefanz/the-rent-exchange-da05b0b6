## Unificare "Detalii" + "Fotografii" într-un singur pas

Reducem wizardul de la 6 la 5 pași, combinând fostul pas 2 ("Detalii") cu fostul pas 3 ("Fotografii") într-un singur pas numit **"Fotografii & detalii"**, cu **fotografiile afișate primele**.

### Noua structură de pași
1. Categorie
2. **Fotografii & detalii** (nou — poze sus, apoi titlu/condiție/descriere/accesorii/reguli)
3. Locație
4. Preț & disponibilitate
5. Verificare & publicare

### Modificări (toate în `src/components/publish/PublishWizard.tsx`)

1. **`STEPS`**: 5 intrări, label-ul pasului 2 devine `"Fotografii & detalii"` (shortLabel: `"Detalii"`).
2. **Render switch**: `step === 2` randează un nou `Step2DetailsPhotos` care primește toate props-urile (`data`, `update`, `errors`, `feePercent`, `userId`); `step === 3 → Step4Location`, `step === 4 → Step5Pricing`, `step === 5 → Step6Review` (păstrăm numele componentelor existente, schimbăm doar la ce `step` se montează).
3. **`Step2DetailsPhotos`**: nou wrapper care randează în ordine:
   - blocul de upload din `Step3Photos` (fără headerul "PASUL 3 DIN 6" — se folosește un singur header la nivel de pas: "Fotografii & detalii")
   - blocul existent din `Step2Details` (titlu, condiție, descriere, "Ce este inclus", "Reguli de utilizare")
   Reutilizăm conținutul JSX al celor două componente existente; le păstrăm exportate dar le folosim direct sub forma de fragmente componibile (mut JSX-ul în două sub-componente fără shell-ul exterior, apoi le compun în `Step2DetailsPhotos`).
4. **`validateStep`**: pasul 2 rulează atât `stepValidators.step2` (titlu/descriere/condiție) cât și `stepValidators.step3` (imagini); pasul 3 → `step4`, pasul 4 → `step5`, pasul 5 → ok. `handlePublish` iterează `for (let s = 1; s <= 4; s++)`.
5. **`Step6Review.onJump`**: `Categorie → 1`, `Titlu/Descriere/Condiție/Fotografii → 2`, `Locație → 3`, `Preț/Durată → 4`.
6. **Headere de pas**: "PASUL 2 DIN 5", "PASUL 3 DIN 5"... Actualizez stringurile statice afișate în fiecare componentă internă.
7. **Drafts existente**: `pendingDraft.step` poate avea valori vechi (3..6). Adaug un mic remap la încărcare: `{1→1, 2→2, 3→2, 4→3, 5→4, 6→5}`, clampat la 5.

### Out of scope
- Fără modificări la `publishTypes.ts` / `stepValidators` (zod schemas rămân `step1..step5` ca grupuri logice de validare; doar mapping-ul în UI se schimbă).
- Fără modificări la quality score, RPC-uri, DB sau preview.
- Fără modificări vizuale la `PublishStepper` (afișează automat câte step-uri primește în props).
