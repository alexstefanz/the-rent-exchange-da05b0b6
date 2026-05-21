## Card informativ "Întrebare despre produs" în chat

### Obiectiv
Când un utilizator inițiază o conversație organică despre un produs (înainte de rezervare), proprietarul vede un card system în chat care specifică despre ce produs e vorba. Conversațiile per rezervare rămân separate (deja funcționează prin `rentals_id UNIQUE`).

### Modificări

**1. `src/features/messaging/messagingApi.ts`**
- În `getOrCreateConversation`, după `insert` reușit al unei conversații organice noi:
  - Fetch `products.title` pentru `product_id`
  - Insert mesaj system: `conversation_id = newConv.id`, `sender_id = NULL`, `message_type = 'system'`, `content = "product_inquiry|" + title`
- Failure-ul inserării mesajului system nu blochează crearea conversației (best-effort).

**2. `src/components/messaging/SystemMessageBubble.tsx`**
- Adaugă variantă nouă `product_inquiry`:
  - Icon `MessageCircleQuestion` (lucide)
  - Titlu: "Întrebare despre produs"
  - Subtitlu: numele produsului (parsat din `content.split("|")[1]`)
  - Notă: "Răspunsul proprietarului apare aici"
  - Stil similar cu cardul de booking_confirmed (border subtil, fundal accent).

**3. Backfill retroactiv (migrare SQL)**
- Pentru toate conversațiile organice (`rentals_id IS NULL`, `product_id IS NOT NULL`) care **nu au niciun mesaj system de tip `product_inquiry`**, inserează un mesaj system la `created_at = conversations.created_at` (apare primul în fir).

### Detalii tehnice

Format content: `product_inquiry|<product_title>` — simplu, fără JSON pentru consistență cu pattern-ul existent.

Conversațiile per rezervare (`rentals_id NOT NULL`) sunt deja separate și au cardul `booking_confirmed` — nu necesită schimbări.

Migrarea de backfill:
```sql
INSERT INTO public.messages (conversation_id, sender_id, message_type, content, created_at)
SELECT c.id, NULL, 'system', 'product_inquiry|' || COALESCE(p.title, 'Produs'), c.created_at
FROM public.conversations c
LEFT JOIN public.products p ON p.id = c.product_id
WHERE c.rentals_id IS NULL
  AND c.product_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.conversation_id = c.id
      AND m.message_type = 'system'
      AND m.content LIKE 'product_inquiry|%'
  );
```
