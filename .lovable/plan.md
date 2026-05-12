## Obiectiv

Reproiectarea fluxului de închiriere ca un proces unitar pe 7 pași, cu pagină dedicată pentru fiecare închiriere (istoric persistent), procese verbale generate ca PDF cu semnătură digitală, și notificări complete (in-app + email pentru toate stările, SMS doar pentru evenimente cheie).

## 1. Noul timeline (7 pași)

Înlocuim timeline-ul actual de 6 pași cu:

```text
1. Cerere trimisă     → rental creat, plată încă neautorizată
2. Confirmat          → proprietarul a acceptat (sau refuzat → branch terminal)
3. Plată efectuată    → chiriașul a plătit (Stripe hold)
4. Semnături PV       → ambele părți au semnat PV-ul de predare
5. Produs predat      → chiriașul a confirmat primirea
6. Returnare          → s-a inițiat returul + PV retur semnat
7. Finalizat          → owner_payout în wallet, review disponibil
```

Branch-uri terminale: `Refuzat` (la pas 2), `Anulat`, `În dispută`.

Modificări fișiere:
- `src/components/dashboard/RentalTimeline.tsx` — 7 pași, iconițe: Send, ThumbsUp, CreditCard, FileSignature, Truck, RotateCcw, CheckCircle2. Funcția `getTimelineStep` rescrisă pentru noul mapping.
- `src/components/dashboard/MainActionCard.tsx` și `NextActionCard.tsx` — variante per rol pentru fiecare nou step.

## 2. Pagină dedicată pentru fiecare închiriere

Rută nouă: `/inchirieri/:publicId` (folosește `RNT-XXXXXX` deja existent + RPC `get_rental_by_public_id`).

Fișiere noi:
- `src/pages/RentalDetailPage.tsx` — layout din mockup: header cu salut + status badge, timeline mare orizontal, două carduri cu datele părților (TU + cealaltă parte), card produs cu detalii, și card contextual "Pasul X" cu CTA-ul activ.
- `src/components/rentals/RentalPartyCard.tsx` — card cu nume, telefon, email, adresă (datele CI ascunse pentru moment, conform cerinței).
- `src/components/rentals/RentalProductCard.tsx` — produs + perioadă + accesorii + locație + preț.
- `src/components/rentals/RentalStepCard.tsx` — render condițional al CTA-ului per step (refactor din `MainActionCard`).

Modificare: în `RentalsPage.tsx` și `RentalsOutPage.tsx`, fiecare card din listă devine link către `/inchirieri/{public_id}`. Lista rămâne ca istoric (toate închirierile, inclusiv finalizate/refuzate).

Toggle "Vezi pagina Proprietar / Vezi pagina Client" (din mockup) — disponibil doar pe contul de admin pentru QA, ascuns pentru utilizatori normali.

## 3. Refuz cerere cu motiv

Pas 2, varianta owner: lângă "Confirm disponibilitatea" și "Refuz cererea". Click pe "Refuz" deschide dialog cu textarea (motiv obligatoriu, min 20 caractere) + presetări rapide (indisponibil, perioada nu funcționează, etc.).

Edge function `respond-rental-request` deja acceptă `reason` — wire-up complet în UI.

Notificare către chiriaș: in-app + email cu motivul refuzului (template nou `rental-rejected.tsx`).

## 4. Procese verbale PDF cu semnătură

Două PV-uri per închiriere: predare (la step 4) și retur (la step 6).

Fișiere noi:
- `src/components/rentals/PvDocumentDialog.tsx` — dialog full-screen cu:
  - render PDF document (template din imaginile 5-6) folosind `@react-pdf/renderer` (instalare nouă).
  - secțiune fotografii (2 obligatorii, max 10) — cu component existent `InspectionDialog` ca bază.
  - canvas semnătură (`react-signature-canvas`) per parte.
  - buton "Generează PDF & semnează" — generează PDF, îl urcă în storage bucket nou `rental-pvs`, salvează URL în DB.
