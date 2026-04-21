

## Plan: Detectare automată conturi duplicate (același nume) în KYC

### Scop
Descurajarea conturilor multiple ale aceleiași persoane fizice. Când un caz KYC este trimis spre verificare, sistemul detectează automat dacă există alți utilizatori cu **același nume complet** (cu KYC verificat sau în curs) și marchează cazul cu un avertisment vizibil pentru admin.

### Cum funcționează

1. **Detectare automată la submit KYC**
   - La momentul în care un caz KYC trece în status `SUBMITTED` sau `NEEDS_MANUAL_REVIEW`, un trigger DB verifică câți alți utilizatori au exact același `full_name` (normalizat: lowercase, fără diacritice, fără spații duble)
   - Dacă găsește ≥1 potriviri (excluzând utilizatorul curent), creează automat o notificare admin

2. **Notificare admin**
   - Toți adminii primesc o notificare în clopotul de notificări (`notifications` table) cu titlu: "⚠️ Posibil cont duplicat KYC"
   - Descriere: "Utilizatorul [Nume] are același nume cu alte X conturi. Verifică KYC-ul KYC-XXXXXX."
   - Link direct către pagina de detalii KYC (`/admin/kyc/[id]`)

3. **Badge vizual pe lista KYC și detalii**
   - În tabelul `/admin/kyc`: un badge portocaliu "⚠️ Duplicat posibil (X)" lângă numele utilizatorului
   - În pagina de detalii `/admin/kyc/[id]`: o secțiune nouă "Conturi cu același nume" care listează toți utilizatorii suspecți cu link către profilul lor admin (`/admin/users/[id]`), data înregistrării, status KYC și număr de produse/închirieri

4. **Audit log**
   - Detectarea se înregistrează în `kyc_audit_log` cu acțiune `DUPLICATE_NAME_DETECTED` și `new_value` = lista ID-urilor suspecte

### Modificări tehnice

**1. Migrație DB — funcție și trigger**

Funcția SQL `detect_kyc_duplicate_names(case_id)`:
- Normalizează numele utilizatorului din cazul KYC (lower + unaccent + regex spații)
- Caută în `profiles` toți utilizatorii cu nume normalizat identic, EXCLUZÂND `user_id` curent
- Dacă găsește ≥1: creează notificări pentru toți adminii (din `user_roles` cu rol `admin`) și inserează entry în `kyc_audit_log`

Trigger `on_kyc_case_submitted` (AFTER UPDATE pe `kyc_cases`):
- Se declanșează când `status` trece la `SUBMITTED` sau `NEEDS_MANUAL_REVIEW`
- Apelează funcția de detectare

Funcție RPC nouă `get_kyc_duplicate_users(case_id)`:
- Returnează lista utilizatorilor cu același nume normalizat (id, full_name, email, created_at, kyc_status, products_count, rentals_count)
- Disponibilă doar adminilor (verificare `has_role`)

Modificare la `notifications` table — politică RLS nouă pentru insert din `SECURITY DEFINER` functions (sau folosim service role în trigger).

**2. Frontend — `src/features/admin/kycApi.ts`**
- Adaug funcția `fetchKycDuplicates(caseId)` care apelează RPC-ul `get_kyc_duplicate_users`
- Tipul `KycDuplicateUser` cu câmpurile relevante

**3. Frontend — `src/hooks/queries/useKyc.ts`**
- Hook nou `useKycDuplicates(caseId)`

**4. Frontend — `src/pages/admin/AdminKYCDetail.tsx`**
- Card nou "Posibile conturi duplicate" (vizibil doar dacă există potriviri)
- Listă cu avatar, nume, email, data înregistrării, status KYC, număr produse/închirieri
- Buton "Vezi profil" → `/admin/users/[id]`
- Stil portocaliu (warning) pentru a atrage atenția

**5. Frontend — `src/pages/admin/AdminKYC.tsx`**
- Coloană sau badge nou "Avertismente" — afișează "⚠️ Duplicat" dacă există potriviri pentru acel caz
- Pentru performanță, includ count-ul de duplicate direct în RPC-ul `get_admin_kyc_cases` (modificare ușoară)

**6. Notificări admin existente**
- Folosesc `NotificationBell` și pagina `/notifications` deja existente — notificările apar automat acolo
- Tip nou de notificare: `kyc_duplicate_warning` cu link către `/admin/kyc/[id]`

### Logica de normalizare nume

Pentru a evita fals-negative din diferențe de capitalizare/diacritice/spații:
```
NORMALIZED = regexp_replace(unaccent(lower(trim(full_name))), '\s+', ' ', 'g')
```
Exemple care vor fi detectate ca identice:
- `Ion Popescu` ≡ `ION POPESCU` ≡ `Ion  Popescu` ≡ `Ion Popéscu`

Nu detectează variații (Ion vs. Ioan vs. I. Popescu) — pentru astea e nevoie de fuzzy matching, care poate fi adăugat ulterior dacă vrei.

### Considerații

- **Fals pozitive**: nume comune (ex. "Ion Popescu") vor genera multe avertismente. De asta e doar un **avertisment**, nu blocaj automat — adminul decide.
- **Performanță**: query-ul de detectare e rapid (index pe `full_name` normalizat — pot adăuga un index funcțional)
- **Privacy**: doar adminii văd lista de utilizatori suspecți, prin RLS pe RPC

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| Migrație DB nouă | Funcție `detect_kyc_duplicate_names`, trigger `on_kyc_case_submitted`, RPC `get_kyc_duplicate_users`, update RPC `get_admin_kyc_cases` cu `duplicate_count` |
| `src/features/admin/kycApi.ts` | Funcție `fetchKycDuplicates`, tip `KycDuplicateUser`, update tip `KycCaseWithUser` cu `duplicate_count` |
| `src/hooks/queries/useKyc.ts` | Hook `useKycDuplicates` |
| `src/pages/admin/AdminKYCDetail.tsx` | Card "Posibile conturi duplicate" |
| `src/pages/admin/AdminKYC.tsx` | Badge ⚠️ în coloana de nume |

### Întrebări (opțional, pentru rafinare)

Vrei să răspund automat și cu **fuzzy matching** (ex. detectează "Ion Popescu" ≈ "Ioan Popescu" sau diferențe de o literă)? Sau strict identic (după normalizare)?

