# Meniu cont: butoane și „Anunțurile mele”

## Ce se schimbă în meniu

1. Se elimină cardul „Închirieri încheiate” din meniul contului.
2. Rândul de sus rămâne cu două butoane, unul lângă altul:
   - „Adaugă anunț” (portocaliu, ca acum)
   - „Anunțurile mele” — buton alb cu umbră, iconiță portocalie, text negru; duce la lista completă de anunțuri (`/anunturi`).
3. „Panou Admin” (verde) se mută dedesubt, pe toată lățimea, vizibil doar pentru admini.

```text
[ + Adaugă anunț ]  [ ▤ Anunțurile mele ]
[        ✓ Panou Admin (full width)     ]
```

## Lista „Anunțurile mele”

Pagina `/anunturi` există deja și afișează toate produsele utilizatorului (active, ascunse, în verificare, respinse), cu filtre și acțiuni de editare/ștergere. Nu se rescrie pagina — se leagă butonul la ea și se verifică faptul că sunt vizibile atât anunțurile active, cât și cele inactive.

## Editare și ștergere cu confirmare de la admin

- Editare: la salvarea unei modificări, anunțul trece automat în starea „În verificare” și reapare public doar după aprobarea adminului. Acest comportament există deja.
- Ștergere: în loc de ștergere imediată, anunțul intră în starea „Ștergere în așteptare”: dispare din căutări, iar proprietarul vede badge-ul „Ștergere în așteptare” și poate anula cererea. Ștergerea devine definitivă doar după confirmarea adminului. Rămâne blocată dacă produsul are închirieri active.
- În „Panou Admin > Aprobări” se adaugă un tab „Cereri de ștergere”, cu aprobare (ștergere definitivă) sau respingere (anunțul revine la starea anterioară).

## Detalii tehnice

- `src/components/layout/AccountHubMenu.tsx`: scoatere card „Închirieri încheiate”, adăugare buton alb „Anunțurile mele” (`bg-card`, `shadow`, icon `Package`/`List` în `text-primary`, text `text-foreground`), mutare buton admin într-un rând propriu `w-full`.
- Migrație DB: coloane `deletion_requested_at` / `deletion_requested_by` pe `products`; RPC `request_product_deletion` (înlocuiește apelul direct la `soft_delete_my_product` din `productsApi.ts`), `cancel_product_deletion_request`, plus RPC-uri admin `admin_confirm_product_deletion` / `admin_reject_product_deletion`, toate `SECURITY DEFINER` cu verificare de proprietar/rol admin și blocaj pe închirieri active.
- Filtrarea publică a produselor exclude cele cu cerere de ștergere în așteptare.
- `src/pages/ListingsPage.tsx` + `ListingStatusBadge`: stare nouă „Ștergere în așteptare”, dialog de confirmare actualizat („Cererea va fi trimisă spre aprobare”), acțiune de anulare a cererii.
- `src/pages/admin/AdminApprovals.tsx`: tab nou alimentat de un RPC `get_admin_pending_deletions`, cu butoane aprobă/respinge.
