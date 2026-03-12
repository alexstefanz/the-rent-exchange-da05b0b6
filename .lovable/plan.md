

## Fix: Click pe "Balanță" să navigheze la tab-ul Câștiguri

### Problemă
Codul deja face `navigate("#castiguri")` la click pe cardul Balanță, dar tab-ul nu se schimbă deoarece `useEffect`-ul din `Profile.tsx` ascultă doar `window.hashchange`, nu și schimbările de `location` din react-router.

### Soluție
În `src/pages/Profile.tsx`, adaug `location.hash` ca dependență în `useEffect`-ul existent (sau un `useEffect` separat) care sincronizează `activeTab` cu hash-ul din URL:

```tsx
useEffect(() => {
  setActiveTab(getTabFromHash());
}, [location.hash]);
```

Asta va face ca orice schimbare de hash (inclusiv din `navigate("#castiguri")` apelat din `BalanceCard`) să actualizeze tab-ul activ.

### Fișier modificat
- `src/pages/Profile.tsx` — adăugare `location.hash` ca dependență pentru sincronizarea tab-ului

