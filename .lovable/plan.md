

## Plan: Vizualizare chat admin pentru dispute

### Ce se adaugă

Adminul va putea vizualiza conversațiile dintre chiriaș și proprietar direct din admin. Se adaugă:

1. **Pagină nouă: `src/pages/admin/AdminConversations.tsx`** — listează toate conversațiile de pe platformă cu search și filtrare. La click pe o conversație, se deschide chat-ul read-only.

2. **Pagină nouă: `src/pages/admin/AdminConversationDetail.tsx`** — afișează mesajele unei conversații în format read-only (adminul nu poate trimite mesaje, doar vizualiza). Include info despre produs, chiriaș și proprietar.

3. **Migrare DB — RLS policies** pentru a permite adminilor să citească `conversations` și `messages`:
   ```sql
   -- Admin can view all conversations
   CREATE POLICY "Admins can view all conversations"
     ON conversations FOR SELECT TO authenticated
     USING (has_role(auth.uid(), 'admin'));

   -- Admin can view all messages
   CREATE POLICY "Admins can view all messages"
     ON messages FOR SELECT TO authenticated
     USING (has_role(auth.uid(), 'admin'));
   ```

4. **Rută nouă în sidebar** — adăugăm „Conversații" în `AdminSidebar.tsx` cu iconul `MessageCircle`.

5. **Rute în `App.tsx`**:
   - `/admin/conversations` — lista conversațiilor
   - `/admin/conversations/:id` — detaliu conversație

6. **Link din context ticket** — pe `AdminTicketDetail`, dacă ticketul are `rental_user_id` și `owner_user_id`, adăugăm un link rapid „Vezi conversația" care caută conversația relevantă.

### Fișiere afectate
- **Migrare SQL**: RLS pe `conversations` și `messages`
- **Creat**: `AdminConversations.tsx`, `AdminConversationDetail.tsx`
- **Modificat**: `App.tsx`, `AdminSidebar.tsx`, `AdminTicketDetail.tsx`

