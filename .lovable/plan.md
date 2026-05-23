## Problemă

În popup-ul "Ai un anunț nesalvat":
- Butonul **X** doar închide popup-ul fără să șteargă draftul → la următoarea vizită reapare.
- "Începe anunț nou" șterge draftul, dar nu e clar pentru utilizator că asta face.
- Nu există un buton explicit "Șterge draftul".
- Nu există nicio modalitate de a șterge un draft din afara wizardului (ex. din lista de anunțuri).

## Soluție

### 1. `PublishWizard.tsx` — popup draft
- Înlocuiesc cele 2 butoane cu 3 acțiuni clare:
  - **Continuă draftul** (acțiune principală, portocaliu)
  - **Începe anunț nou** (salvează draftul curent ca ciornă separată — NU șterge)
  - **Șterge draftul** (variant destructive, roșu, cu confirmare inline) → apelează `deleteDraft`
- Butonul **X** rămâne ca dismiss temporar, dar adaug text mic sub el: "Draftul rămâne salvat".
- Refactor: `handleStartFresh` nu mai șterge automat — doar resetează starea locală (`draftId = null`) astfel încât autosave-ul creează un draft nou separat. Ștergerea draftului vechi se face doar prin butonul explicit.

### 2. `ListingsPage` / dashboard `/anunțuri`
- Dacă există un draft activ (status nepublicat), îl afișez ca un card cu badge "Draft" și buton **Șterge** care apelează `deleteDraft`.
- Permite curățarea draftului fără a deschide wizardul.

### Detalii tehnice

- Folosesc `deleteDraft(id)` existent din `src/features/publish/draftsApi.ts`.
- Toast de confirmare după ștergere ("Draft șters").
- Bilingv RO/EN prin `t()` helper.
- Nu modific schema DB.

## Fișiere afectate

- `src/components/publish/PublishWizard.tsx` — refactor footer dialog + handleStartFresh.
- `src/pages/OwnerListings.tsx` (sau echivalent) — adaug card draft cu buton ștergere.
