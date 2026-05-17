## Fix: la inițierea returnării, nu deschide direct PV-ul

**Problemă:** După „Inițiază returnarea", `handleConfirmInitiate` apelează imediat `setPvOpen("return")`, ceea ce deschide dialogul PV înainte ca chiriașul să încarce pozele. Cardul `PvPhotoUploadCard` (cu „Adauga poza 1/2" + „Genereaza proces verbal") deja există pentru faza de return, dar e ocolit.

**Fișier:** `src/pages/RentalDetailPage.tsx`

**Schimbare unică:** elimin linia `setPvOpen("return")` din callback-ul butonului din `returnDialogOpen` (≈ linia 900). Restul rămâne: `initiateReturn` se execută, query-urile se reîncarcă, dialogul de confirmare se închide. `PvPhotoUploadCard` (phase="return") apare automat pentru chiriaș (uploader la return) și acolo încarcă pozele și apasă „Genereaza proces verbal" care la rândul lui apelează `setPvOpen("return")`.

**În afara scopului:** logica handover, RLS, conținutul PV, semnături.
