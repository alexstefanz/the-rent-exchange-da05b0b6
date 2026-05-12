## Scop
La PV (Proces-verbal de predare/primire), permite salvarea inspecției chiar dacă utilizatorul nu bifează toate punctele și fără să fie obligat să scrie observații.

## Stare curentă
În `src/components/dashboard/InspectionDialog.tsx`:
- `checklistValid = allChecked || notesValid` — dacă lipsește o bifă, observațiile (min 20 caractere) devin obligatorii.
- La submit, dacă `!checklistValid`, se afișează toast `notesRequired` și se blochează salvarea.
- Sub checklist apare avertismentul galben „Observațiile sunt obligatorii când există puncte nebifate".

Fotografiile (10 buc.) și acceptarea declarației rămân singurele cerințe reale.

## Modificări (un singur fișier: `src/components/dashboard/InspectionDialog.tsx`)

1. Elimină constrângerea: `checklistValid` devine mereu `true` (sau scoate-o complet din `canSubmit`).
2. Scoate blocul `if (!checklistValid) { toast.error(...); return; }` din handler-ul de submit.
3. Înlocuiește avertismentul galben afișat când `!allChecked` cu un mesaj informativ neutru (text muted), opțional, gen „Observații (opțional) — descrie eventualele probleme la punctele nebifate". Nu mai e blocant.
4. Placeholder-ul textarea pentru observații rămâne neschimbat („optional dacă toate sunt bifate…") — dacă vrea, putem simplifica la „Observații (opțional)".

## Note
- Fotografiile și declarația rămân obligatorii (logica de validare a lor neatinsă).
- Niciun edge function / DB modificat — `createInspection` acceptă deja checklist parțial.
- Bilingv: dacă schimbăm textul avertismentului, actualizăm doar string-ul din componentă (nu uxCopy, pentru a păstra `notesRequired` pentru alte utilizări dacă există — dar pot fi orfane; verificăm).
