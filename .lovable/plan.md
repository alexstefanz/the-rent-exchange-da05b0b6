## Obiectiv

Refac hero-ul din pagina **Câștiguri** astfel încât **Bani disponibili** și **Bani în așteptare** să apară ca două carduri mari, alăturate, cu greutate vizuală egală.

## Layout nou

```text
┌───────────────────────────────┬───────────────────────────────┐
│  Disponibil pentru retragere  │  În așteptare                 │
│  1.234,50 RON                 │  450,00 RON                   │
│  +120,00 RON luna aceasta     │  Se deblochează la finalizare │
│  [Retrage bani]               │  (helper text + tooltip)      │
└───────────────────────────────┴───────────────────────────────┘
```

- Desktop (≥ `sm`): două coloane egale, `grid-cols-2`, gap 4.
- Mobile: stivuite, `grid-cols-1`.

## Modificări

### 1. `src/components/earnings/WalletHeroCard.tsx`
- Trec layout-ul intern la `grid sm:grid-cols-2 gap-4`.
- **Card stâng "Disponibil"** (verde primary):
  - Iconiță `Wallet`, label `Disponibil pentru retragere / Available to withdraw`
  - Sumă mare animată (count-up) + `RON`
  - Sub-linie: `+X RON luna aceasta` dacă `thisMonth > 0`
  - Buton `Retrage bani` (logica disable rămâne identică: ban, fără metodă, sold 0)
  - Helper text scurt despre folosirea soldului în checkout
- **Card drept "În așteptare"** (amber):
  - Iconiță `Clock`, label `În așteptare / Pending`
  - Sumă mare `pendingEarnings.toFixed(2)` + `RON` (0,00 dacă nu există)
  - Helper bilingv: `Se deblochează automat după finalizarea închirierii.`
  - Tooltip cu detalii: fonduri câștigate după semnarea procesului verbal, devin disponibile la status `completed`.
  - Fără buton — informativ.
- Păstrez gradient subtle + glow doar pe cardul "Disponibil"; cardul "În așteptare" primește accent amber discret (`from-amber-500/8 via-background`).
- Elimin chip-ul mic "+X în curs" (acum redundant).

### 2. `src/components/earnings/BalanceBreakdown.tsx`
- Trec grila la `grid-cols-2 sm:grid-cols-3` și scot cardul **"În curs"** (a urcat în hero). Rămân: Disponibil, Retras, Total câștiguri.
- Astfel evităm duplicarea informației pending.

### 3. Fără schimbări pe hooks / RPC / migrări
- `useWalletBalance` și `get_user_wallet_balance` rămân neschimbate; doar consumăm `pendingEarnings`.
- `EarningsTab.tsx` deja pasează `pendingEarnings` în hero și `pending` în breakdown — nu necesită modificări.

## Verificare

1. User cu `available > 0` și `pending = 0` → cardul drept arată `0,00 RON` cu textul "Niciun ban în așteptare".
2. User cu pending > 0 → cardul drept arată suma în amber, fără buton.
3. Mobile (< 640px) → carduri stivuite pe verticală, buton "Retrage" full-width.
4. Grila de mai jos arată 3 carduri (Disponibil / Retras / Total), fără dublură pending.
