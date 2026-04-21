

## Plan: Tickete necitite — bold în listă + badge corect în sidebar

### Diagnostic

1. **Coloana `last_admin_read_at`** există deja în `ops_tickets`, dar **nu e folosită nicăieri** — niciun cod nu o setează la deschiderea ticketului și niciun query nu o citește.
2. RPC-ul `get_admin_notification_summary` returnează `open_tickets` numărând **toate** ticketele cu status ≠ CLOSED/RESOLVED → badge-ul `9+` din sidebar nu scade niciodată după ce adminul citește un ticket.
3. În `AdminTickets.tsx` titlul ticketului e afișat cu `font-medium` constant — nu există distincție vizuală între citit/necitit.

### Definiție "necitit de admin"

Un ticket este **necitit** dacă:
- `last_admin_read_at IS NULL`, **SAU**
- `last_admin_read_at < updated_at` (a apărut mesaj nou / schimbare de status după ultima vizualizare)

Și e **deschis** (status NU în `CLOSED`, `RESOLVED`).

### Modificări

#### 1. Migrație DB

**Funcție nouă `mark_ops_ticket_read(p_ticket_id uuid)`** — `SECURITY DEFINER`, doar pentru admini, setează `last_admin_read_at = now()`.

**Update RPC `get_admin_notification_summary`**:
```sql
-- Înainte:
(SELECT COUNT(*) FROM ops_tickets WHERE status NOT IN ('CLOSED','RESOLVED'))
-- După:
(SELECT COUNT(*) FROM ops_tickets 
 WHERE status NOT IN ('CLOSED','RESOLVED')
   AND (last_admin_read_at IS NULL OR last_admin_read_at < updated_at))
```

**Trigger pe `ops_ticket_messages` INSERT** (când vine mesaj nou public, fie de la user, fie de la admin altul) → forțează `ops_tickets.updated_at = now()` astfel încât badge-ul revine la "necitit" pentru noi evenimente. (Verific dacă există deja un trigger similar; dacă da, sar peste.)

#### 2. API TypeScript (`opsTicketsApi.ts`)

Adaug:
```ts
export const markTicketRead = async (ticketId: string): Promise<void> => {
  await supabase.rpc('mark_ops_ticket_read', { p_ticket_id: ticketId });
};
```

#### 3. UI — `AdminTickets.tsx` (listă)

- Adaug `last_admin_read_at` în interfața `OpsTicket` (deja există coloana).
- Helper `isUnread(ticket)` → `!ticket.last_admin_read_at || ticket.last_admin_read_at < ticket.updated_at`.
- În rândul tabelului desktop:
  - `<p className={`line-clamp-1 ${isUnread(t) ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>{t.title}</p>`
  - Opțional: punct portocaliu (#F98715) lângă `public_id` pentru ticketele necitite.
- Identic pe mobile cards.

#### 4. UI — `AdminTicketDetail.tsx` (deschidere ticket)

La mount-ul paginii, după ce ticketul e încărcat cu succes:
```ts
useEffect(() => {
  if (ticket?.id) {
    markTicketRead(ticket.id).then(() => {
      qc.invalidateQueries({ queryKey: ['ops-tickets'] });
      qc.invalidateQueries({ queryKey: ['admin-notification-summary'] });
    });
  }
}, [ticket?.id]);
```

#### 5. Cache invalidare

În `useOpsTickets` păstrez setup-ul actual; după `markTicketRead` invalidăm cele două chei React Query → sidebar și listă se refac.

### Rezultat

- **Lista de tickete**: titlurile necitite apar **bold + culoare normală**, cele citite apar **medium + muted** → admin distinge instant ce trebuie tratat.
- **Sidebar "Tickete"**: badge-ul roșu numără doar ticketele necitite/cu update nou. Click pe ticket → `last_admin_read_at` actualizat → la următorul refresh (real-time + 60s polling) numărul scade.
- Dacă userul răspunde ulterior la un ticket deja citit, `updated_at` > `last_admin_read_at` → ticketul redevine necitit și apare iar bold + badge++.

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `supabase/migrations/<ts>.sql` | NOU — `mark_ops_ticket_read()` + update `get_admin_notification_summary` (filtrare unread) |
| `src/features/admin/opsTicketsApi.ts` | Adaug `markTicketRead()` + câmp `last_admin_read_at` în interfața `OpsTicket` |
| `src/pages/admin/AdminTickets.tsx` | Bold pe titluri necitite + helper `isUnread()` (desktop + mobile) |
| `src/pages/admin/AdminTicketDetail.tsx` | Apelez `markTicketRead()` la deschidere + invalidare cache |

### Limitări recunoscute

- Marcarea "citit" e per-status global (oricare admin marchează → dispare pentru toți) — consistent cu shared inbox-ul existent pentru `admin_notifications`.
- Badge-ul se actualizează imediat doar la utilizatorul curent (prin `invalidateQueries`); ceilalți admini văd update prin polling 60s sau realtime push când următorul mesaj/update se întâmplă.
- Ticketele `RESOLVED`/`CLOSED` nu intră în badge nici dacă au mesaj nou (comportament dorit — sunt închise).

