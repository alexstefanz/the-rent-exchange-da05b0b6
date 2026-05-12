## Real-time pentru pașii unei închirieri

### Cauza identificată

Pagina `RentalDetailPage.tsx` este deja abonată corect via `supabase.channel(...)` la modificări pe tabelele `rentals` și `rental_pv_documents`. Problema e la nivel de bază de date: aceste tabele **nu sunt incluse în publication-ul `supabase_realtime`**, așa că Postgres nu trimite evenimentele. Doar `rental_inspections` e inclus.

Verificat:
```
SELECT tablename FROM pg_publication_tables WHERE pubname='supabase_realtime';
→ doar rental_inspections
```

### Fix (migrație SQL)

Adaug în publication tabelele lipsă și setez `REPLICA IDENTITY FULL` pe ele (necesar ca payload-ul UPDATE să conțină valorile vechi/noi pentru filtrele RLS):

```sql
ALTER TABLE public.rentals REPLICA IDENTITY FULL;
ALTER TABLE public.rental_pv_documents REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.rentals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rental_pv_documents;
```

### Hardening minor în UI (opțional, în același pas)

În `RentalDetailPage.tsx`, extind subscription-ul existent pentru a invalida și pe evenimente din `rental_inspections` filtrate pe `rental_id` — asta acoperă și cazul când un PV este completat printr-un flux de inspecție:

```ts
.on("postgres_changes",
  { event: "*", schema: "public", table: "rental_inspections", filter: `rental_id=eq.${rental.id}` },
  () => queryClient.invalidateQueries({ queryKey: ["rental-detail", publicId] }),
)
```

### Rezultat

După migrație, când chiriașul semnează PV Returnare, cardul "PV Returnare" pentru proprietar se deblochează automat fără refresh, iar timeline-ul (Cerere → Confirmat → Plată → Semnături → Predat → Returnare → Finalizat) avansează live pentru ambele părți.

### Out of scope

- Niciun refactor de hook-uri sau extragere de logică.
- Nu modific RLS, edge functions sau email-urile.