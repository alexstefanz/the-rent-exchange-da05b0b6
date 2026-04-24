

## Plan: Hero full-screen pe mobil + formular cu 25% mai înalt

### Context

Pe mobil, secțiunea hero are înălțime fixă `h-[500px]` (vezi `Index.tsx`). Vizibil sub fold apare deja USP-ul portocaliu, deci hero-ul nu acoperă tot ecranul la prima încărcare. În plus, containerul formularului (`HeroSearchForm.tsx`) folosește `p-4` și inputurile au `py-2` — utilizatorul vrea 25% mai mult spațiu vertical doar pe mobil.

### Modificări

#### 1. `src/pages/Index.tsx` — secțiunea hero full-screen pe mobil

- Înlocuiesc `h-[500px]` cu `h-[100svh] md:h-[500px]` pe `<section>`-ul hero, astfel încât:
  - Pe mobil ocupă întreaga înălțime vizibilă a ecranului la prima încărcare (`100svh` = small viewport height, evită saltul cauzat de bara de adrese a browserului).
  - Pe desktop păstrează exact 500px ca acum.
- Imaginea de parallax rămâne `h-[130%]` (relativ la container), deci nu trebuie atinsă.

#### 2. `src/components/HeroSearchForm.tsx` — formular cu 25% înălțime suplimentară pe mobil

Aplic creșteri doar pe breakpoint-ul mobil, păstrând layout-ul actual `md:` neatins:

- **Container form**: `p-4` → `p-5` pe mobil (păstrez `md:p-2`); cresc gap-ul vertical: `gap-2` → `gap-3`.
- **Câmpurile (search, județ, localitate)**: `py-2` → `py-3` pe fiecare wrapper de input/selector (păstrez `md:py-0`).
- **Butonul „Caută"**: `py-3` → `py-4` pe mobil (păstrez aspectul desktop neschimbat).

Aceste creșteri cumulate (~25% padding vertical adițional pe container și pe fiecare câmp) extind înălțimea totală a formularului cu aproximativ 25% pe mobil, fără să afecteze versiunea desktop.

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/pages/Index.tsx` | Hero `h-[500px]` → `h-[100svh] md:h-[500px]` |
| `src/components/HeroSearchForm.tsx` | Pe mobil: container `p-4`→`p-5`, `gap-2`→`gap-3`; câmpuri `py-2`→`py-3`; buton `py-3`→`py-4` |

### Rezultat

- La prima încărcare pe mobil, secțiunea hero (imagine + titlu + formular) ocupă tot ecranul — USP-ul portocaliu apare doar după ce utilizatorul derulează.
- Containerul cu formularul de căutare și toate câmpurile/butonul sunt cu ~25% mai înalte pe mobil, oferind o atingere mai confortabilă; pe desktop nimic nu se schimbă.

