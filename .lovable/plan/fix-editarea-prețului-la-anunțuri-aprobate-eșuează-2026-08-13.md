# Fix: editarea prețului la anunțuri aprobate eșuează

## Ce se întâmplă

Anunțul „Bicicleta" (Tilihi Andrei, Iași, 2 RON/zi) are statusul `approved`. Când proprietarul salvează o modificare (ex. prețul), aplicația marchează automat anunțul ca „în așteptare" pentru re-moderare. Regula de securitate din baza de date interzice însă oricui, în afară de administratori, să schimbe statusul de aprobare — deci întreaga salvare este respinsă și prețul rămâne neschimbat.

Rezultat: orice editare a unui anunț deja aprobat eșuează pentru toți utilizatorii, nu doar pentru acest produs.

## Soluția

Permite explicit tranziția „aprobat → în așteptare" atunci când proprietarul își editează propriul anunț, păstrând toate celelalte interdicții (nimeni nu se poate auto-aproba, nu poate modifica flag-uri de admin sau scorul de calitate).

1. Migrație pe funcția-trigger `enforce_products_owner_update`: excepție pentru cazul în care utilizatorul curent este proprietarul și statusul trece din `approved`/`rejected` în `pending`. Orice altă schimbare de status rămâne blocată.
2. Verificare că salvarea prețului funcționează și că anunțul reintră corect în coada de moderare.
3. Afișarea clară a erorii în interfață dacă salvarea eșuează, ca să nu mai pară „nu se întâmplă nimic".

## Detalii tehnice

- `src/features/products/productsApi.ts` → `updateProduct` setează `approval_status = 'pending'` la editarea unui anunț `approved` sau `rejected`.
- Trigger-ul `public.enforce_products_owner_update()` (migrația `20260708130850_...`) ridică `Not allowed to modify admin-controlled product fields` la orice `approval_status IS DISTINCT FROM OLD.approval_status` pentru non-admini.
- Fix: variabilă `is_owner_resubmit := OLD.owner_id = auth.uid() AND NEW.approval_status = 'pending' AND OLD.approval_status IN ('approved','rejected')`, folosită pentru a exclude `approval_status` și resetarea `flag_reason` la NULL din lista câmpurilor interzise.
- Nicio modificare de schemă; doar `CREATE OR REPLACE FUNCTION`.