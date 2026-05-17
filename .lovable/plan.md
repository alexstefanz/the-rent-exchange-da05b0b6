## Schimbare

În dropdown-ul de notificări, bara de filtre conține trei chip-uri: "Toate mesajele", "Necitite", "Citite". Primul este redundant pentru că dropdown-ul lateral "Toate" (categoria) acoperă deja afișarea completă.

## Fișier modificat

**`src/components/notifications/NotificationFilters.tsx`**
- Elimin intrarea `{ v: "all", label: t("Toate mesajele", "All messages") }` din `readChips`.
- Rămân doar `Necitite` și `Citite`.

## Comportament implicit

`readFilter` are momentan valoarea inițială `"all"` în `NotificationCenter`. Pentru ca lista să nu rămână "blocată" pe o stare fără chip activ, schimb valoarea implicită la `"unread"` în `NotificationCenter.tsx` (verific exact unde e setată) — astfel utilizatorul vede direct mesajele necitite la deschidere, iar comutarea pe "Citite" funcționează normal. Restul logicii de filtrare rămâne neschimbată.
