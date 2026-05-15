## Problemă

În `SupportChatWidget.tsx`, butonul Back din ticketul de suport (user normal) execută corect `handleBackFromTicket()` și setează `ticketId = null`. Însă un `useEffect` (linia 404) auto-selectează imediat ultimul ticket deschis ori de câte ori `ticketId` este `null` pe tab-ul "Tickete":

```ts
useEffect(() => {
  if (isOpen && !isAdmin && activeTab === "tickets" && !ticketId && !showTicketArchive && openTickets.length > 0) {
    setTicketId(openTickets[0].id);
    ...
  }
}, [isOpen, isAdmin, activeTab, ticketId, showTicketArchive, openTickets]);
```

Rezultatul: utilizatorul apasă Back și este re-aruncat instant în aceeași conversație → pare că butonul nu face nimic.

## Soluție

Introduc un flag `userLeftTicket` (state local) care:

1. Devine `true` în `handleBackFromTicket()` (când user-ul iese explicit din ticket).
2. Blochează auto-resume-ul: adaug `&& !userLeftTicket` în condiția useEffect-ului.
3. Se resetează la `false` când:
   - widget-ul se închide complet (în efectul existent care face reset la close),
   - user-ul deschide manual un ticket arhivat sau trimite un mesaj nou (creează ticket).
4. După Back, user-ul vede ecranul welcome cu mesajul prescris + buton "Vezi tickete anterioare", de unde poate reintra explicit în orice ticket.

Comportamentul admin nu este afectat (condiția `!isAdmin` rămâne).

## Fișiere

- `src/components/support/SupportChatWidget.tsx` — adaug state-ul `userLeftTicket` și actualizez useEffect + `handleBackFromTicket` + resetul la close.

## În afara scope-ului

- Layout/header (deja arată corect conform screenshot-ului).
- Chat user↔user, fluxul admin, persistența.
