

## Plan: Chiriașul confirmă predarea înapoi cu poză și după finalizare

### Problemă

În prezent, chiriașul vede butonul „📷 Returnare" **doar când `status === "active"`**. În momentul în care proprietarul apasă „Confirmă returnarea", statusul devine `completed` și butonul dispare — chiriașul nu mai poate documenta cu poză starea în care a returnat produsul. Dacă apare o dispută ulterioară („mi l-a returnat zgâriat"), chiriașul nu are dovada lui vizuală.

Soluție: butonul de confirmare cu poză (faza `checkin`, rol `renter`) trebuie să rămână accesibil chiriașului și după ce rezervarea a trecut în `completed`, simetric cu owner-ul care poate face „Confirmare primire" inclusiv pe rezervări `completed`.

### Modificări

#### `src/components/dashboard/RentalsTab.tsx`

1. **Mut și rezervările `completed` recente într-o secțiune unde butoanele de inspecție rămân active**, NU în zona „Istoric închirieri" cu `opacity-75` fără acțiuni.
   - Definesc o categorie nouă: `completedRentalsAwaitingRenterCheckin` = rezervările `completed` pentru care chiriașul **NU a încărcat încă** o inspecție `checkin`.
   - Le afișez tot în secțiunea „Închirieri active" (sau direct deasupra istoricului) împreună cu butonul „📷 Confirmare predare" → deschide `InspectionDialog` cu `phase="checkin"`, `role="renter"`.

2. **Adaug query** pentru a ști care rezervări au deja inspecție `checkin` făcută de chiriaș (similar cu pattern-ul deja existent în `RentalsOutTab.tsx` pentru owner):
   ```ts
   const { data: renterCheckinIds } = useQuery({
     queryKey: ["my-renter-checkin-inspections", ...],
     queryFn: async () => supabase.from("rental_inspections")
       .select("rental_id").in("rental_id", ids)
       .eq("phase", "checkin").eq("role", "renter").eq("user_id", user.id)
   });
   ```

3. **Actualizez condițiile pe butoane**:
   - `status === "confirmed"` → buton „📷 Primire" (neschimbat).
   - `status === "active"` → buton „📷 Returnare" (neschimbat).
   - `status === "active" || status === "completed"` ȘI chiriașul nu a încărcat încă inspecție `checkin` → buton „📷 {copy.inspection.confirmHandedBack}" (nou).
     - Pentru `active`, înlocuiește butonul „Returnare" simplu (sunt funcțional același lucru — un singur buton, nu două).
   - În secțiunea „Istoric închirieri" (`completed` cu inspecție deja făcută) — fără buton, doar afișarea timeline-ului.

#### `src/data/uxCopy.ts`

Adaug o cheie nouă în secțiunea `inspection`:
- `confirmHandedBack`: `{ ro: "Confirmă predarea", en: "Confirm hand-back" }` — folosit de chiriaș pentru a documenta cu poză momentul în care a dat produsul înapoi proprietarului.

(Eticheta existentă `return` rămâne, dar nu o mai folosim pe buton — o înlocuim cu `confirmHandedBack` care e mai clară pentru fluxul „eu am dat produsul înapoi").

#### `src/components/dashboard/InspectionDialog.tsx`

Actualizez textele pentru renter+checkin pentru a reflecta acțiunea „de confirmare a predării înapoi" (în loc de „returnare în avans"):
- Titlu: „Confirmă predarea — {productTitle}"
- Descriere: „Fotografiază produsul în momentul în care îl predai înapoi proprietarului. Pozele sunt dovada ta că l-ai returnat în starea convenită."

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/components/dashboard/RentalsTab.tsx` | Query pentru inspecțiile renter checkin; afișează butonul „Confirmă predarea" și pe `completed` dacă încă nu a fost încărcat; rezervările `completed` fără inspecție rămân vizibile cu CTA până e completată |
| `src/data/uxCopy.ts` | Cheie nouă `inspection.confirmHandedBack` (RO/EN) |
| `src/components/dashboard/InspectionDialog.tsx` | Text context-aware pentru renter+checkin → „Confirmă predarea înapoi" |

### Rezultat

Chiriașul are acum exact simetria proprietarului:
- **Owner** poate documenta „📷 Confirmare primire" (checkin) și după ce rezervarea e `completed`.
- **Chiriaș** poate documenta „📷 Confirmă predarea" (checkin) și după ce rezervarea e `completed`.

Ambele părți au dovadă vizuală a stării produsului în momentul predării înapoi, indiferent cine a apăsat primul butonul de confirmare a returnării.

