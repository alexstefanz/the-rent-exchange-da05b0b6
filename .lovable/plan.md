## Plan

Voi separa clar rezervările active de istoric în `RentalsTab.tsx` (chiriaș) și `RentalsOutTab.tsx` (proprietar):

### Logica nouă
- **Rezervări active** (card-uri premium cu imagine): status `pending`, `confirmed`, `active`, `early_return_requested`, `overdue` — adică orice tranzacție încă în desfășurare.
- **Istoric** (dropdown/accordion): DOAR `completed`, `cancelled`, `rejected` — tranzacții finalizate definitiv.

### Modificări

1. **`src/components/dashboard/RentalsTab.tsx`**
   - `isPremium(r)` → `true` dacă `status` ∉ {`completed`, `cancelled`, `rejected`}.
   - `historyRentals` = doar cele cu status `completed`, `cancelled` sau `rejected`.
   - Schimb titlul accordion-ului din „Rezervări active & istoric" în „Istoric închirieri".

2. **`src/components/dashboard/RentalsOutTab.tsx`** (aceeași logică pentru proprietar, pentru consistență — verific întâi dacă are structură identică; dacă da, aplic aceeași schimbare).

### De ce RNT-000053 nu se va mai muta singură
RNT-000053 are status `confirmed` în DB, nu `completed`. După această schimbare, va rămâne tot în „active" (pentru că `confirmed` ∉ istoric). Va trece în istoric automat doar după ce devine `completed` sau `cancelled`.

Dacă vrei ca RNT-000053 (și similare) să fie marcată acum ca finalizată, e nevoie de o acțiune separată (ex: buton „Marchează ca finalizată" sau marcare manuală). Spune-mi dacă o vrei și pe aceasta.
