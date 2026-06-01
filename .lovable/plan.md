# SMS rules — simplified

SMS-urile vor fi trimise doar pentru evenimentele esențiale: prima cerere/acceptare și momentele de predare-înapoi a produsului, plus câteva evenimente critice de siguranță (anulări, expirare, dispute). În rest doar in-app + email.

## Evenimente care PĂSTREAZĂ SMS

### Inițiere
| Eveniment | SMS către |
|---|---|
| `request_created` | Doar **owner** (renter primește doar in-app + email) |
| `request_accepted` | Doar **renter** (owner primește doar in-app + email) |

### Predarea înapoi (final închiriere)
| Eveniment | SMS către |
|---|---|
| `return_reminder_2h` (critic) | Ambii |
| `return_in_progress` (critic) | Ambii |
| `pv_return_pending` (critic) | Ambii |
| `pv_return_completed_by_party` (critic) | Ambii |

### Critice de siguranță (păstrate)
| Eveniment | SMS către |
|---|---|
| `request_reminder_2h` | Ambii |
| `request_expired` | Ambii |
| `request_cancelled_by_renter` | Doar owner |
| `request_cancelled_by_owner` | Doar renter |
| `dispute_opened` | Ambii |

## Evenimente care PIERD SMS (rămân in-app + email)

- `request_rejected` — non-critic
- `pickup_scheduled` — predarea inițială, scoasă conform cerinței (doar return mai are SMS)
- `pv_pickup_pending` — la fel
- `pv_pickup_completed_by_party` — la fel
- `return_reminder_24h` — non-critic (rămâne `return_reminder_2h`)
- `rental_completed` — non-critic
- `payment_succeeded` — deja fără SMS
- restul (cancel_request_submitted/withdrawn/approved/rejected, review_reminder etc.) — deja fără SMS

## Detalii tehnice

1. **`supabase/functions/notify-rental-event/index.ts`** — singura sursă de adevăr pentru SMS-uri:
   - Scot `"sms"` din `channels` la evenimentele listate mai sus (pickup_scheduled, pv_pickup_*, request_rejected, return_reminder_24h, rental_completed).
   - Introduc un filtru "doar către destinatarul acțiunii" pentru `request_created` (skip dacă `recipientRole === "renter"`) și `request_accepted` (skip dacă `recipientRole === "owner"`). Implementare: în bucla per-recipient, înainte de a trimite SMS, verific un mic switch pe `event_key` + `recipientRole` și sar peste canalul `sms` (in-app + email rămân neatinse).
   - Eventual mai curat: extind `smsTemplate` să fie deja doar pe rolul țintă (e deja așa pentru aceste două), dar logica iterează pe ambii destinatari → confirm că lipsa template-ului pentru celălalt rol blochează deja trimiterea; dacă nu, adaug guard explicit.

2. **Niciun alt cod nu mai trimite SMS direct** — toate apelurile trec prin `notify-rental-event` (verificat în `rentalsApi.ts`). Funcția `send-sms-notification` rămâne neschimbată (e doar transportul) și `notify-return-day` continuă să trimită `return_reminder_2h` (păstrat).

3. **Fără migrări DB**. Fără modificări UI. Fără modificări la șabloanele de email.

## Verificare după deploy

- Trigger manual `request_created` și confirm că primește SMS doar owner-ul.
- Trigger `request_accepted` și confirm că primește SMS doar renter-ul.
- Trigger `pickup_scheduled` → fără SMS în `sms_logs`, dar in-app + email prezente.
- Trigger `return_reminder_2h` → SMS la ambii.
