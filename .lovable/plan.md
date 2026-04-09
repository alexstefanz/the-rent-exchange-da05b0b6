

## Plan: Afișare utilizator care a creat ticketul

### Ce se schimbă

**1. `src/features/admin/opsTicketsApi.ts`**
- Adaug `requester_name` și `requester_email` în interfața `OpsTicket`
- Modific `fetchOpsTicket` să facă un join cu `profiles` pe `requester_user_id` pentru a prelua numele și email-ul utilizatorului

**2. `src/pages/admin/AdminTicketDetail.tsx`**
- Afișez numele utilizatorului (cu link la profilul lui) lângă titlul ticketului sau în secțiunea Context din sidebar
- Format: iconiță User + „Creat de: [Nume Utilizator]" cu link la `/admin/users` sau `/utilizator/{id}`

### Rezultat
Adminul vede clar cine a trimis ticketul, cu nume clickabil care duce la profilul utilizatorului.

