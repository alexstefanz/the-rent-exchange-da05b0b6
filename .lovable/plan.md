

## Plan: Hero mai mic pe mobil + formular cu încă 25% mai înalt

### Context

În prezent, hero-ul ocupă tot ecranul pe mobil (`h-[100svh]`) — bara cu USP-uri (Plăți securizate, Utilizatori verificați, Asigurare inclusă, Suport dedicat) nu se vede la prima încărcare. Utilizatorul vrea ca bara USP să fie vizibilă din start, deci hero-ul trebuie redus în înălțime. În același timp, formularul de căutare trebuie mărit cu încă ~25% pentru a rămâne proeminent.

### Modificări

#### 1. `src/pages/Index.tsx` — hero mai scurt pe mobil

- Schimb `h-[100svh] md:h-[500px]` → `h-[78svh] md:h-[500px]` pe `<section>`-ul hero.
  - 78svh lasă ~22% din viewport vizibil sub fold, suficient pentru a arăta complet bara USP portocalie (~50–60px) plus o sugestie din secțiunea „Categorii populare" care invită la scroll.
  - Desktop rămâne neschimbat (500px).

#### 2. `src/components/HeroSearchForm.tsx` — formular cu încă 25% înălțime pe mobil

Aplic creșteri suplimentare doar pe mobil, păstrând layout-ul desktop intact:

- **Container form**: `p-5` → `p-6` (mobil), păstrez `md:p-2`. Cresc `gap-3` → `gap-4`.
- **Wrappere câmpuri** (search, județ, localitate): `py-3` → `py-4` (mobil), păstrez `md:py-0`.
- **Buton „Caută"**: `py-4` → `py-5` (mobil), păstrez `md:py-3`.
- **Inputurile/textele**: cresc puțin tipografia mobilă pentru consistență vizuală cu containerul mai înalt: butonul „Caută" devine `text-base` pe mobil (rămâne implicit pe desktop).

Cumulat, padding-ul vertical și gap-urile cresc cu ~25% față de versiunea curentă pe mobil.

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/pages/Index.tsx` | Hero `h-[100svh] md:h-[500px]` → `h-[78svh] md:h-[500px]` |
| `src/components/HeroSearchForm.tsx` | Pe mobil: container `p-5`→`p-6`, `gap-3`→`gap-4`; câmpuri `py-3`→`py-4`; buton `py-4`→`py-5` cu `text-base` |

### Rezultat

- La prima încărcare pe mobil, sub hero apare deja vizibilă bara USP completă (Plăți securizate, Utilizatori verificați, Asigurare inclusă, Suport dedicat).
- Formularul de căutare devine cu încă ~25% mai înalt și mai confortabil de atins, fără modificări pe desktop.

