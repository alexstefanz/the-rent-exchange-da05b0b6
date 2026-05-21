## Plan: KYC status în timp real (fără refresh)

### Problemă
`KycInlineFlow` (folosit în pagina `/verificare` și inline pe alte pagini) încarcă o singură dată `kyc_cases` într-un state local cu `useEffect`. Când adminul aprobă/respinge dosarul:
- `useKycGate` se actualizează în realtime (subscriere pe `profiles`),
- DAR `KycInlineFlow` continuă să afișeze ecranul vechi (ex: „Documente trimise") până la refresh, pentru că nimic nu re-citește `kyc_cases`.

Realtime trebuie adăugat și pe `kyc_cases` pentru userul curent.

### Fix — `src/components/kyc/KycInlineFlow.tsx`

1. **Extrag `load()` în afara `useEffect`** într-un callback `refreshKycCase` (folosind `useCallback`) ca să poată fi reapelat.

2. **Adaug o subscriere realtime pe `kyc_cases`** filtrată după `user_id=eq.${user.id}`, ascultând `event: "*"` (INSERT/UPDATE/DELETE). La orice eveniment → re-rulez `refreshKycCase()` + invalidez `kycGate` în React Query.

```tsx
useEffect(() => {
  if (!user?.id) return;
  const channel = supabase
    .channel(`kyc-cases-${user.id}`)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "kyc_cases",
      filter: `user_id=eq.${user.id}`,
    }, () => {
      refreshKycCase();
      queryClient.invalidateQueries({ queryKey: ["kycGate", user.id] });
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [user?.id, queryClient, refreshKycCase]);
```

3. **Activez realtime pe tabela `kyc_cases`** prin migrare SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.kyc_cases;
ALTER TABLE public.kyc_cases REPLICA IDENTITY FULL;
```
(verific întâi dacă nu e deja adăugată).

### Efect
- Imediat ce adminul aprobă/respinge un dosar, ecranul utilizatorului din `/verificare` și badge-urile din alte pagini (`useKycGate` deja are realtime pe `profiles`) trec automat în noua stare, fără refresh manual.

### Ce nu modific
- Logica de upload documente, fluxul de aprobare admin, RLS-ul existent.
- `useKycGate` rămâne neschimbat (deja are realtime pe `profiles`).