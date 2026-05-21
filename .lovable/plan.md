## Plan

Voi corecta cardul negru „Balanță disponibilă” din meniul „Contul meu” astfel încât să afișeze aceeași sumă ca pagina `/castiguri`: **8.00 RON**.

### Ce voi modifica

1. **`src/components/layout/AccountHubMenu.tsx`**
   - Voi schimba sursa soldului din card ca să folosească direct `useWalletBalance()`, aceeași sursă RPC ca wallet-ul.
   - Voi păstra fallback-ul existent doar pentru loading, dar prioritatea va fi soldul oficial din wallet.
   - Cardul va rămâne complet clickabil și va naviga către `/castiguri`.
   - Voi afișa suma cu 2 zecimale (`8.00 RON`), ca pe pagina de câștiguri, nu rotunjit (`8 RON`).

2. **Invalidare cache / realtime**
   - Voi ajusta inconsistența de cache unde unele invalidări folosesc cheia veche `wallet-balance`, iar hook-ul real folosește `walletBalance`.
   - Astfel, la schimbări în wallet/rentals/withdrawals, cardul din cont și pagina de câștiguri se actualizează împreună.

### De ce încă vezi 2 RON

Cardul din screenshot este în `AccountHubMenu.tsx`, nu cardul adăugat anterior în `QuickActions`. El încă poate primi o valoare veche/stale din query-ul de dashboard/drawer, iar pagina `/castiguri` folosește calculul complet. Îl voi lega explicit la `useWalletBalance()` ca sursă finală de adevăr.

### Verificare

După implementare, verific în cod că toate afișările principale de sold folosesc același RPC și aceeași cheie de cache, iar linkul cardului rămâne către `/castiguri`.