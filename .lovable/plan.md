
# Modificări Layout Desktop/Mobile pentru Navbar și Formular de Căutare

## Rezumat

Voi face următoarele modificări:
1. Ascund bara de categorii orizontală pe desktop (rămâne meniul off-canvas pentru tabletă și mobil)
2. Adaug spațiu de 35px între header și banner pe mobil
3. Măresc formularul de căutare pe mobil pentru vizibilitate și accesibilitate mai bună

---

## Modificări Detaliate

### 1. Navbar - Ascunderea meniului pe desktop

**Fișier:** `src/components/layout/Navbar.tsx`

Voi modifica bara de categorii pentru a fi complet ascunsă pe toate ecranele (inclusiv desktop). Meniul off-canvas pentru tabletă și mobil rămâne funcțional.

**Schimbări:**
- Linia 142-164: Adaug `hidden` și elimin `lg:block` pentru a ascunde bara de categorii pe toate ecranele
- Liniile 166-210: Elimin sau ascund mega-menu-ul desktop care nu mai este necesar

---

### 2. Index.tsx - Spațiu între header și banner pe mobil

**Fișier:** `src/pages/Index.tsx`

Voi adăuga padding-top suplimentar pentru secțiunea Hero pe mobil pentru a crea spațiu între header-ul fix și conținut.

**Schimbări:**
- Linia 22: Modific `py-16 md:py-24` → `pt-24 pb-16 md:py-24`
- Aceasta adaugă aproximativ 35-40px spațiu suplimentar pe mobil (pt-24 = 96px vs py-16 = 64px)

---

### 3. HeroSearchForm - Formular mai mare pe mobil

**Fișier:** `src/components/HeroSearchForm.tsx`

Voi mări formularul de căutare pe mobil pentru a fi mai vizibil și accesibil.

**Schimbări:**
- Linia 39: Măresc padding-ul formularului → `p-5 md:p-4` pentru mobil
- Liniile 42-50: Măresc input-ul și icon-urile
- Liniile 139-144: Măresc butonul de căutare pe mobil

**Modificări specifice:**
```text
Formular container:
- Padding: p-4 → p-5 pe mobil
- Gap între elemente: gap-3 → gap-4 pe mobil

Input de căutare:
- Înălțime minimă: py-3 pe mobil
- Text: text-base pe mobil

Select-uri:
- Înălțime: py-3 pe mobil
- Text mai mare

Buton căutare:
- Dimensiune: mai mare pe mobil (py-4)
- Lățime completă pe mobil
```

---

## Detalii Tehnice

### Breakpoints folosite
- `md:` = 768px (tablet)
- `lg:` = 1024px (desktop)

### Fișiere afectate
| Fișier | Modificare |
|--------|------------|
| `src/components/layout/Navbar.tsx` | Ascund bara de categorii pe desktop |
| `src/pages/Index.tsx` | Adaug spațiu header-banner pe mobil |
| `src/components/HeroSearchForm.tsx` | Măresc formularul pe mobil |

---

## Comportament final

| Dispozitiv | Meniu Categorii | Meniu Off-canvas | Spațiu Header-Banner |
|------------|-----------------|------------------|---------------------|
| Desktop (1024px+) | Ascuns | Ascuns | Standard |
| Tablet (768-1023px) | Ascuns | Disponibil | Standard |
| Mobil (<768px) | Ascuns | Disponibil | +35px suplimentar |
