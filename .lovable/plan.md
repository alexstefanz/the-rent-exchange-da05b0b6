

## Plan: Floating Support Chat Widget pentru Admin (notificări + chat în timp real)

### Ce se construiește

Un widget floating circular pentru admin, similar cu chatbot-ul utilizatorului, poziționat deasupra butonului de chatbot. Adminul vede în timp real ticketele noi și poate răspunde direct din widget fără a naviga la pagina de detalii ticket.

### Componente

**1. `src/components/admin/AdminSupportWidget.tsx` (NOU)**
- Buton circular floating: fundal alb, iconiță de suport (Headphones) culoare `#F98715`, badge cu număr de tickete noi/necitite
- Poziționat `bottom-24 lg:bottom-24 right-4` (deasupra chatbot-ului care e la `bottom-20 lg:bottom-6`)
- La click: deschide un popup 400x600px (stil identic cu SupportChatWidget)
- Conținut:
  - **Lista ticketelor active** (NEW, IN_PROGRESS, WAITING_CUSTOMER) cu ultimul mesaj și timestamp
  - **Click pe un ticket** → chat panel cu mesajele ticketului
  - Admin poate trimite mesaje (ca ADMIN) și note interne
  - Realtime: subscribe la `postgres_changes` pe `ops_tickets` și `ops_ticket_messages` pentru notificări live
- Badge pe buton: count de tickete cu status NEW sau cu mesaje necitite

**2. Migrare DB — Coloana `last_admin_read_at` pe `ops_tickets`**
```sql
ALTER TABLE ops_tickets ADD COLUMN last_admin_read_at timestamptz;
```
Permite calculul mesajelor necitite (mesaje CUSTOMER după `last_admin_read_at`).

**3. Realtime — Enable pe `ops_tickets` și `ops_ticket_messages`**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE ops_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE ops_ticket_messages;
```

**4. `src/App.tsx`**
- Import `AdminSupportWidget` și render-ul global (widget-ul se afișează doar pe rute `/admin`)

**5. `src/components/support/SupportChatWidget.tsx`**
- Ajustare poziție FAB: pe admin routes widget-ul deja returnează null, nu e nevoie de schimbare

### Fluxul
1. Utilizatorul vorbește cu AI → se creează ticket → apare în lista adminului în timp real
2. Adminul vede badge-ul actualizat, deschide widget-ul, selectează ticketul
3. Adminul răspunde din chat → mesajul apare instant la utilizator (deja funcționează cu polling la 10s, + realtime nou)

### Fișiere afectate
- **NOU**: `src/components/admin/AdminSupportWidget.tsx`
- **EDIT**: `src/App.tsx` (adăugare widget)
- **MIGRARE**: `last_admin_read_at` + realtime publication

