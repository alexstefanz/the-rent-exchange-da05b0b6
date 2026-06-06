# Emails la fiecare pas al închirierii + PV atașat

## Ce este azi

Pipeline-ul `notify-rental-event` mapează deja ~25 evenimente de închiriere către template-uri React Email (queue + Resend). PV-urile (predare/returnare) sunt generate doar **client-side** ca DOCX din `src/lib/pvDocx.ts`; nu există PDF persistent, iar emailurile nu conțin niciun link/atașament PV.

## Probleme identificate

1. **Emailuri lipsă deși templateul e setat** în `notify-rental-event/index.ts`:
   - `pv_pickup_completed_by_party` — `channels: ["in_app"]` (lipsește `"email"`), deci `pv-other-done` nu pleacă la predare.
   - `pv_return_completed_by_party` — `channels: ["in_app","sms"]` (lipsește `"email"`), deci `pv-other-done` nu pleacă la returnare.
2. **Niciun PV nu e atașat sau link-uit** în:
   - `handover-confirmed` (PV predare semnat de ambele părți)
   - `rental-completed-owner` / `rental-completed-renter` (PV returnare semnat)
   - `pv-other-done` (când o parte a semnat — celălalt vede ce a fost completat)
3. Nu există proces verbal generat server-side, deci nu poate fi atașat la email în mod fiabil.

## Plan

### 1. Generator PV PDF server-side
Edge function nouă `generate-pv-pdf` (`verify_jwt = true`, doar owner/renter sau service-role):
- Input: `{ rental_id, phase: "handover" | "return" }`.
- Citește `rentals`, `products`, `profiles` owner/renter și `rental_pv_documents` (semnături + checklist + poze din storage).
- Generează PDF cu `pdf-lib` (npm via esm.sh — nu necesită fonturi binare extra; folosim Helvetica standard, fără diacritice prin `noDia` din `pvContent.ts` reused via copy).
- Conține: header Rentli, datele părților, produs, perioada, checklist, semnături (imagine PNG inline), poze de proces (max 10, downscale).
- Upload în bucket privat **`rental-pv-pdfs`** la `rentals/{rental_id}/{phase}.pdf` (overwrite).
- Returnează `{ path, signed_url }` (URL semnat 7 zile).

### 2. Hook în notify-rental-event
Înainte de a queue email, pentru aceste evenimente:
- `handover_confirmed`, `pv_pickup_completed_by_party` → cheamă `generate-pv-pdf(phase: "handover")`
- `rental_completed`, `pv_return_completed_by_party` → `generate-pv-pdf(phase: "return")`

Trece în `templateData`:
- `pvPdfUrl` (link semnat 7 zile — buton vizibil în email)
- `pvAttachment` (opțional, base64 — vezi pasul 4)

Dacă generarea PDF eșuează, emailul pleacă fără PV (graceful), eroarea e logată.

### 3. Update template-uri
Adaugă secțiune „Proces verbal" cu buton `Descarcă PV (PDF)` în:
- `handover-confirmed.tsx`
- `rental-completed-owner.tsx`, `rental-completed-renter.tsx`
- `pv-other-done.tsx` (text: „Vezi ce a completat partea celălaltă")

Prop nou pe fiecare: `pvPdfUrl?: string`. Buton afișat doar dacă există.

### 4. Atașament real (opțional — recomand DA pentru `rental-completed-*`)
`send-transactional-email` suportă deja payload-ul Resend; adăugăm pass-through pentru `attachments: [{ filename, content }]` când vine din `notify-rental-event`. Pentru `handover_confirmed` și `rental_completed` trimitem PDF-ul **și** ca atașament (filename `PV-{phase}-{rental_public_id}.pdf`), pentru ca utilizatorul să-l aibă offline. Pentru `pv-other-done` doar link (PV-ul nu e final încă).

### 5. Fix bug-uri channels
În `notify-rental-event/index.ts`:
- `pv_pickup_completed_by_party.channels` → `["in_app","email"]`
- `pv_return_completed_by_party.channels` → `["in_app","email","sms"]`

### 6. Bucket + RLS
Migrare:
- Creează bucket privat `rental-pv-pdfs` (via storage tool).
- Policy `storage.objects`: SELECT permis doar service_role + owner/renter al rezervării respective (citit din path-ul `rentals/{rental_id}/...`).

### 7. Audit complet pași inchiriere
Tabel de verificare (toate cu email after fix):

```text
Pas închiriere                         Email template               Trimite?
─────────────────────────────────────────────────────────────────────────────
Cerere trimisă                         rental-request-owner/renter   da
Reminder cerere 2h                     request-reminder-2h-*         da
Cerere expirată                        request-expired-*             da
Cerere acceptată                       rental-accepted               da
Plata reușită                          rental-accepted               da
Cerere refuzată                        rental-rejected               da (renter)
Predare programată                     pickup-scheduled              da
PV predare necesar                     pv-pending                    da
PV predare semnat de o parte           pv-other-done   + PV link     FIX
Predare confirmată                     handover-confirmed + PV PDF   FIX
Reminder returnare 24h / 2h            return-reminder / -2h         da
Returnare în curs                      return-in-progress            da
PV returnare necesar                   pv-pending                    da
PV returnare semnat de o parte         pv-other-done   + PV link     FIX
Închiriere finalizată                  rental-completed-*  + PV PDF  FIX
Reminder review                        review-reminder               da
Anulări / mutual cancel                cancellation-*                da
```

## Detalii tehnice

- `pdf-lib` rulează în Deno via `https://esm.sh/pdf-lib@1.17`. Nu necesită binare. Embed poze JPEG/PNG cu `embedJpg`/`embedPng`; pentru WEBP convertim sau scoatem (rare în PV).
- `noDia()` din `src/lib/pvContent.ts` se copiază în `supabase/functions/_shared/pvContent.ts` (păstrăm sursă unică prin shared helper).
- Atașamentele Resend: `attachments: [{ filename, content: <base64> }]` — payload sub 10 MB; downscale poze înainte de embed (max 1280px, JPEG q=70).
- Signed URL 7 zile pentru link (acoperă durata utilă post-închiriere); dacă userul deschide după expirare, butonul îl duce către `/rezervari/{public_id}` unde poate regenera.
- Nu se modifică `pvDocx.ts` client-side (păstrăm DOCX-ul descărcabil din UI).

## Verificare post-implementare

1. Deploy `generate-pv-pdf`, `notify-rental-event`, `send-transactional-email` + toate templateurile modificate.
2. Test E2E pe o rezervare de test:
   - completează PV predare de o parte → verifică `pv-other-done` cu link PV.
   - confirmă predarea → verifică `handover-confirmed` cu PDF atașat + buton.
   - completează PV returnare → verifică `pv-other-done`.
   - finalizare → verifică `rental-completed-*` cu PDF atașat.
3. Query `email_send_log` dedupe pe `message_id` pentru a confirma status `sent` pe fiecare pas.
