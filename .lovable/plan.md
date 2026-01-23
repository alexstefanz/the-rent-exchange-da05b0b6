
# Schimbare Format Categorii - De la Imagini la Iconițe

## Rezumat

Voi modifica pagina `/categorii` (Categories.tsx) pentru a afișa toate categoriile în format cu iconițe circulare colorate + nume sub ele, exact ca în secțiunea "Categorii principale" de pe homepage, înlocuind cardurile mari cu imagini.

---

## Comparație Actuală vs Nouă

**Format Actual (screenshot 1):**
- Carduri mari cu imagini background
- 2 coloane pe desktop
- Overlay întunecat cu text alb
- Afișează număr subcategorii

**Format Nou (screenshot 2):**
- Iconițe Lucide în cercuri colorate
- Grid responsive: 3 coloane mobil, 4-5 pe tabletă, 6-9 pe desktop
- Nume categorie sub iconiță (împărțit pe 2 rânduri pentru categorii cu "&")
- Fără imagini, aspect curat și modern

---

## Modificări Necesare

### Fișier: `src/pages/Categories.tsx`

**1. Importuri noi:**
```typescript
import { getCategoryIcon } from "@/data/categoryIcons";
import { Link } from "react-router-dom";
```

**2. Înlocuire grid cu iconițe:**
- Elimin componenta `CategoryCard`
- Folosesc același stil ca pe homepage pentru afișarea categoriilor
- Grid responsive cu mai multe coloane
- Cercuri colorate cu iconițe Lucide
- Nume categorie sub iconiță

**3. Array culori pentru fundal cercuri:**
```typescript
const colors = [
  "bg-yellow-100",
  "bg-blue-100", 
  "bg-amber-100",
  "bg-orange-100",
  "bg-indigo-100",
  "bg-emerald-100",
  "bg-pink-100",
  "bg-cyan-100",
  "bg-rose-100",
];
```

---

## Layout Nou Vizual

```text
┌────────────────────────────────────────────────────────────────┐
│  Toate Categoriile                                              │
│  Explorează toate cele 22 de categorii...                       │
│                                                                 │
│  [🔍 Caută categorii...                           ]             │
│                                                                 │
│  ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐    │
│  │ 🏔️ │   │ ⛺ │   │ ❄️ │   │ 🔧 │   │ 🏰 │   │ 🎮 │    │
│  └─────┘   └─────┘   └─────┘   └─────┘   └─────┘   └─────┘    │
│  OUTDOOR   CAMPING   SPORTURI  SCULE    JUCĂRII   GAMING       │
│  Aventură  Drumeții  Iarnă     Unelte   Gonf.     Electr.      │
│                                                                 │
│  ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐    │
│  │ 📷 │   │ ⚡ │   │ 🎉 │   │ 🎸 │   │ 💪 │   │ ❤️ │    │
│  └─────┘   └─────┘   └─────┘   └─────┘   └─────┘   └─────┘    │
│  FOTO      MOBILIT.  EVENIM.   MUZICA   FITNESS   MEDICALE     │
│  Video     Urbană    Hobby     DJ       Wellness  Recuper.     │
│                                                                 │
│  ... (toate 22 categorii)                                       │
└────────────────────────────────────────────────────────────────┘
```

---

## Detalii Tehnice

**Grid responsive:**
- Mobile: `grid-cols-3`
- Small: `sm:grid-cols-4`
- Medium: `md:grid-cols-5`
- Large: `lg:grid-cols-6`
- XL: `xl:grid-cols-7`

**Stilizare iconițe:**
- Cerc: `h-16 w-16 sm:h-20 sm:w-20 rounded-full`
- Hover: `transition-transform group-hover:scale-110`
- Iconiță: `h-8 w-8 sm:h-10 sm:w-10`

**Formatare nume:**
- Prima parte cu font-medium
- Partea după "&" pe linie nouă, text-muted-foreground

---

## Fișiere Modificate

| Fișier | Acțiune |
|--------|---------|
| `src/pages/Categories.tsx` | Înlocuire CardGrid cu IconGrid |

---

## Pași Implementare

1. Adaug import pentru `getCategoryIcon` și `Link`
2. Adaug array-ul de culori pentru cercuri
3. Înlocuiesc grid-ul cu `CategoryCard` cu noul format iconițe
4. Păstrez funcționalitatea de căutare existentă
5. Stilizez identic cu secțiunea de pe homepage

---

## Note

- Se folosesc aceleași iconițe Lucide definite în `categoryIcons.ts`
- Culorile se rotesc ciclic pentru toate cele 22 de categorii
- Link-urile rămân la `/categorie/{id}` ca înainte
- Căutarea funcționează la fel, doar se schimbă modul de afișare
