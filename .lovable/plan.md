## Obiectiv

În pagina de verificare identitate (KYC), înainte de încărcarea documentelor, utilizatorul trebuie să introducă **numele complet** așa cum apare pe buletin/CI. Numele se salvează în `profiles.full_name` și este obligatoriu pentru a putea trimite documentele.

## De ce

- Permite echipei de verificare să compare rapid numele declarat cu cel de pe document.
- Pre-completează datele pentru contracte, facturi și procese verbale.
- `profiles.full_name` există deja în baza de date — doar îl conectăm la fluxul KYC.

## Modificări

### 1. `src/components/kyc/KycInlineFlow.tsx`
- La montare, citește `full_name` din `profiles` pentru user-ul curent și pre-populează un nou state `fullName`.
- Adaugă un card nou **"Datele tale" / "Your details"** plasat deasupra cardului "Documente necesare", cu un singur `Input` etichetat:
  - RO: `Nume complet (așa cum apare pe buletin)`
  - EN: `Full name (as shown on your ID)`
  - Placeholder: `Popescu Ion Andrei`
  - Helper text: `Folosim acest nume pentru a verifica documentul și pentru contracte.`
- Validare client: trim, minim 2 cuvinte, fiecare ≥ 2 caractere, doar litere/spații/cratimă/apostrof (regex), max 100 caractere. Mesaj de eroare bilingv sub input.
- Dacă profilul are deja `full_name` valid, câmpul este pre-completat dar rămâne editabil.
- Butonul "Trimite documentele" devine `disabled` și dacă numele e invalid (în plus față de condițiile actuale).
- În `handleSubmit`, înainte de upload documente: `UPDATE profiles SET full_name = <trimmed> WHERE id = user.id` dacă valoarea s-a schimbat față de cea inițială. Dacă update-ul eșuează, oprește submit-ul și arată toast de eroare.
- Dezactivează câmpul când statusul e `SUBMITTED`, `NEEDS_MANUAL_REVIEW`, `VERIFIED` sau `APPROVED` (afișează doar ca text read-only).

### 2. Fără modificări de schemă
- `profiles.full_name` există deja → nu e nevoie de migrare.
- Nu se modifică `kyc_cases` (numele rămâne sursă unică în profil + datele extrase OCR în `kyc_extracted_data`).

### 3. Fără modificări în Admin
- Pagina `AdminKYCDetail` afișează deja profilul utilizatorului, deci numele apare automat.

## Verificare

1. User fără `full_name` în profil → câmp gol, buton "Trimite" dezactivat până introduce nume valid.
2. User cu `full_name` setat → câmp pre-populat, poate edita sau trimite direct.
3. Nume invalid (un singur cuvânt, cifre, prea scurt) → mesaj eroare, buton dezactivat.
4. După SUBMIT: profilul are `full_name` actualizat, KYC trecut în `SUBMITTED`.
5. La status `SUBMITTED`/`VERIFIED` → numele apare read-only, fără input editabil.
