

## Fix: Booking Card sticky pe desktop

Containerul de booking **deja are** `sticky top-24` aplicat, iar grid-ul părinte are `lg:items-start` — deci configurarea CSS este corectă pentru sticky positioning.

**Problema probabilă**: Cardul de booking este mai înalt decât viewport-ul (titlu + preț + calendar + buton + anulare gratuită), ceea ce face ca sticky să nu funcționeze vizibil — elementul nu are unde să "plutească" pentru că depășește ecranul.

### Soluție
Adăugăm `max-height` și `overflow-y: auto` pe containerul sticky, astfel încât dacă conținutul depășește viewport-ul, cardul devine scrollabil intern dar rămâne fixat în viewport:

**Fișier**: `src/pages/ProductDetail.tsx` (linia 275)

Schimbăm div-ul sticky:
```tsx
// De la:
<div className="sticky top-24 rounded-xl border border-border bg-card p-4 sm:p-6 overflow-hidden">

// La:
<div className="sticky top-24 rounded-xl border border-border bg-card p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-7rem)]">
```

Aceasta:
- Păstrează comportamentul sticky existent
- Adaugă `max-h-[calc(100vh-7rem)]` — limita de înălțime = viewport minus spațiul de sus (top-24 = 6rem + 1rem extra)
- Schimbă `overflow-hidden` → `overflow-y-auto` pentru scroll intern dacă conținutul depășește

**Un singur fișier modificat**: `src/pages/ProductDetail.tsx`

