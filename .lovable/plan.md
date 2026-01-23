
# Ajustări Formular de Căutare - Vizibilitate Completă pe Mobil

## Problemă

Din screenshot-ul furnizat, butonul "Caută" este tăiat în partea de jos a ecranului pe mobil. Formularul trebuie să fie complet vizibil la prima încărcare.

## Soluție

### 1. Reducere spațiere verticală în Hero Section

**Fișier:** `src/pages/Index.tsx`

Reduc padding-ul din secțiunea hero pentru a da mai mult spațiu formularului:
- Schimb `pt-24 pb-16` în `pt-16 pb-8` pe mobil
- Reduc spațiul `mt-10` de deasupra formularului la `mt-6`

### 2. Compactare formular pe mobil

**Fișier:** `src/components/HeroSearchForm.tsx`

Reduc spațierea internă a formularului pentru a-l face mai compact:
- Padding container: `p-5` → `p-4` pe mobil
- Gap între elemente: `gap-4` → `gap-2` pe mobil  
- Padding pe fiecare câmp: `py-3` → `py-2` pe mobil
- Buton: `py-4` → `py-3` pe mobil

### 3. Lărgire formular pe mobil (10-15px pe fiecare parte)

**Fișier:** `src/pages/Index.tsx`

Adaug margin negativ sau reduc padding-ul containerului pe mobil:
- Wrapper formular: adaug `mx-[-12px] md:mx-0` pentru a extinde formularul peste marginile containerului pe mobil

## Modificări Tehnice

| Fișier | Modificare |
|--------|------------|
| `src/pages/Index.tsx` | Reduc `pt-24` la `pt-16`, `mt-10` la `mt-6`, adaug `mx-[-12px]` pe wrapper |
| `src/components/HeroSearchForm.tsx` | Reduc gap-uri și padding-uri pentru compactare |

## Rezultat Final

- Formularul va fi complet vizibil pe mobil la prima încărcare
- Butonul "Caută" va fi vizibil fără scroll
- Formularul va fi mai lat cu ~24px total (12px stânga + 12px dreapta)
