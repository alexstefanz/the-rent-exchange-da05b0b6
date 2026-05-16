## Cauza erorii

`new row violates row-level security policy for table "rentals"` apare la încercarea de a trimite o cerere de rezervare din `/checkout`.

Am verificat politicile RLS de pe tabela `rentals`. Există doar:
- `Admins can delete rentals` (DELETE)
- `Admins can manage all rentals` (UPDATE — `w`, nu ALL)
- `Block banned users from inserting rentals` (INSERT, **restrictivă**) — doar blochează utilizatorii banați, nu permite nimănui să insereze
- `Block banned users from updating rentals` (UPDATE, restrictivă)
- `Owners can update own rental requests` (UPDATE)
- `Renters can cancel own pending rentals` (UPDATE)
- `Users can view own rentals` (SELECT)

**Nu există nicio politică permisivă de INSERT pentru renteri.** În Postgres, fără o politică permisivă care să permită acțiunea, totul este refuzat — de aceea orice utilizator (chiar și unul curat, neban) primește eroarea când încearcă să creeze o rezervare.

## Soluție

Adaug o migrare care creează politica lipsă pe `public.rentals`:

```sql
CREATE POLICY "Renters can create own rentals"
ON public.rentals
FOR INSERT
TO authenticated
WITH CHECK (renter_id = auth.uid());
```

Politica restrictivă existentă (`Block banned users from inserting rentals`) continuă să se aplice peste, deci utilizatorii banați rămân blocați.

## Out of scope

- Nu modific fluxul de checkout sau alte politici.
- Nu schimb politica de admin / ban — rămân exact cum sunt.
