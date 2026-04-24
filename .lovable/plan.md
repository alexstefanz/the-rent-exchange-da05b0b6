

## Plan: Separare clară Predare (Owner) vs Primire (Renter)

### Problema actuală

Ambele părți (owner + renter) văd ambele butoane „Predare" și „Returnare" în funcție de statusul rezervării — duplicat și confuz. În plus, semantica e greșită din perspectiva fluxului fizic:
- La început, **owner-ul predă** produsul → renter-ul **primește**.
- La final, **renter-ul returnează** → owner-ul **primește înapoi**.

### Decizie funcțională

Fiecare parte fotografiază **doar** momentul în care produsul iese / intră în posesia ei — nu ambele faze.

| Status rezervare | Owner (RentalsOutTab) | Renter (RentalsTab) |
|---|---|---|
| `confirmed` (înainte de start) | 📷 **Predare** (checkout) | 📷 **Primire** (checkout) |
| `active` (în desfășurare) | — (fără buton) | 📷 **Returnare** (checkin) |
| după ce renter-ul a returnat | 📷 **Confirmare primire** (checkin) | — (fără buton) |

Astfel:
- **Faza checkout** (predare/primire la început): owner = `role: "owner"`, renter = `role: "renter"`. Ambii pot încărca poze, dar din perspective diferite (ce predau / ce primesc).
- **Faza checkin** (returnare la final): renter face poze înainte să restituie; owner face poze când reia produsul.

### Modificări

#### 1. `src/components/dashboard/RentalsTab.tsx` (renter)
- Înlocuiesc logica butonului unic care comuta între „Predare/Returnare" cu:
  - Dacă `status === "confirmed"` și NU există încă inspecție checkout pentru renter → buton **„📷 Primire"** (phase=`checkout`, role=`renter`).
  - Dacă `status === "active"` → buton **„📷 Returnare"** (phase=`checkin`, role=`renter`).
  - După ce renter-ul a apăsat „Returnare" și a salvat inspecția, butonul rămâne vizibil ca „Vezi pozele" (deja gestionat de `InspectionDialog` care arată ce a încărcat).
- Eticheta pentru `confirmed` se schimbă din „Predare" în **„Primire"**.

#### 2. `src/components/dashboard/RentalsOutTab.tsx` (owner)
- La `status === "confirmed"` → buton **„📷 Predare"** (phase=`checkout`, role=`owner`) — NU se mai schimbă în „Returnare" la `active`.
- La `status === "active"` → **fără** buton de poze (owner-ul așteaptă ca renter-ul să returneze fizic).
- După ce renter-ul a făcut inspecția `checkin` (sau owner-ul a apăsat „Confirmă returnarea"), apare buton **„📷 Confirmare primire"** (phase=`checkin`, role=`owner`) — opțional, ca dovadă vizuală că produsul a revenit în stare bună.

  Detaliu tehnic: detectez prezența unei inspecții renter `checkin` printr-o query rapidă pe `rental_inspections` sau pur și simplu afișez butonul pentru orice rental `active`/`completed` recent — versiunea simplă: îl arăt dacă `status === "active"` ȘI există cel puțin o inspecție de phase `checkin` făcută de renter.

#### 3. `src/components/dashboard/InspectionDialog.tsx`
- Mic update la `phaseLabels` pentru a fi context-aware după rol:
  - Owner + checkout → „Predare"
  - Renter + checkout → „Primire"
  - Renter + checkin → „Returnare"
  - Owner + checkin → „Confirmare primire"
- Adaug un mic mapper `getPhaseLabel(phase, role)` pentru titlu și descriere coerente.
- Descrierea dialogului se ajustează: ex. pentru renter+checkout → „Fotografiază produsul în momentul în care îl primești de la proprietar."

#### 4. `src/data/uxCopy.ts`
- Adaug 4 chei noi în secțiunea `inspection` (RO/EN):
  - `handover` = „Predare" / „Hand-over"
  - `pickup` = „Primire" / „Pick-up"
  - `return` = „Returnare" / „Return"
  - `receivedBack` = „Confirmare primire" / „Confirm received back"

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/components/dashboard/RentalsTab.tsx` | Buton „Primire" la `confirmed`, „Returnare" la `active` (renter) |
| `src/components/dashboard/RentalsOutTab.tsx` | Buton „Predare" doar la `confirmed`; opțional „Confirmare primire" după ce renter-ul a returnat |
| `src/components/dashboard/InspectionDialog.tsx` | Etichete și descrieri context-aware după (phase, role) |
| `src/data/uxCopy.ts` | 4 chei noi pentru etichete |

### Rezultat

- **Owner** vede „📷 Predare" doar înainte ca rezervarea să înceapă, exact când îi dă fizic produsul chiriașului. Opțional poate documenta primirea înapoi la final.
- **Chiriașul** vede „📷 Primire" la început (când ridică produsul) și „📷 Returnare" la final (când îl restituie).
- Niciuna dintre părți nu mai vede butoane care nu țin de rolul ei → flux mai clar și fără duplicare conceptuală.

