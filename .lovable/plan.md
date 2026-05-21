## Plan: Buton X pentru închidere pe popup-ul "Ai un anunț nesalvat"

### Fix — `src/components/publish/PublishWizard.tsx` (în jurul liniei 463)

Adaug un buton X absolut poziționat în colțul dreapta-sus al `AlertDialogContent`. Click pe X = închide popup-ul fără a șterge draftul (echivalent „mai decid mai târziu") prin `setPendingDraft(null)`.

```tsx
<AlertDialogContent className="relative">
  <button
    type="button"
    onClick={() => setPendingDraft(null)}
    aria-label="Închide"
    className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
  >
    <X className="h-4 w-4" />
  </button>
  ...
```

`X` e deja exportat din `lucide-react` (folosit în restul fișierului — verific la import; dacă lipsește îl adaug în lista existentă).

### Comportament
- Continuă draftul → restaurează (neschimbat)
- Începe anunț nou → șterge draft (neschimbat)
- **X (nou)** → doar închide popup-ul; draftul rămâne în DB și va apărea din nou la următoarea vizită

### Ce nu modific
- Logica de salvare/ștergere draft, restul wizard-ului.