- `src/lib/pvPdfTemplate.tsx` — template `@react-pdf/renderer` cu: header "Rentli Platform SRL", titlu "PROCES-VERBAL DE PREDARE-PRIMIRE" / "DE RETURNARE", date complete ambele părți (nume, CNP, CI, adresă, telefon, email), detalii produs, perioadă, accesorii, fotografii embedded, două semnături.

Backend:
- Migrație: tabel nou `rental_pv_documents` (rental_id, phase: 'handover'|'return', pdf_url, owner_signature_data text, renter_signature_data text, owner_signed_at, renter_signed_at, photos text[], generated_at).
- Bucket storage `rental-pvs` (privat, signed URLs prin RPC).
- RPC `generate_rental_pv` care validează: 2+ poze, ambele semnături, status corect.

Important: PDF-ul se poate genera doar **după** ce s-au urcat fotografiile (cerința A) — buton "Generează PDF" inițial dezactivat cu mesaj clar.

Notă: datele CI (serie/număr) sunt ascunse momentan din PV (cerința utilizatorului) — câmpurile rămân în DB pentru viitor.

## 5. Wallet la finalizare

Deja există `owner_payouts` + `EarningsPage` + `WithdrawDrawer`. Verificăm că la `step 7` se creează automat înregistrarea `owner_payout` (există deja prin `capture-rental-payment`). Adăugăm CTA explicit pe pagina de detalii: "Vezi în wallet" (link spre `/castiguri`).

## 6. Notificări

Map evenimente → canale:

| Event | In-app | Email | SMS |
|---|---|---|---|
| Cerere primită (owner) | ✓ | ✓ | ✓ |
| Cerere acceptată/refuzată (renter) | ✓ | ✓ | – |
| Plată efectuată (owner) | ✓ | ✓ | ✓ |
| Semnătură PV necesară (ambii) | ✓ | ✓ | ✓ |
| Produs predat | ✓ | ✓ | – |
| Returnare inițiată | ✓ | ✓ | ✓ |
| Finalizat (banii în wallet) | ✓ | ✓ | – |
| Review disponibil | ✓ | ✓ | – |

Implementare: extindem `notify-rental-event` edge function — există deja keys pentru majoritatea evenimentelor, adăugăm `request_rejected`, `payment_completed`, `pv_signed`, `rental_finalized`. Mapping SMS în baza de date (tabel existent `notification_preferences` / hardcoded în function).

Template-uri React Email noi în `supabase/functions/_shared/email-templates/`: `rental-rejected.tsx`, `rental-payment-completed.tsx`, `rental-pv-sign-required.tsx`, `rental-finalized.tsx`.

## 7. Review

La step 7, ambele părți primesc CTA "Lasă un review". Component existent `LeaveReviewDialog` se refolosește. Buton vizibil pe pagina de detalii sub cardul "Închiriere finalizată".

## Ordine implementare

1. Migrație DB: `rental_pv_documents`, bucket storage, RPC-uri.
2. Refactor timeline (7 pași) + getTimelineStep + UI components.
3. Pagină nouă `/inchirieri/:publicId` cu route + layout + carduri.
4. Refacere refuz cu motiv (dialog + edge fn + email).
5. Generator PDF (template + dialog + upload).
6. Notificări noi (extindere edge fn + 4 template-uri email).
7. Wire-up linkuri din liste către pagina de detalii.
8. QA end-to-end pe ambele roluri.

## Detalii tehnice

- Dependențe noi: `@react-pdf/renderer`, `react-signature-canvas`.
- Storage bucket nou: `rental-pvs` (privat, max 10 MB/file, signed URLs 1h).
- Public ID `RNT-XXXXXX` deja generat — se folosește pentru rute SEO-friendly.
- Componentele vechi `InspectionDialog`, `MainActionCard`, `NextActionCard` rămân pentru compatibilitate cu lista, dar logica primară migrează în pagina dedicată.
- Pe pagina de detalii: re-fetch real-time prin `useRentalRealtime` (deja există).