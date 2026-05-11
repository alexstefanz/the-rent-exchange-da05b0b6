## Probleme identificate

### 1. Notificările de tip „ticket” deschid doar `/suport` (nu ticketul concret)
Trigger-ele DB `notify_user_ticket_created`, `notify_user_ticket_message` și `notify_user_ticket_resolved` salvează `link = '/suport'`, fără id-ul ticketului. Pagina `/suport` deschide ticketul doar dacă URL-ul are `?open=<ticket_id>`.

### 2. Tab-ul „Mesaje” din `/notificari` este gol
Funcția edge `send-message-notification` trimite **doar email**, nu inserează nimic în tabela `notifications`. Așadar nu există notificări cu tip `*message*` în DB → filtrul „Mesaje” afișează empty state.

---

## Soluție

### A. Migrare DB — link-uri ticket cu context
Migrare nouă care recreează cele 3 funcții trigger, păstrând semantica, dar setând:
- `link = '/suport?open=' || NEW.id` (ticket creat / rezolvat)
- `link = '/suport?open=' || v_ticket_id` (răspuns admin)

Astfel notificările existente rămân pe `/suport`, iar cele noi vor sări direct la ticket (pagina `/suport` deja știe să consume `?open=<id>`).

### B. Funcția edge `send-message-notification` — inserare în `notifications`
Înainte de a trimite emailul, se va executa un `INSERT` în `notifications`:
- `type: 'new_message'`
- `title_ro: 'Mesaj nou de la {sender}'`, `title_en: 'New message from {sender}'`
- `description_ro/en`: preview (max 140 caractere)
- `link: '/mesaje?conv=<conversation_id>'`

Categorizatorul existent (`src/lib/notificationCategory.ts`) deja mapează `new_message` → categoria „message”, deci tab-ul „Mesaje” se va popula automat.

### C. Frontend — `mapLink` în `NotificationCenter.tsx`
Mică ajustare să nu rescrie link-uri de tip suport/mesaje (deja corecte). Garantăm că:
- `/suport?open=...` rămâne intact
- `/mesaje?conv=...` rămâne intact

(Logica existentă deja face fall-through pe `return link`, deci nu sunt necesare schimbări dacă păstrăm query string-urile.)

---

## Fișiere modificate

| Fișier | Acțiune |
|---|---|
| `supabase/migrations/<timestamp>_ticket_notification_links.sql` | Recreează cele 3 funcții trigger cu link contextual |
| `supabase/functions/send-message-notification/index.ts` | Adaugă INSERT în `notifications` înainte de email |

## Notă
Notificările vechi rămân cu link-ul generic `/suport` — comportament neschimbat retroactiv. Doar evenimentele noi vor avea link-ul direct la ticket. (Putem rula opțional un UPDATE one-shot pentru ele dacă dorești.)
