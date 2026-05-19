# Pop-up notificări rezervări

Două pop-up-uri reactive, în stilul imaginii atașate (card alb cu badge portocaliu, avatar, produs, perioadă, sumă, mesaj opțional, butoane mari).

## 1. Pop-up "Cerere nouă" — pentru proprietar

**Când apare:**
- La login: pentru fiecare rezervare cu `status = pending` adresată userului (ca owner) și nemarcată drept "văzută cu acțiune".
- Realtime: când se creează un `rentals` nou cu `owner_id = user.id` și `status = pending` (canal Supabase Realtime).

**Conținut:**
- Badge "CERERE NOUĂ"
- Avatar + nume chiriaș, rating, oraș, "acum X min"
- Card cu imaginea + titlul produsului, perioada (`start_date` – `end_date`, nr zile), suma totală în RON
- Mesajul opțional al chiriașului (dacă există în `rentals.renter_message`)
- Butoane: **Refuză** (secundar gri) / **Acceptă** (primar portocaliu)

**Acțiuni:**
- "Acceptă" → confirmă rezervarea (status `confirmed`) prin API-ul existent `updateRentalStatus`, închide pop-up.
- "Refuză" → anulează rezervarea (status `cancelled`), închide pop-up.
- "X" → închide fără acțiune; va reapărea la următorul login până când proprietarul decide.

## 2. Pop-up "Cerere aprobată" — pentru chiriaș

**Când apare:**
- La login: pentru rezervări proprii (`renter_id = user.id`) cu `status = confirmed` și flag `renter_seen_confirmation = false`.
- Realtime: când propria rezervare trece de la `pending` la `confirmed`.

**Conținut:** Identic vizual cu cel pentru proprietar, dar:
- Badge "CERERE APROBATĂ" (verde sau portocaliu)
- Datele proprietarului în loc de chiriaș
- Mesajul rămâne opțional (din chat / nota proprietarului dacă există)
- Butoane: **Mai târziu** (secundar) / **Discută cu proprietarul** (primar)

**Acțiuni:**
- "Discută cu proprietarul" → marchează ca văzută, navighează la `/messages?with=<owner_id>&product=<product_id>` care deschide/creează conversația folosind sistemul de messaging existent.
- "Mai târziu" → marchează ca văzută, închide. Nu mai reapare.

## Persistență

Adăugăm două coloane în `rentals`:
- `owner_decision_at TIMESTAMPTZ` (deja implicit prin statusul ≠ pending, dar adăugăm `owner_popup_dismissed_at` doar dacă vrem reapariție selectivă — **nu e necesar**: re-afișăm cât timp `status = pending`).
- `renter_seen_confirmation BOOLEAN DEFAULT false` — setat `true` la click pe oricare buton.

Astfel:
- Proprietar: pop-up reapare la fiecare login câtă vreme rezervarea e `pending`.
- Chiriaș: pop-up apare o singură dată per rezervare confirmată.

## Detalii tehnice

**Fișiere noi:**
- `src/components/rentals/RentalRequestPopup.tsx` — componenta vizuală (un singur card, props pentru variantele owner/renter).
- `src/components/rentals/RentalPopupManager.tsx` — montat global în `App.tsx`; ascultă `useAuth`, face fetch inițial al cererilor pending (owner) și confirmărilor nevăzute (renter), se abonează la realtime pe tabela `rentals`, ține o coadă și afișează câte unul pe rând.
- `src/features/rentals/popupApi.ts` — funcții: `fetchPendingForOwner`, `fetchUnseenConfirmedForRenter`, `markRenterConfirmationSeen`.

**Migrare DB:**
- `ALTER TABLE rentals ADD COLUMN renter_seen_confirmation BOOLEAN NOT NULL DEFAULT false;`
- Index parțial: `CREATE INDEX idx_rentals_renter_unseen_confirmed ON rentals(renter_id) WHERE status='confirmed' AND renter_seen_confirmation = false;`
- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE rentals;` (dacă nu e deja).

**Integrare chat:**
- Folosim ruta existentă `/messages` (vezi `src/pages/Messages.tsx`) cu query params pentru a deschide/crea conversația cu proprietarul pe contextul produsului. Dacă ruta nu suportă deja parametrul, adăugăm logica de auto-open în Messages.

**Reuse:**
- `updateRentalStatus` din `src/features/admin/adminApi.ts` — sau folosim direct API-ul de owner existent în `ownerRentalsApi.ts` (de verificat la implementare).
- Stiluri: tokens semantice (`primary`, `card`, `muted`), `rounded-2xl`, shadow ca pe celelalte carduri.

**Bilingv:** Toate textele prin `useUxCopy` (RO/EN).

## Ce NU include planul

- Notificări push browser (separat).
- Sunet la apariție (poate fi adăugat ulterior).
- Pop-up pentru alte tranziții de status (handover, return) — doar `pending → confirmed` și apariția unei cereri noi.
