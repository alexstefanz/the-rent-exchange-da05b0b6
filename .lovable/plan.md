## Compactare BookingCard pe pagina de produs

Modificări în `src/components/product/BookingCard.tsx` pentru a elimina scroll-ul intern al cardului.

### 1. Header titlu + prețuri (imagine 1)

În prezent:
- Titlu `text-2xl` (desktop) / `text-[25px]` (mobil)
- Sub titlu, bloc preț cu `1 RON / zi` mare, apoi 2 rânduri separate pentru `6 RON / săptămână` și `22 RON / 30 zile`

Devine:
- Titlu desktop redus la `text-lg` (titlu mobil rămâne dar redus la `text-xl`)
- Pe un singur rând sub titlu: `1 RON / zi` (primary, bold, `text-xl`) la stânga, iar la dreapta — pe același rând — `6 RON / săpt.` · `22 RON / 30 zile` (text muted, `text-xs`, separator `·`)
- Eliminăm `Separator` dintre header și calendar pentru a câștiga spațiu vertical
- Reducem marginile (`mb-4` → `mb-2/3`) și padding-ul cardului (`p-4 sm:p-6 lg:p-5` → `p-3 sm:p-4 lg:p-4`)

### 2. Sumar perioadă + total (imagine 2)

În prezent (când există `startDate` + `endDate`):
- Bloc cu 2 rânduri separate: `preț/zi: 13 mai 2026` și `Până la: 15 mai 2026`
- Apoi breakdown pe luni/săptămâni/zile (până la 3 rânduri)
- Apoi total

Devine — bloc compact cu 2 rânduri:
- Rând 1 (inline): `13 mai 2026 → 15 mai 2026` (data start, săgeată/`→`, data end), aliniat stânga, font medium
- Rând 2: `Total (3 zile)` la stânga, `3 RON` în primary la dreapta, font semibold
- Eliminăm complet breakdown-ul detaliat luni/săptămâni/zile din card (rămâne implicit doar `Total (N zile)`); calculul rămâne neschimbat în spate
- Eliminăm `Separator` interior din bloc, reducem `p-4` → `p-3`

### 3. Curățare scroll

- Scoatem clasele `lg:max-h-[calc(100vh-7rem)] lg:flex lg:flex-col` și `lg:flex-1 lg:overflow-y-auto` plus scrollbar custom — cardul devine `sticky` cu înălțime naturală, fără scroll intern
- Footer cu butonul rămâne în card, dar fără `border-t` separat (sau cu `mt-3` simplu)

### 4. Pastila cu intervalul de sub buton

Pastila existentă „dd MMM yyyy → dd MMM yyyy" devine redundantă cu noul rând inline din sumar — o eliminăm.

### Detalii tehnice
- Fișier modificat: `src/components/product/BookingCard.tsx`
- Localizare ro/en pentru `Total (N zile / N days)` folosind `language` deja disponibil; nu adăugăm chei noi în `uxCopy.ts` (scurtături inline acceptabile, similar codului existent)
- `priceBreakdown` poate rămâne calculat sau poate fi simplificat la doar `rentalDays` (prefer să-l păstrăm pentru a nu sparge alte locuri, dar nu-l mai randăm)
- Logica calendar, KYC gate, navigare checkout — neschimbate