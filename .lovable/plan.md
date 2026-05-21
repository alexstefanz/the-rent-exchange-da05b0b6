## Care e valoarea reală: **8.00 RON**

Sunt două calcule diferite în aplicație pentru același sold, de aici diferența:

- **Wallet (/castiguri) → 8.00 RON** — folosește RPC-ul `get_user_wallet_balance`, care e sursa oficială de adevăr. Include atât plățile de tip „owner_payout" și „withdrawal", **cât și creditele din `wallet_ledger`** (ex. rambursări, sume primite când chiriașul plătește din wallet, credite manuale).
- **Cardul „Balanță" (vechi) → 2.00 RON** — folosește o interogare directă în tabelul `transactions` care însumează doar `owner_payout − withdrawal`. **Ignoră complet `wallet_ledger`**, deci ratează creditele de 6 RON care fac diferența.

→ Soldul corect e **8.00 RON**. Cardul vechi trebuie aliniat la aceeași sursă.

---

## Plan

### 1. Aliniază toate locurile la RPC (single source of truth)

Refactorizez toate calculele de sold ca să folosească `useWalletBalance` (deja existent, învelește `get_user_wallet_balance`):

- **`src/components/layout/Navbar.tsx`** — elimin `useQuery(["user-balance"])` (linii 69–87) care însumează doar `transactions`, înlocuiesc cu `useWalletBalance()` → `data?.available`.
- **`src/hooks/queries/useDrawerStats.ts`** — scot bucla manuală pe `transactions` și citesc `balance` din același RPC. Astfel, „balanța" din drawer-ul mobil va arăta **8.00 RON**, nu 2.00.
- **`src/components/profile/BalanceCard.tsx`** — actualizez `balanceLoading`/`balance` să folosească `useWalletBalance` (chiar dacă nu mai e montat în Profile-ul nou, e bine să rămână consistent dacă cineva îl reintroduce).

Toate cele trei păstrează același `queryKey: ["walletBalance", userId]` deja folosit în `useEarnings`, deci o singură invalidare reactualizează totul.

### 2. Link de la „My Account" către Wallet

Pe `/profile` (Contul Meu), adaug un **card dedicat „Balanță disponibilă"** în secțiunea Quick Actions (lângă Mesaje / Închirieri active):

- Iconă `Wallet`, valoare `availableBalance.toFixed(2)` RON din `useAccountDashboard` (deja RPC).
- Cardul este complet clickable → `navigate("/castiguri")` cu `ArrowRight` indicator pe hover.
- Stil identic cu celelalte cards din `QuickActions` (rounded-2xl, border, hover ring-primary/20).
- Vizibil mereu (nu doar când `> 0`), pentru a oferi o intrare clară în Wallet.

Astfel, oriunde apare suma (Navbar, drawer mobil, dashboard, wallet) — toate vor afișa **același 8.00 RON** și fiecare card duce către `/castiguri`.

### Fișiere atinse

```text
src/components/layout/Navbar.tsx           (înlocuiește query manual cu useWalletBalance)
src/hooks/queries/useDrawerStats.ts        (citește balance din RPC)
src/components/profile/BalanceCard.tsx     (folosește useWalletBalance)
src/components/profile/dashboard/QuickActions.tsx  (adaugă card „Balanță" clickable → /castiguri)
```

Nicio modificare de backend / RLS / RPC — doar consolidare în frontend.