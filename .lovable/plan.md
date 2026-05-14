## Scop

Pe homepage, secțiunea actuală „Cum funcționează" e afișată orizontal (3 coloane cu iconițe portocalii). O înlocuiesc cu un **timeline vertical** în stilul celui de pe pagina `/cum-functioneaza` (linie centrală cu pași alternativi stânga/dreapta).

## Schimbări

### `src/components/home/HowItWorksMini.tsx`
- Păstrez aceleași **3 etape** existente (Caută produsul / Trimite cererea / Ridică și folosește) și aceleași texte bilingve.
- Înlocuiesc grid-ul orizontal `grid-cols-3` cu un timeline:
  - **Desktop (md+):** grid 2 coloane cu o **linie verticală centrală** (`absolute left-1/2 w-px bg-primary/30`) și un punct portocaliu (`h-3 w-3 rounded-full bg-primary ring-4 ring-background`) la fiecare pas. Pașii alternează stânga/dreapta (idx par → text stânga + iconiță dreapta, idx impar → invers). Eticheta „PAS · 01" deasupra titlului în chip portocaliu.
  - **Mobile:** layout single-column pe stânga, linie verticală la `left-5`, card cu border + iconiță 40×40 + chip „PAS · 0X" + titlu + descriere (identic cu varianta mobile din `HowItWorks.tsx`).
- Iconițele rămân `Search`, `MessageSquare`, `PackageCheck` într-un container `rounded-2xl border bg-card shadow-card` de 64×64 cu icon `text-primary` (NU mai folosesc gradient portocaliu plin — adoptăm stilul timeline-ului).
- Header-ul secțiunii: păstrez titlul „Cum funcționează" + adaug un chip mic „PROCESUL" deasupra (consistent cu HowItWorks) și un subtitlu scurt.

### Out of scope
- Nu modific `src/components/product/HowItWorksMini.tsx` (versiunea de pe pagina de produs).
- Nu modific dicționarul `uxCopy.ts` — folosesc aceleași texte t() existente.
- Nu modific timeline-ul original din `HowItWorks.tsx`.

## Note tehnice
- Reutilizez exact pattern-ul din `src/pages/HowItWorks.tsx` liniile ~85-150 (desktop alternating + mobile vertical), adaptat la doar 3 pași.
- Background-ul secțiunii rămâne `bg-secondary/30` pentru contrast cu restul homepage-ului.
