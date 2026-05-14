## Problema
Etichetele actuale „Rezervări" și „Închirieri" sună aproape identic în română și nu spun clar dacă userul vede produsele pe care le-a închiriat ca **chiriaș** sau cele pentru care a primit cereri ca **proprietar**. Există deja 3 pagini separate (`/rezervari`, `/inchirieri`, `/anunturi`), dar nu sunt grupate vizual pe rol.

## Soluție
Reorganizare pur de UI/UX, fără schimbări de business logic, rute sau DB. Grupez navigarea pe **două roluri clare** în toate locurile unde apar aceste linkuri și redenumesc etichetele să fie auto-explicative.

### 1. Etichete noi (RO / EN)
Aplicate consecvent peste tot (NavGroups, AccountHubMenu, MobileDrawer, headere de pagini, MobileBottomNav):

| Rută          | Vechi                       | Nou                                                      |
|---------------|-----------------------------|----------------------------------------------------------|
| `/rezervari`  | „Rezervări" / „Reservations"| **„Închirierile mele"** / **„My rentals"** (ca chiriaș) |
| `/inchirieri` | „Închirieri" / „Lendings"   | **„Cereri primite"** / **„Bookings received"** (ca proprietar) |
| `/anunturi`   | „Anunțuri" / „Listings"     | **„Anunțurile mele"** / **„My listings"** (ca proprietar) |

Sub fiecare etichetă din meniuri pun un subtitlu mic gri ca să elimin orice ambiguitate, ex.: „Produsele pe care le-ai închiriat" / „Cereri pentru anunțurile tale".

### 2. Grupare pe rol în `NavGroups.tsx` (Profile / `/profile`)
Înlocuiesc grupul „Activitate" cu **două grupuri distincte**, vizibile side-by-side, fiecare cu eyebrow + iconiță proprie:

```text
┌─ Ca chiriaș ──────────────┐  ┌─ Ca proprietar ──────────────┐  ┌─ Cont & suport ──┐
│ • Închirierile mele       │  │ • Anunțurile mele            │  │ • Detalii cont    │
│   Produse închiriate      │  │   Produsele tale active      │  │ • KYC             │
│ • Favorite                │  │ • Cereri primite             │  │ • Plăți & câștig. │
│ • Mesaje                  │  │   Rezervări pentru anunțuri  │  │ • Notificări      │
│                           │  │ • Câștiguri & retrageri      │  │ • Suport          │
└───────────────────────────┘  └──────────────────────────────┘  └───────────────────┘
```
Iconițe: `User` pentru chiriaș, `Store` pentru proprietar (Lucide). Carduri cu același stil ca grupurile actuale.

### 3. `AccountHubMenu.tsx` (dropdown desktop + sheet mobil)
- Cele 4 `StatusCard` din `TopZone` rămân (UX consistent), dar:
  - „rezervări active" → „închirieri active (chiriaș)"
  - „închirieri active" → „cereri active (proprietar)"
  - „produsele mele" → „anunțurile mele (proprietar)"
- În `MiddleZone` adaug 2 `SectionLabel`-uri noi: **„Ca chiriaș"** și **„Ca proprietar"**, cu `NavRow`-uri către cele 3 rute, în loc să fie amestecate în „Cont".

### 4. Headerele paginilor
- `RentalsPage.tsx` (`/rezervari`): titlu „Închirierile mele" + chip mic „Ca chiriaș" + subtitlu „Produsele pe care le-ai închiriat de la alți utilizatori".
- `RentalsOutPage.tsx` (`/inchirieri`): titlu „Cereri primite" + chip „Ca proprietar" + subtitlu „Rezervări pentru anunțurile tale". (Iconița Package există deja.)
- `ListingsPage.tsx` (`/anunturi`): adaug chip „Ca proprietar" lângă titlul existent.

Chipurile folosesc `Badge` shadcn cu variant subtle (chiriaș = albastru/sky, proprietar = primary/orange) pentru a fi recognoscibile vizual și consistente între pagini și meniuri.

### 5. `MobileDrawer.tsx` și `MobileBottomNav.tsx`
- În drawer-ul mobil reordonez sub 2 secțiuni „Ca chiriaș" / „Ca proprietar" cu noile etichete.
- `MobileBottomNav` rămâne neschimbat (doar 5 iconițe, nu include rezervări/închirieri).

### 6. Localizare
Toate stringurile adăugate trec prin `t(ro, en)` direct (același pattern ca în restul componentelor atinse). Nu se modifică `uxCopy.ts`.

## Out of scope
- Nu modific rutele (`/rezervari`, `/inchirieri`, `/anunturi` rămân — doar redirect-urile existente).
- Nu schimb `RentalsTab` / `RentalsOutTab` (conținutul listei rămâne identic).
- Nu schimb DB, RLS, RPC-uri sau queries.
- Nu unific paginile într-un singur dashboard cu tabs (ar regresa flow-ul deep-linking actual).

## Tech notes
- Fișiere atinse: `src/components/profile/dashboard/NavGroups.tsx`, `src/components/layout/AccountHubMenu.tsx`, `src/components/layout/mobile-drawer/MobileDrawer.tsx`, `src/pages/RentalsPage.tsx`, `src/pages/RentalsOutPage.tsx`, `src/pages/ListingsPage.tsx`, eventual `src/components/profile/dashboard/QuickActions.tsx` pentru consistența etichetelor.
- Singurul „risc" este că textul „Rezervări" apare și în `NotificationCenter` (mapare tip notificare → label) — îl actualizez și acolo la „Închirieri" pentru chiriaș, „Cereri" pentru proprietar, dacă tipul de notificare permite distincția; altfel păstrez „Închirieri" generic.
