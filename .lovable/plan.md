

## Plan: Adaugă "Confirmate" în graficul Tendințe Lunare

Adaug o a treia bară (`confirmate`) în graficul BarChart din secțiunea Tendințe Lunare, cu culoarea verde (#22C55E) conform paletei existente.

### Modificare

**Fișier: `src/pages/admin/AdminAnalytics.tsx`**

1. Adaug `confirmate` în datele mock `monthlyData` (linia 48-55)
2. Adaug un al treilea `<Bar>` în BarChart cu `dataKey="confirmate"`, `fill="#22C55E"`, `name="Confirmate"`
3. Adaug `Legend` în BarChart pentru a distinge cele 3 bare

Datele mock vor arăta astfel:
```typescript
{ name: 'Ian', rezervari: 12, utilizatori: 45, confirmate: 8 },
{ name: 'Feb', rezervari: 19, utilizatori: 52, confirmate: 14 },
// etc.
```

