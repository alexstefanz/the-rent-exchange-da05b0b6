

# Notificari email complete pentru proprietar si chirias

## Ce exista deja
- Email la cerere noua de inchiriere (ambele parti) - OK
- Email la acceptare/refuzare cerere (doar catre chirias) - partial

## Ce lipseste si trebuie adaugat

### 1. Email la mesaj nou pe platforma
Cand cineva trimite un mesaj, destinatarul primeste email.

**Fisier nou:** `supabase/functions/send-message-notification/index.ts`
- Primeste `conversation_id`, `sender_id`, `message_content`
- Determina destinatarul (celalalt participant din conversatie)
- Trimite email cu: numele expeditorului, produsul asociat conversatiei, un preview al mesajului
- CTA: "Citeste mesajul" -> `/profile?tab=messages`

**Modificare:** `src/features/messaging/messagingApi.ts`
- Dupa `sendMessage()`, apeleaza edge function-ul `send-message-notification`

**Modificare:** `supabase/config.toml`
- Adauga `[functions.send-message-notification]` cu `verify_jwt = false`

### 2. Email la anulare cerere de catre chirias
Cand chiriasul anuleaza o cerere pending, proprietarul primeste email.

**Fisier nou:** `supabase/functions/send-cancellation-notification/index.ts`
- Primeste `rental_id`
- Trimite email proprietarului: chiriasul X a anulat cererea pentru produsul Y
- Trimite email chiriasului: confirmare anulare
- CTA proprietar: "Vezi anunturile tale" -> `/profile?tab=lendings`
- CTA chirias: "Cauta alte produse" -> `/search`

**Modificare:** `src/components/dashboard/RequestsTab.tsx`
- Dupa mutatie de anulare reusita, apeleaza edge function-ul `send-cancellation-notification`

**Modificare:** `supabase/config.toml`
- Adauga `[functions.send-cancellation-notification]` cu `verify_jwt = false`

### 3. Email confirmare catre proprietar la acceptare/refuzare
Proprietarul primeste si el o confirmare email dupa ce accepta sau refuza.

**Modificare:** `supabase/functions/respond-rental-request/index.ts`
- Adauga trimiterea unui email si catre proprietar (nu doar catre chirias)
- Acceptare: "Ai acceptat cererea pentru [produs]. Contacteaza chiriasul pentru detalii."
- Refuzare: "Ai refuzat cererea pentru [produs]."

## Detalii tehnice

### Template email
Toate email-urile folosesc acelasi `buildEmailTemplate()` deja existent (branded cu verde #3DB86A, fundal #FAF9F7).

### Structura edge functions noi

Ambele functii noi (`send-message-notification`, `send-cancellation-notification`):
- Folosesc `SUPABASE_SERVICE_ROLE_KEY` pentru a accesa datele
- Folosesc `RESEND_API_KEY` (deja configurat) pentru trimitere
- Includ logica de fallback email din `auth.users` daca nu exista in `profiles`
- CORS headers standard
- Non-blocking: erorile la trimitere nu afecteaza flow-ul principal

### Rezumat fisiere

| Fisier | Actiune |
|--------|---------|
| `supabase/functions/send-message-notification/index.ts` | NOU - email la mesaj nou |
| `supabase/functions/send-cancellation-notification/index.ts` | NOU - email la anulare |
| `supabase/functions/respond-rental-request/index.ts` | MODIFICAT - adauga email si catre proprietar |
| `src/features/messaging/messagingApi.ts` | MODIFICAT - apeleaza send-message-notification |
| `src/components/dashboard/RequestsTab.tsx` | MODIFICAT - apeleaza send-cancellation-notification |
| `supabase/config.toml` | MODIFICAT - adauga cele 2 functii noi |

