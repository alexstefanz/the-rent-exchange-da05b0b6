## Schimbări la notificarea „Plată primită — începe chatul"

### 1. Scurtare text descriere (doar notificarea in-app)

În `supabase/functions/send-rental-notification/index.ts`, înlocuiesc descrierea lungă a notificării `rental_request` (proprietar) cu varianta cerută:

- RO: `{renterName} a efectuat plata pentru produsul „{productTitle}". Începeți discuția pe chat.`
- EN: `{renterName} paid for "{productTitle}". Start the chat.`

Emailul `rental-request-owner` rămâne neschimbat (păstrează mesajul lung despre PV și poze).

### 2. Link direct către conversația rentalului

În aceeași edge function, după inserarea rental-ului, apelez RPC-ul existent `get_or_create_rental_conversation` ca să obțin `conversation_id` și setez `link` pe notificarea proprietarului la `/mesaje?conv=<id>` (în loc de `/inchirieri?rental_id=...`). Astfel butonul deschide direct chatul cu chiriașul.

Dacă RPC-ul eșuează (defensiv), revin la linkul curent `/inchirieri?rental_id=...`.

### 3. Buton „Deschide chatul" pe card-ul de notificare

În `src/components/notifications/NotificationCard.tsx`, în `getQuickAction` schimb eticheta pentru `rental_request`:

- RO: `Deschide chatul`
- EN: `Open chat`

Click-ul folosește mecanismul existent (`onSelect` → navighează la `notification.link`), care acum va duce direct la `/mesaje?conv=<id>`.

### Ce NU se schimbă

- Conținutul emailului către proprietar.
- Notificarea/emailul către chiriaș.
- Logica PV / acceptarea cererii / Stripe.

### Detalii tehnice

- Redeploy: `send-rental-notification`.
- Notificările deja existente nu sunt re-scrise; doar cele noi vor avea textul scurt și linkul către chat.