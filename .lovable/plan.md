## Ce schimb

Vrei ca numele produsului să apară în subiectul fiecărui email (acum subiectele sunt generice: „Cererea ta a fost acceptată", „Predarea a fost confirmată" etc.).

În iterația anterioară am adăugat deja un `threadSubject` cu formatul `RNT-XXXXXX · <produs>`, dar îl foloseam ca **prefix** lung al subiectului — arăta tehnic și ascundea titlul real al emailului. Îl restructurez ca să fie curat și util în inbox.

### Format nou de subiect

`<subiect template> · <Nume produs>`

Exemple:
- „Cererea ta a fost acceptată · Drone DJI Mini 3"
- „Predarea a fost confirmată · Drone DJI Mini 3"
- „Acțiune necesară: completează partea ta din PV · Drone DJI Mini 3"

Codul `RNT-XXXXXX` rămâne **doar** în antetele tehnice (`Message-ID`/`In-Reply-To`/`References`) pentru grupare în Gmail, dar nu mai apare vizual în subiect.

### Modificări

1. **`supabase/functions/notify-rental-event/index.ts`**
   - În locul `threadSubject = "RNT-XXX · <produs>"`, trimit:
     - `threadKey = "rental:RNT-XXXXXX"` (pentru threading)
     - `subjectSuffix = product.title` (pentru afișare)

2. **`supabase/functions/send-transactional-email/index.ts`**
   - Înlocuiesc câmpul `threadSubject` cu `subjectSuffix` (opțional).
   - Subiect final: `${resolvedSubject} · ${subjectSuffix}` când e setat; altfel rămâne ca acum.
   - Threading headers se construiesc tot din `threadKey` (deja separat).

3. Niciun template nu se modifică (subiectul vine deja din `template.subject`).

Niciun migration. Doar 2 funcții edge re-deploiate.