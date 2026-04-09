

## Plan: Culori distincte pentru statusuri în pie chart

### Problema
Culorile din pie chart sunt atribuite secvențial din array-ul `COLORS`, fără legătură cu statusul. Astfel "Confirmate" și "Anulate" pot primi culori similare (ambele închise/negre).

### Soluție
Înlocuiesc sistemul de culori bazat pe index cu un map explicit status → culoare:

**Fișier: `src/pages/admin/AdminAnalytics.tsx`**

1. Adaug un map de culori per status tradus:
```ts
const STATUS_COLORS: Record<string, string> = {
  'În așteptare': '#F97316',   // portocaliu
  'Confirmate': '#22C55E',     // verde
  'Active': '#3B82F6',         // albastru
  'Finalizate': '#6B7280',     // gri
  'Anulate': '#1a1a1a',        // negru
};
```

2. Actualizez `<Cell>` din PieChart să folosească `STATUS_COLORS[entry.name]` în loc de `COLORS[index]`

Un singur fișier modificat, fără alte dependențe.

