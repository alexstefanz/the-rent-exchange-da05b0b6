## Obiectiv
Reface `src/components/dashboard/RentalTimeline.tsx` ca un timeline animat, prietenos și colorat, cu trecere fluidă (ease-in-out) prin liniile de legătură pe măsură ce avansează pașii.

## Decizii cheie

### 1. Paletă pe pas (mai prietenoasă, fiecare etapă altă culoare)
Fiecare pas primește o culoare distinctă, păstrând tonurile calde ale brandului (Visual Identity V2):

```
1. Cerere trimisă          → amber-400  (galben-cald, "început")
2. Cerere aprobată         → orange-500 (#F59E0B — primary)
3. În tranzit              → orange-600 (#F98715 — hover)
4. În folosire             → rose-500   (energie, produs activ)
5. În curs de returnare    → violet-500 (răcorire, finalizare aproape)
6. Finalizat               → emerald-500 (succes verde)
Cancelled                  → destructive (roșu — neschimbat)
```

Implementare: array `STEP_COLORS` cu clase Tailwind `{ ring, bg, text, border, line }` per index, evitând stringuri dinamice (Tailwind safe).

### 2. Animație a liniei de legătură (ease-in-out)
Linia dintre două buline este desenată cu un overlay colorat care își animă `width` de la 0% → 100% atunci când pasul devine completat:

```
<div className="relative h-1 flex-1 bg-muted rounded-full overflow-hidden">
  <div
    className={cn(
      "absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-in-out",
      isFilled ? "w-full" : "w-0",
      STEP_COLORS[idx].line
    )}
  />
</div>
```

Duration 700ms + `ease-in-out` → trecerea fluidă cerută. React re-render la schimbarea statusului declanșează automat tranziția CSS.

### 3. Bulinele
- Pas completat: gradient pe culoarea proprie + `Check` alb, micro `scale-in` la apariție.
- Pas curent: ring colorat + halo `animate-pulse` subtil + scale 1.1.
- Pas viitor: bg neutru, border muted.
- Pas cancelled: roșu cu `X`.
- Tranziții: `transition-all duration-500 ease-in-out` pe culori, scale, shadow.

### 4. Etichete
- Curent: text colorat în culoarea pasului, semibold, mic `animate-fade-in`.
- Completat: text foreground.
- Viitor: muted.

### 5. Mobil (vertical)
Aceeași logică, dar linia verticală (`w-1 h-full`) între buline animă `height` de la 0 → 100% cu ease-in-out. Buline mai mici, etichete inline.

### 6. Accesibilitate
- `aria-current="step"` pentru pasul curent (păstrat).
- Respect `prefers-reduced-motion`: tranzițiile devin instant prin clasa `motion-reduce:transition-none motion-reduce:duration-0`.

## Fișier modificat
- `src/components/dashboard/RentalTimeline.tsx` — refactor complet UI; API public (`RentalForTimeline`, `getTimelineStep`, props `RentalTimelineProps`) rămâne neschimbat, deci toate locurile care îl folosesc (`RentalsTab`, `RentalsOutTab`, `RequestsTab`) funcționează fără modificări.

## Rezultat vizual
- Timeline colorat, fiecare etapă cu identitate proprie.
- La trecerea la următorul pas, linia se "umple" lin de la stânga la dreapta (700ms ease-in-out), bulina se aprinde cu scale + check, eticheta se colorează.
- Pe mobil, linia verticală curge de sus în jos cu aceeași animație.
