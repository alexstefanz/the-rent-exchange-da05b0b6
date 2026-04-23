

## Plan: Cereri anulate — fix etichetă + acordeon

### Problemă

În secțiunea „Cereri anulate" (`/cereri`):
1. Iconul roșu cu X afișează textul **„Cerere aprobată"** — greșit. Trebuie **„Cerere respinsă"**.
2. Sub timeline mai apar pașii ulteriori (În tranzit, În uz, etc.) — nu au sens pentru o cerere respinsă.
3. Lista de cereri anulate ocupă mult spațiu — trebuie ascunsă într-un acordeon.

### Cauză

În `src/components/dashboard/RentalTimeline.tsx`, când `status === "cancelled"`, componenta marchează step 2 (= „Cerere aprobată" din `copy.timeline.requestApproved`) ca step „cancelled" cu X roșu — dar păstrează eticheta originală.

### Modificări

#### 1. `src/components/dashboard/RequestsTab.tsx`
- Înlocuiesc cardurile din secțiunea „Cereri anulate" cu un **acordeon colapsat** (`<Accordion>` din `@/components/ui/accordion`) — titlu „Cereri anulate ({count})", inițial închis.
- În interiorul acordeonului, păstrez aceeași listă de carduri, dar **elimin complet `<RentalTimeline>` și `divider-ul** asociat. Cardul anulat va arăta:
  - imagine produs
  - titlu + StatusBadge „Anulată"
  - perioadă (Calendar + date)
  - sumă (text muted)
  - opțional: mesaj „💸 Banii au fost returnați" dacă `refunded_at` există
- Fără timeline → fără confuzie cu „Cerere aprobată".

#### 2. `src/components/dashboard/RentalTimeline.tsx`
Pentru consistență (timeline-ul mai e folosit pe `RentalsPage`, `RentalsOutTab`, etc., unde un rental respins/anulat poate apărea):
- Schimb logica: când `cancelled === true`, label-ul step-ului curent devine **„Cerere respinsă"** (RO) / **„Request rejected"** (EN), nu se mai afișează pașii ulteriori (`isUpcoming` rămâne stilizat ca muted, dar e ok să rămână vizibili pentru context — sau îi pot **ascunde complet** dacă cancelled).
- Decizie: când `cancelled`, **afișez doar pașii 1 + 2** (Cerere trimisă → Cerere respinsă cu X roșu), restul nu mai sunt randate. Mai curat vizual.

#### 3. `src/data/uxCopy.ts`
- Adaug intrarea `timeline.requestRejected` cu RO „Cerere respinsă" / EN „Request rejected".

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/components/dashboard/RequestsTab.tsx` | Wrap „Cereri anulate" în Accordion; elimin `<RentalTimeline>` din carduri |
| `src/components/dashboard/RentalTimeline.tsx` | La `cancelled`, afișez doar pașii 1+2; label step 2 devine „Cerere respinsă" |
| `src/data/uxCopy.ts` | Adaug cheia `timeline.requestRejected` (RO/EN) |

### Rezultat

- Cardurile anulate sunt grupate sub acordeon „Cereri anulate ({n})" colapsat by default.
- Cardurile din interior nu mai au timeline — doar info esențială (poză, titlu, perioadă, sumă, refund).
- În alte locuri din app unde timeline-ul apare pentru un rental anulat, X roșu va fi etichetat corect „Cerere respinsă" și pașii 3-6 nu mai apar.

