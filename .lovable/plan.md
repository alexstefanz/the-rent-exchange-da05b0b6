## Obiectiv

Rafinez fluxul de Proces-Verbal in 2 etape vizuale clare:
1. **Etapa foto** — incarcata inline in pagina rezervarii (in afara dialogului), exact ca in imaginea 1.
2. **Etapa document** — dialog care randeaza PV-ul ca un document real (imagini 3 & 4) cu butoane DOCX / PDF / semnatura.

Logica back-end ramane neschimbata: foto + semnaturi traiesc deja in `rental_pv_documents` (`photos`, `photos_meta`, `*_signature_data`, `*_signed_at`). Nu sunt necesare migratii.

## 1. Card "Fotografii" inline (imaginile 1 & 2)

Fisier nou: `src/components/rentals/PvPhotoUploadCard.tsx`

Folosit in `src/pages/RentalDetailPage.tsx` in locul actualului panou "Procese verbale" cat timp **uploader-ul** (proprietar la predare / chirias la returnare) **nu** a urcat inca cele 2 poze.

Structura cardului (uploader):
- Header: icon camera + "Fotografii la predare" (sau "la returnare").
- Subtitlu: "Adauga 2 fotografii ale produsului inainte de predare. Vor fi atasate procesului verbal."
- Grid 2 coloane cu 2 sloturi dashed primary/40:
  - gol → icon camera + "Adauga poza 1" / "Adauga poza 2" (click = file input).
  - completat → thumbnail + label "Poza 1" / "Poza 2" (click = sterge).
- Buton secundar full-width: "Incarca poze (0/2)" → upload bulk.
- Sub card: panou de status "Plata efectuata — pregateste predarea":
  - sub 2 poze: buton disabled "Adauga pozele (0/2)".
  - >= 2 poze: buton activ "Genereaza proces verbal" → `setPvOpen(phase)`.

Pentru aprobator (cealalta parte): card cu badge "Asteptam {proprietar|chirias} sa adauge fotografiile" + buton chat. Apare doar `Vezi PV` (deschide dialogul read-only) cand uploader-ul deja a generat PV-ul.

Upload-ul foloseste `uploadPvPhoto` + `addPvPhoto` deja existente (din `rentalDetailPageApi.ts`). Sterge folosind `removePvPhoto`.

## 2. Dialog PV ca document real (imaginile 3 & 4)

Refactor `src/components/rentals/PvSignatureDialog.tsx`.

Dialog mai lat (`max-w-3xl`) cu scroll. Continut redenumit "Proces-verbal de predare-primire" / "...de returnare" + subtitlu "Citeste documentul, apoi semneaza cu mouse-ul in spatiul de jos."

Body (randat ca document, fundal alb, font serif pentru text legal, padding generos):

1. **Antet companie** centrat (Rentli Platform SRL, adresa, CUI, contact) — texte hardcodate identice cu PDF-ul actual.
2. Titlu centrat bold "PROCES-VERBAL DE PREDARE-PRIMIRE" / "PROCES-VERBAL DE RETURNARE".
3. **Paragraf intro** cu nume, CNP, CI, adresa, telefon, email pentru ambele parti (folosind `fakeIdentity` existent + datele reale din `rental`).
4. **Paragraf obiect**: produs, categorie, perioada, pret total, garantie.
5. **Paragraf accesorii** (daca exista).
6. **Paragraf perioada** + ora (folosim `pickup_time` daca exista).
7. **Paragraf responsabilitate** (diferit handover vs return).
8. **Paragraf clauza finala**.
9. Sectiune **FOTOGRAFII LA PREDARE / RETURNARE** — grid 2 coloane cu pozele incarcate (din `pv.photos_meta`).
10. Sectiune semnaturi — 2 coloane:
    - "Predator (proprietar)" + nume + linie + "— nesemnat —" sau imaginea semnaturii cand semnata.
    - "Primitor (chirias)" + nume + linie + "— nesemnat —" sau imaginea semnaturii.

Sub document (in afara cardului alb):

- **Pad semnatura** `SignatureCanvas` cu label "Semnatura {rolul tau} — semneaza aici" + buton "Sterge". Vizibil doar daca `isMyTurn && !mySigned`.
- **Footer butoane** (DialogFooter, drepta):
  - `Button variant="outline"` "DOCX" — descarca .docx generat din aceleasi date.
  - `Button variant="outline"` "PDF" — descarca PDF-ul (refoloseste `generatePdf` existent).
  - `Button` "Semneaza si trimite clientului" (uploader) / "Semneaza acordul" (aprobator) — apeleaza `handleSign` existent.

Cand ambele parti au semnat, footer-ul ramane cu DOCX/PDF + buton portocaliu "Vezi PV semnat (PDF)" (deja exista) si pad-ul dispare.

DOCX se genereaza client-side cu pachetul `docx` (`bun add docx`) intr-un helper nou `src/lib/pvDocx.ts` care primeste acelasi `RentalFullDetail` + `PvDocument` si returneaza `Blob`. Foloseste `Packer.toBlob` apoi `saveAs` (sau `URL.createObjectURL` + ancora). Antet, paragrafe, fotografii (`ImageRun` din path-urile semnate) si tabel pt semnaturi.

## 3. Integrare in `RentalDetailPage`

In blocul `{(showHandoverPv || showReturnPv) && ...}` (linii ~417-453):

- Pentru `handoverIsCurrent` (in curs):
  - daca uploader-ul (proprietar) nu a urcat 2 poze → afiseaza `PvPhotoUploadCard phase="handover"` in loc de `PvPanel`.
  - altfel afiseaza `PvPanel` existent (cu deschidere dialog).
- Analog pentru `returnIsCurrent`: uploader = chirias.

PV-uri deja finalizate raman cu `PvPanel` curent (read-only + "Vezi PV").

## 4. Curatenie

- In dialogul refactorizat scot sectiunea actuala "Add photos CTA" si galeria — toate raman in cardul inline din pagina.
- `MIN_PHOTOS = 2` ramane definit central (mut in `src/lib/pvConstants.ts` ca sa fie partajat intre card si dialog).
- Pastrez `generatePdf`, `handleSign`, notificarile, salvarea semnaturii, generarea automata a PDF-ului final la dubla semnatura.

## Out of scope

- Schema DB, RLS, edge functions.
- Flow-ul de "Initiaza returnarea" (deja implementat).
- Flow-ul de review post-finalizare (deja implementat).
- Generarea PDF/DOCX server-side (raman client-side).
- Modificari la KYC / date reale CI (continuam cu `fakeIdentity`).
