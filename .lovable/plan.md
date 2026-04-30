## Proces-verbal de predare/primire cu condiții bifate

Extindem fluxul existent de inspecție foto (`InspectionDialog`) cu un proces-verbal: o listă fixă standard de condiții pe care utilizatorul (proprietar la predare, chiriaș la primire, și invers la return) trebuie să le bifeze obligatoriu pentru a confirma. Aceleași condiții apar la check-in (return) ca referință de comparație vizuală.

### Lista fixă standard de condiții (RO/EN)

Aceleași 6 puncte pentru ambele faze (checkout și checkin), pentru a garanta paritatea „așa s-a predat / așa trebuie returnat":

1. Produsul este complet funcțional și pornește corect
2. Nu prezintă defecte vizibile (zgârieturi, lovituri, fisuri) în afara celor menționate la observații
3. Conține toate accesoriile incluse în anunț
4. Este curat și în stare de utilizare
5. Ambalajul / husa de transport este prezent(ă), dacă a fost inclus(ă)
6. Am verificat produsul împreună cu cealaltă parte (sau pe baza pozelor primite)

Dacă o condiție nu se aplică sau e încălcată, utilizatorul trebuie să o lase nebifată **și** să descrie problema în câmpul Observații (care devine obligatoriu în acest caz).

### Flux UI

```text
InspectionDialog
├── [Existent] Header + descriere fază
├── [Existent] Upload poze (min. 1, max. 10)
├── [NOU] Proces-verbal
│   ├── 6 checkboxes (lista standard)
│   └── Banner info: „Bifează doar condițiile îndeplinite. 
│       Pentru cele nebifate, descrie problema în Observații."
├── [Existent] Textarea Observații (devine OBLIGATORIE dacă există bife lipsă)
└── [Existent] Buton Salvează
    └── Dezactivat până când: poze ≥ 1 AND (toate bifate OR observații completate)
```

La vizualizare (când inspecția e deja salvată), se afișează lista cu iconițe ✓ / ✗ pentru fiecare punct, plus observațiile. Astfel ambele părți văd exact ce a confirmat cealaltă.

### Reguli de validare

- Salvarea este blocată dacă: 0 poze, SAU există puncte nebifate FĂRĂ observații (min. 20 caractere).
- La check-in (return), se afișează deasupra checkboxurilor un sumar al stării declarate la checkout (câte bifate / observații), ca chiriașul/proprietarul să vadă ce trebuie să respecte la returnare.

### Modificări tehnice

**Bază de date** — migrare:
- `rental_inspections`: adăugăm coloana `checklist jsonb NOT NULL DEFAULT '{}'::jsonb`.
- Format: `{ "functional": true, "no_defects": false, "complete_accessories": true, "clean": true, "packaging": true, "verified_together": true }`.
- Cheile sunt fixe (constante în cod), nu un câmp dinamic — păstrăm simplitatea și stabilitatea pentru export PDF/audit ulterior.

**Cod**:
- `src/features/rentals/inspectionApi.ts`:
  - Tip nou `InspectionChecklist` cu cele 6 chei booleane.
  - `Inspection` primește câmpul `checklist`.
  - `createInspection(...)` primește și `checklist: InspectionChecklist`.
- `src/data/uxCopy.ts`:
  - Secțiune nouă `inspection.checklist` cu cele 6 etichete + titlu „Proces-verbal" + textul de ajutor + mesajul „Observațiile sunt obligatorii când există puncte nebifate" — bilingv RO/EN.
- `src/components/dashboard/InspectionDialog.tsx`:
  - State `checklist` (toate `false` inițial).
  - Render listă de `Checkbox` + `Label` pentru fiecare condiție.
  - Logica `canSubmit`: poze ≥ 1 AND (toate `true` OR notes.trim().length ≥ 20).
  - La afișarea inspecției salvate: listă cu ✓/✗ + observații.
  - La checkin: dacă există inspecția corespunzătoare de checkout pentru același rental, afișăm un mic banner „Stare la predare: X/6 condiții confirmate" cu un toggle pentru detalii.
- Niciun edge function nou — totul rămâne client-side cu RLS existent pe `rental_inspections`.

### Ce NU schimbăm

- Fluxul de butoane din `RentalsTab` / `RentalsOutTab` — același „📷 Predare / Primire / Confirmă predarea" deschide același dialog, doar cu pasul nou înăuntru.
- Numărul minim/maxim de poze (1–10).
- Politica de plăți / capture / refund.

### Memorie

După implementare, actualizăm `mem://features/photo-handover-documentation` pentru a reflecta noua componentă „checklist obligatoriu cu 6 puncte standard + observații condiționate".
