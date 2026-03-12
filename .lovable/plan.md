

## Fix: Booking card sticky pe toată înălțimea coloanei stângi

### Problema
Grid-ul folosește `lg:items-start`, ceea ce face ca coloana dreaptă (col-span-1) să aibă doar înălțimea conținutului propriu (booking card). Elementul sticky nu poate "călători" mai jos deoarece părintele său se termină acolo.

### Soluție
Eliminăm `lg:items-start` din grid, astfel încât ambele coloane să aibă aceeași înălțime (stretch implicit). Coloana dreaptă se va întinde pe toată înălțimea coloanei stângi, iar cardul sticky va putea coborî până la nivelul recenziilor.

**Fișier**: `src/pages/ProductDetail.tsx` (linia 224)

```tsx
// De la:
<div className="grid gap-8 lg:grid-cols-3 lg:items-start">

// La:
<div className="grid gap-8 lg:grid-cols-3">
```

O singură clasă eliminată, un singur fișier.

