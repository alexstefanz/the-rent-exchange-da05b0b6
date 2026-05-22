
## Obiectiv

Atunci când un utilizator încarcă documentul de identitate în fluxul KYC, extragem automat **CNP, seria și numărul cărții de identitate** (plus nume complet și adresă, pentru bonus), le stocăm criptat în profilul lui și le folosim în Procesele Verbale în locul datelor false generate de `fakeIdentity()` din `src/lib/pvContent.ts`.

## Răspuns scurt: Da, se poate

Avem deja:
- Documentele KYC (`ID_FRONT`, `ID_BACK`, `SELFIE`) stocate în bucketul privat `kyc-documents`
- Aprobare manuală de către admin în `AdminKYCDetail`
- Lovable AI Gateway cu modele multimodale (Gemini 2.5 Pro / Flash) care fac OCR pe CI românească fără cheie API

PV-ul actual (`buildPvContent` în `src/lib/pvContent.ts`) folosește `fakeIdentity()` cu CNP, serie și număr generate din hash — exact ce vrem să înlocuim.

## Cum va funcționa

```text
User uploads ID_FRONT  →  Edge function "extract-id-data"  →  Gemini 2.5 Flash (vision OCR)
                                                                       ↓
                                                          { cnp, serie, numar, full_name, address }
                                                                       ↓
                                              Salvat în public.kyc_extracted_data (criptat)
                                                                       ↓
                                  Admin verifică în AdminKYCDetail → aprobă/corectează → APPROVED
                                                                       ↓
                                          buildPvContent() citește datele reale în loc de fakeIdentity()
```

## Pași de implementare

### 1. Tabel nou `kyc_extracted_data`
Un rând per utilizator, populat la upload-ul ID-ului, validat la aprobarea KYC.

Câmpuri specifice:
- `user_id`, `kyc_case_id`
- `cnp` (text, validat 13 cifre, validare cifră de control)
- `id_series` (2 litere) și `id_number` (6 cifre)
- `full_name`, `address`, `birth_date`, `issued_by`, `valid_until`
- `extraction_confidence` (0-1), `extracted_at`, `verified_by_admin` (bool), `verified_at`

**RLS strictă:** doar admins pot citi rândul integral; user-ul vede doar al lui; tabelul **nu este expus public** — accesul din PV se face printr-un RPC `get_pv_identity_data(rental_id)` care returnează datele doar pentru părțile rezervării active (după modelul `get_rental_renter_info` din memorie).

### 2. Edge function `extract-id-data`
- Trigger: invocată după ce user-ul încarcă `ID_FRONT` (și opțional `ID_BACK`) în KYC
- Generează URL semnat pentru imagine, trimite la Lovable AI cu un prompt de OCR structurat (JSON schema) folosind `google/gemini-2.5-flash`
- Validează CNP-ul (algoritm cifră de control românesc)
- Salvează rezultatul în `kyc_extracted_data` cu `verified_by_admin = false`
- Non-blocking: dacă extracția eșuează, KYC continuă normal — admin completează manual

### 3. UI admin în `AdminKYCDetail.tsx`
Card nou „Date extrase din CI" care arată: CNP, serie, număr, nume, adresă, scorul de încredere, cu butoane:
- **Confirmă** (setează `verified_by_admin = true`, ar trebui apăsat la aprobarea KYC)
- **Editează** (corectează manual valorile dacă OCR-ul a greșit)

Aprobarea KYC poate cere obligatoriu confirmarea datelor extrase.

### 4. Actualizare `buildPvContent` în `src/lib/pvContent.ts`
- `RentalFullDetail` extins cu `owner_identity` și `renter_identity` (CNP/serie/număr/adresă reale)
- `rentalDetailPageApi` apelează `get_pv_identity_data` și hidratează aceste câmpuri
- `fakeIdentity()` rămâne ca fallback DOAR dacă datele nu sunt verificate, cu un avertisment vizual în PV („date neverificate")

### 5. Backfill pentru utilizatorii deja aprobați
Buton în admin pentru a rula extracția pe KYC-uri deja `APPROVED` care nu au date extrase.

## Considerații importante

- **GDPR / date sensibile:** CNP-ul este o categorie specială de date personale. Recomand:
  - Acces strict prin RPC (nu SELECT direct), niciodată expus în view-uri publice
  - Logging în `kyc_audit_log` la fiecare citire pentru PV
  - Politică de retenție: șterse când contul este dezactivat
- **Acuratețe OCR:** Gemini 2.5 Flash pe CI românească standard are tipic >95% acuratețe pe câmpuri tipărite. Câmpul `extraction_confidence` + verificarea manuală la aprobare elimină riscul de date greșite.
- **Costuri:** o extracție = ~1 apel Gemini Flash (foarte ieftin, fracțiuni de cent per KYC). Doar la upload, nu la fiecare PV.
- **Documente existente:** putem rula backfill pe cei deja aprobați, dar e opțional — putem aplica doar pentru KYC-uri noi.

## Întrebări pentru tine înainte să implementez

1. **Confirmare admin obligatorie?** Vrei ca admin să confirme manual datele extrase la aprobarea KYC, sau lăsăm OCR-ul să umple automat fără verificare?
2. **Câmpuri minime?** Doar **CNP + serie + număr**, sau extragem și **adresa + data nașterii** (utile în PV pentru identificare completă)?
3. **Fallback `fakeIdentity`?** Dacă un utilizator nu are date extrase (cont vechi, KYC nefăcut), PV-ul: (a) folosește în continuare date fake cu disclaimer, sau (b) blochează generarea PV-ului până la KYC?
4. **Backfill?** Rulăm extracția acum pe toți utilizatorii cu KYC `APPROVED` existenți?
