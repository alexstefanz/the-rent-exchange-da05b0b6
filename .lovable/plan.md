## Problem

În prezent, la click pe "Editează" la un anunț, utilizatorul intră în wizardul de publicare de la Pasul 1 și e nevoit să parcurgă toți pașii ca să ajungă la secțiunea pe care vrea să o modifice.

## Observație

Wizardul are deja un **Pas 5 — Rezumat** (`Step6Review`) cu un buton **"Editează"** pe fiecare secțiune (Categorie, Titlu, Descriere, Fotografii, Locație, Preț) care sare direct la pasul corespunzător prin `onJump`. Tot ce lipsește este ca, în modul **edit**, utilizatorul să **aterizeze direct pe acest Rezumat** și să se întoarcă la el după ce a salvat o secțiune.

## Soluție (modificări minime în `src/components/publish/PublishWizard.tsx`)

1. **Aterizare pe Rezumat în edit mode**
   - Când `mode === "edit"` și `initialProduct` se încarcă, inițializează `step = 5` și `maxReached = 5`.
   - Toate cele 5 etape devin accesibile imediat din stepper și din butoanele "Editează" ale rezumatului.

2. **Return-to-summary după editarea unei secțiuni**
   - În edit mode, când utilizatorul apasă "Continuă" pe oricare pas 1–4, dacă vine din Rezumat:
     - validează doar pasul curent;
     - dacă e ok, întoarce-se la `step = 5` (în loc de `step + 1`).
   - Redenumește butonul în "Salvează și înapoi la rezumat" în edit mode (când nu e pe pasul 5).

3. **Buton "Înapoi la rezumat" suplimentar**
   - Adaugă lângă "Înapoi" un link discret "Anulează și înapoi la rezumat" pe pașii 1–4 (doar edit mode), care face `setStep(5)` fără validare.

4. **CTA final pe Rezumat**
   - Pe pasul 5 în edit mode rămâne deja "Salvează modificările" (handlePublish) — fără schimbări.

## Files

- `src/components/publish/PublishWizard.tsx` (~20 linii: init step, override `goNext`, label CTA, link "înapoi la rezumat")

## Out of scope

- Inline-editing direct pe pagina publică a produsului (`/produs/:slug`) — ar însemna duplicarea formularelor și a validărilor wizardului. Dacă vrei totuși inline-edit complet pe pagina publică, spune-mi și fac plan separat.