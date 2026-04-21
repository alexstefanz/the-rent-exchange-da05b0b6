

## Plan: Reparare upload KYC pentru utilizatori (eroare RLS)

### Diagnostic

Eroarea `new row violates row-level security policy` apare când utilizatorul încarcă documente KYC. Cauze, în ordinea probabilității:

#### Cauza 1 — **`uploaded_by_user_id` nu se setează în Postgres**

Politica RLS pe `kyc_documents` cere:
```sql
WITH CHECK (
  uploaded_by_user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM kyc_cases kc WHERE kc.id = kyc_case_id AND kc.user_id = auth.uid()
              AND kc.status IN ('NOT_STARTED', 'IN_PROGRESS'))
)
```

În `KycVerification.tsx` linia 183-191, codul trimite `uploaded_by_user_id: user.id` — corect. Dar dacă există vreun trigger / hook care alterează rândul, sau dacă vreo politică se evaluează strict înainte de set, INSERT-ul cade. **Probabil OK, deci trecem la cauza 2.**

#### Cauza 2 — **Cazurile `REJECTED` recreate au atempts_count greșit + status nu intră în condiția RLS** (cea mai probabilă)

La linia 143-158, când userul are KYC `REJECTED` și apasă "Refă KYC-ul", codul **creează un caz NOU** cu `status: 'IN_PROGRESS'`. **Asta funcționează.**

DAR: linia 161-164 (path-ul "else") face un `UPDATE` la `kyc_cases` setând `status = 'IN_PROGRESS'`. Politica de UPDATE pe `kyc_cases` permite update doar când statusul **vechi** e `'NOT_STARTED'` sau `'IN_PROGRESS'`:
```sql
USING (user_id = auth.uid() AND status IN ('NOT_STARTED', 'IN_PROGRESS'))
```

Dar coloana `kyc_status` din `profiles` e setată separat de status-ul din `kyc_cases`. Dacă kyc_case e în `SUBMITTED` (nu `REJECTED`) și userul reintră în pagina `/verificare` și încarcă din nou (fără caz nou), policy-ul UPDATE refuză → eroarea apare aici.

#### Cauza 3 — **Storage bucket — INSERT pe storage.objects când se face `upsert: true`**

`upload(filePath, doc.file, { upsert: true })` la fișiere existente face de fapt UPDATE pe `storage.objects`, nu INSERT. Dar **nu există policy UPDATE pentru users pe `storage.objects`** (doar INSERT și SELECT — vezi liniile 177-189 din migrație). Când userul reia upload-ul cu același path (REJECTED → reupload pe același caz), `upsert: true` triggerează UPDATE → RLS denied → **`new row violates row-level security policy`**.

**Aceasta e cauza principală cu cea mai mare probabilitate** dată fiind imaginea (eroarea apare la upload), și se potrivește scenariului recent: am implementat banner-ul "Refă KYC-ul" → userul revine să încarce documente noi peste cele vechi.

### Soluție

#### 1. Migrație DB — adaug policy UPDATE și DELETE pentru users pe `storage.objects` în bucket-ul `kyc-documents`

```sql
CREATE POLICY "Users can update own kyc documents storage"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own kyc documents storage"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
```

Asta permite `upsert` pe propriile fișiere KYC.

#### 2. Migrație DB — extind policy UPDATE pe `kyc_cases` pentru a include `REJECTED` și `SUBMITTED`

```sql
DROP POLICY "Users can update own kyc cases" ON public.kyc_cases;
CREATE POLICY "Users can update own kyc cases"
  ON public.kyc_cases FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status IN ('NOT_STARTED', 'IN_PROGRESS', 'REJECTED', 'SUBMITTED'))
  WITH CHECK (user_id = auth.uid());
```

Permite tranziții IN_PROGRESS → SUBMITTED și REJECTED → IN_PROGRESS la reupload.

#### 3. Migrație DB — relaxez policy INSERT pe `kyc_documents` pentru cazurile `SUBMITTED` și `REJECTED` (reupload pe caz existent)

```sql
DROP POLICY "Users can upload own kyc documents" ON public.kyc_documents;
CREATE POLICY "Users can upload own kyc documents"
  ON public.kyc_documents FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.kyc_cases kc
      WHERE kc.id = kyc_case_id 
        AND kc.user_id = auth.uid()
        AND kc.status IN ('NOT_STARTED', 'IN_PROGRESS', 'REJECTED', 'SUBMITTED')
    )
  );
```

#### 4. Cod — `KycVerification.tsx` 

În `handleSubmit`, asigur ca pentru cazuri `REJECTED` să se creeze ÎNTOTDEAUNA un caz nou (ce face deja). În plus, **înainte de upload**, dacă statusul curent e diferit de `IN_PROGRESS`, forțez UPDATE la `IN_PROGRESS` (acum permis). Apoi, după UPDATE, fac upload-urile.

De asemenea, șterg vechile rânduri din `kyc_documents` pentru cazul curent înainte de a insera noile (curățenie):
```ts
await supabase.from("kyc_documents").delete().eq("kyc_case_id", caseId);
```

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `supabase/migrations/<ts>.sql` | NOU — policies UPDATE/DELETE pe `storage.objects` pentru bucket `kyc-documents` + extindere policy UPDATE pe `kyc_cases` și INSERT pe `kyc_documents` |
| `src/pages/KycVerification.tsx` | Forțez `status='IN_PROGRESS'` înainte de upload + șterg documente vechi din tabel pentru cazul curent |

### Rezultat

- Userul `REJECTED` apasă "Refă KYC-ul" din banner → ajunge pe `/verificare` → încarcă noi documente → upload reușește (atât în storage, cât și în tabel).
- Userul în status `IN_PROGRESS` care vrea să schimbe un fișier deja încărcat → `upsert` pe storage funcționează (acum permis).
- Userul `SUBMITTED` care vrea să adauge documente extra (ex: după ce adminul cere reupload prin `requestReupload`) → INSERT funcționează.

### Limitări recunoscute

- Nu schimb logica de status în cazurile NEEDS_MANUAL_REVIEW (rămâne ca acum — admin trebuie să apese "Refă KYC" sau să respingă cazul).
- Policies de storage rămân scopate strict pe folder-ul `auth.uid()::text` — userul tot nu poate atinge fișierele altui user.
- Logica de "cleanup vechi documente" se rulează doar pentru cazul curent — nu afectează istoricul.

