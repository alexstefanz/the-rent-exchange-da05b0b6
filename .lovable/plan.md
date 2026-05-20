
## Problema

În `notify-rental-event`, majoritatea evenimentelor au `recipients: "both"` și un singur `smsTemplate`, deci AMBII (chiriaș + proprietar) primesc același SMS. Conținutul SMS-urilor este însă scris pentru un singur rol, de unde confuzia din capturile tale:

- `rental_accepted` → "cererea TA a fost ACCEPTATĂ" — text de chiriaș, dar îl primește și proprietarul.
- `rental_request_owner` → "cerere nouă de la {renter}" — text de proprietar, dar îl primește și chiriașul.
- `return_reminder` → "returneaza azi, contactează {owner}" — text de chiriaș, dar îl primește și proprietarul.
- `pv_other_done` → "{cealaltă parte} a completat PV" — corect doar pentru cel care NU a completat, dar tu îl primești și ca actor în anumite scenarii.

## Soluție

Schimb `smsTemplate` din string în obiect `{ owner?, renter?, both? }`, exact ca `emailTemplate`. Adaug template-uri noi unde mesajul trebuie să difere pe rol. Logica de trimitere alege automat varianta pentru rolul destinatarului și sare dacă nu există variantă pentru acel rol.

### Mapare nouă SMS per eveniment

| Eveniment | Owner SMS | Renter SMS |
|---|---|---|
| request_created | `rental_request_owner` ("cerere nouă de la X") | `rental_request_renter` (nou: "cererea ta a fost trimisă, aștepți răspuns") |
| request_accepted | `rental_accepted_owner` (nou: "ai acceptat cererea lui X, urmează plata") | `rental_accepted` ("cererea ta a fost ACCEPTATĂ") |
| request_rejected | — (deja gated) | `rental_rejected` |
| request_cancelled_by_renter | `rental_cancelled_owner` (nou: "X a anulat cererea pt Y") | — |
| pickup_scheduled | `pickup_scheduled` (același — mesaj neutru) | `pickup_scheduled` |
| pv_pickup_pending | `pv_pending` (neutru) | `pv_pending` |
| pv_pickup_completed_by_party | doar non-actor primește (deja filtrat prin `actor_id`) — `pv_other_done` | idem |
| return_reminder_24h | `return_reminder_owner` (nou: "X trebuie să returneze azi Y") | `return_reminder` ("returnează azi Y") |
| return_reminder_2h | `return_deadline_2h_owner` (nou: "2h până X returnează Y") | `return_deadline_2h` |
| return_in_progress | `return_in_progress` (neutru pt amândoi) | `return_in_progress` |
| pv_return_pending | `pv_pending` | `pv_pending` |
| pv_return_completed_by_party | `pv_other_done` (doar non-actor) | idem |
| rental_completed | `rental_completed` (neutru) | `rental_completed` |
| dispute_opened | `dispute_opened` (neutru) | `dispute_opened` |
| review_reminder | (nu trimite SMS azi — rămâne) | idem |

Câmpul `smsRoles` devine redundant (rolul deja decide via cheia obiectului) — îl șterg.

### Modificări tehnice

1. **`supabase/functions/send-sms-notification/index.ts`** — adaug noi `TemplateKey`:
   - `rental_request_renter`: `Rentli: cererea ta pt "{title}" a fost trimisa. Astepti raspuns de la {owner}. {link}`
   - `rental_accepted_owner`: `Rentli: ai acceptat cererea lui {renter} pt "{title}". Urmeaza plata. {link}`
   - `rental_cancelled_owner`: `Rentli: {renter} a anulat cererea pt "{title}" inainte de plata.`
   - `return_reminder_owner`: `Rentli: {renter} trebuie sa returneze azi "{title}".`
   - `return_deadline_2h_owner`: `Rentli: 2h pana {renter} returneaza "{title}". {link}`
   - Le adaug și în `allowedTemplates` și în `renderTemplate` switch.

2. **`supabase/functions/notify-rental-event/index.ts`**:
   - `EventConfig.smsTemplate` devine `{ owner?: string; renter?: string; both?: string }`.
   - Elimin `smsRoles`.
   - În blocul `// 3) SMS`, aleg `tplKey = cfg.smsTemplate[role] || cfg.smsTemplate.both`; dacă lipsește, sar peste (fără insert în audit log).
   - Actualizez fiecare `EVENTS[...]` conform tabelului de mai sus.

3. **Deploy** ambele funcții.

## Ce NU schimb

- Notificările in-app și email (deja au texte diferențiate pe rol via `inAppTitle`/`inAppDesc` funcții și `emailTemplate.{owner,renter,both}`).
- Logica `actor_id` skip pentru `pv_*_completed_by_party` rămâne — previne ca actorul să-și primească propriul SMS "X a completat PV".
- Preferințele de opt-out SMS (`prefs.sms_transactional`).

## Risc / compatibilitate

- Schimbarea formei `smsTemplate` e doar internă în edge function — nu afectează clienții.
- Idempotency key rămâne pe `event_key + rental_id + user_id`, deci nu se trimit duplicate.
