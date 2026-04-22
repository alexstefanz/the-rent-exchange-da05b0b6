

## Plan: Tab dedicat „Închirieri" pentru proprietar

### Context

În prezent:
- `/rezervari` → ce am închiriat ca renter (Rezervări)
- `/anunturi` → produsele mele + cererile/închirierile primite ca proprietar (totul amestecat în `LendingsTab`)
- Dropdown user: lipsește o intrare clară pentru „ce am dat eu spre închiriere ca proprietar"

Vreau o secțiune separată „Închirieri" — produsele tale care sunt active la chiriași — distinctă vizual de Rezervări.

### Modificări

#### 1. Componentă nouă `src/components/dashboard/RentalsOutTab.tsx` (owner view)
Extrag din `LendingsTab` doar partea cu cereri primite + istoric închirieri (codul existent din secțiunile „Cereri de închiriere" și „Istoric închirieri"). Păstrez:
- Cereri pending cu Accept/Refuză
- Card timeline pentru fiecare închiriere
- Buton Predare/Returnare (Inspection dialog)
- Confirm handover / confirm return
- `PayoutStatusBadge`
- Status plată collapsible

Diferențiere vizuală față de Rezervări (renter side):
- Header secțiune cu **iconiță `Package` portocalie** + titlu „Închirieri active" (vs. „Rezervări viitoare" la renter)
- Carduri cu **bordură stânga groasă (4px) accent primary** (`border-l-4 border-l-primary`) — accent vizual care lipsește la Rezervări
- Badge suplimentar „Câștig: X RON" lângă numele renterului (perspectiva owner-ului — câștig, nu cost)
- Stats bar sus cu 3 carduri: Cereri noi · Active · Total câștigat luna asta
- Empty state diferit: iconiță `Package`, copy „Niciun produs închiriat momentan" + CTA către „Adaugă anunț"

#### 2. Pagina nouă `src/pages/RentalsOutPage.tsx`
Clonă a `RentalsPage.tsx` dar:
- Titlu: „Închirieri" (RO) / „Lendings" (EN)
- Subtitlu sub titlu: „Produsele tale închiriate și cererile primite"
- Renderizează `<RentalsOutTab />`
- Buton „Înapoi la Contul Meu"

#### 3. Refactor `src/components/dashboard/LendingsTab.tsx`
Elimin secțiunile „Cereri de închiriere" și „Istoric închirieri" (mutate în RentalsOutTab). Păstrez DOAR:
- Stats: produse active
- Lista „Anunțurile mele" cu Edit/View
- CTA „Adaugă anunț"

Pagina `/anunturi` rămâne dedicată exclusiv produselor (listings), nu mai amestecă rentals.

#### 4. Rută nouă în `src/App.tsx`
```
<Route path="/inchirieri" element={<RentalsOutPage />} />
```

#### 5. Dropdown navbar `src/components/layout/Navbar.tsx`
În meniul user, ordinea nouă (deasupra Rezervări):
```
- Contul meu
- Anunțurile mele
- Închirieri              ← NOU (icon: Package)
- Rezervări               ← deja existent (icon: CalendarCheck)
- Favorite
```
Same ordine în meniul mobile.

#### 6. Hub navigation `src/pages/Profile.tsx`
Adaug card nou „Închirieri" în grid-ul de butoane portocalii, între „Rezervări" și „Anunțuri":
```
Detalii cont · Cereri · Rezervări · Închirieri · Anunțuri · Activitate
```
Grid devine 2 col mobil, 6 col desktop (sau 3 col / 6 col).

#### 7. Badge cont închirieri active (opțional, recomandat)
Query nouă în Profile: număr de rentals cu `status in (confirmed, active)` unde `owner_id = user.id`. Afișez badge mic pe cardul „Închirieri" similar cu cel de la „Cereri".

### Diferențe vizuale Rezervări vs. Închirieri (recap)

| Aspect | Rezervări (`/rezervari`) | Închirieri (`/inchirieri`) |
|---|---|---|
| Perspectivă | Renter — ce am închiriat | Owner — ce am dat la închiriat |
| Iconiță hero | `CalendarCheck` | `Package` |
| Bordură carduri | Standard `border-border` | `border-l-4 border-l-primary` |
| Sumă afișată | „X RON" (cost) | „Câștig: X RON" + `PayoutStatusBadge` |
| Acțiuni primare | Contactează proprietarul · Predare | Accept/Refuză · Confirmă predare/returnare |
| Stats sus | — | Cereri noi · Active · Câștig lună |

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/components/dashboard/RentalsOutTab.tsx` | NOU — owner-side rentals + cereri |
| `src/pages/RentalsOutPage.tsx` | NOU — wrapper pagină pentru tab |
| `src/components/dashboard/LendingsTab.tsx` | Refactor — păstrează doar listings |
| `src/App.tsx` | Adaug rută `/inchirieri` |
| `src/components/layout/Navbar.tsx` | Adaug item „Închirieri" deasupra „Rezervări" în dropdown desktop + mobile |
| `src/pages/Profile.tsx` | Adaug card „Închirieri" în grid + query badge |

### Limitări recunoscute

- Funcționalitatea de pe `/inchirieri` reutilizează exact aceleași API-uri (`getOwnerRentals`, `respondToRental`, `confirmHandover`, `confirmReturn`) — niciun cost backend suplimentar.
- Pagina `/anunturi` rămâne funcțională, doar curățată — nu sparge nimic existent.
- Linkurile vechi din notificări/email-uri către `/anunturi?rental_id=...` continuă să meargă, dar voi adăuga și varianta nouă `/inchirieri?rental_id=...` pentru evidențierea cardului. Email-urile noi pot fi actualizate într-un task separat dacă dorești.

