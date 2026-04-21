

## Plan: Reparare cache stale KYC — userul nou aprobat nu poate rezerva

### Diagnostic confirmat

Am verificat în DB pentru `alexadvanceonline@gmail.com`:
- `profiles.kyc_status = 'VERIFIED'` ✅
- `kyc_cases.status = 'APPROVED'` ✅ (KYC-000007, decis acum câteva minute)

Deci **backend-ul e corect**, adminul a aprobat și totul s-a actualizat.

**Cauza reală**: `useKycGate()` (hook-ul folosit de `BookingCard` și `Checkout` pentru a decide dacă userul poate rezerva) are:
```ts
staleTime: 60 * 1000  // 60 secunde
```
și **nu se invalidează niciodată** când statusul KYC se schimbă în DB. Userul a fost aprobat în alt context (admin), iar tab-ul lui încă ține în cache vechiul `kyc_status` (`SUBMITTED` sau `NOT_VERIFIED`).

Pagina `/verificare` afișează "Identitate verificată!" pentru că face fetch direct din `kyc_cases` la montare, **nu** prin React Query. Dar `BookingCard` folosește `useKycGate` cu cache stale → blochează rezervarea.

### Soluție

#### 1. `useKycGate.ts` — refresh agresiv

```ts
useQuery({
  queryKey: ["kycGate", user?.id],
  queryFn: async () => { /* ... */ },
  enabled: !!user?.id,
  staleTime: 10 * 1000,        // 10s în loc de 60s
  refetchOnWindowFocus: true,  // refresh la revenirea pe tab
  refetchOnMount: "always",    // refresh când orice componentă montează hook-ul
});
```

Plus subscriere Realtime la `profiles` pentru user-ul curent — când `kyc_status` se schimbă în DB, invalidate-uiesc query-ul:

```ts
useEffect(() => {
  if (!user?.id) return;
  const channel = supabase
    .channel(`profile-kyc-${user.id}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'profiles',
      filter: `id=eq.${user.id}`,
    }, () => {
      queryClient.invalidateQueries({ queryKey: ['kycGate', user.id] });
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [user?.id, queryClient]);
```

Astfel, în secunda în care adminul aprobă (UPDATE pe profiles), tab-ul userului primește push prin Realtime → invalidate → refetch → `isVerified=true` → poate rezerva.

#### 2. Asigur că Realtime e activat pe `profiles`

Verific dacă tabela `profiles` e în `supabase_realtime` publication. Dacă nu, migrație simplă:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
```

#### 3. Fallback explicit pe pagina `/verificare`

Când userul deschide `/verificare` și vede "Identitate verificată!", invalidate-uiesc proactiv `kycGate` (în caz că tab-ul a fost deschis demult):
```ts
useEffect(() => {
  if (kycCase?.status === 'APPROVED' || kycCase?.status === 'VERIFIED') {
    queryClient.invalidateQueries({ queryKey: ['kycGate', user?.id] });
  }
}, [kycCase?.status]);
```

### Rezultat

- Userul aprobat de admin → tab-ul lui primește notificare Realtime în <1s → cache invalidat → `BookingCard` și `Checkout` recunosc imediat statusul `VERIFIED` → poate rezerva fără refresh manual.
- Chiar și fără Realtime (offline scurt), refetch la `windowFocus` și `staleTime: 10s` reduc ferestre de stale data la minimum.
- Fără modificări de DB (RLS/triggers) — doar comportament client-side mai reactiv.

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/hooks/queries/useKycGate.ts` | `staleTime` redus la 10s, `refetchOnWindowFocus: true`, `refetchOnMount: "always"` + subscriere Realtime pe `profiles` cu `invalidateQueries` |
| `supabase/migrations/<ts>.sql` | (Doar dacă e nevoie) `ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles` |
| `src/pages/KycVerification.tsx` | Invalidate `kycGate` când vede status `APPROVED`/`VERIFIED` la load |

### Limitări recunoscute

- Realtime push depinde de WebSocket activ (dacă userul are throttling agresiv pe browser, pot exista delay-uri de 1-2s, dar refetch-ul la focus compensează).
- Nu schimb logica de approval în `kycApi.ts` — fluxul DB rămâne identic.
- Dacă userul are mai multe tab-uri deschise, fiecare primește push independent (corect).

