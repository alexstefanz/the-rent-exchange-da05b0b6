## Probleme

1. Când user-ul deschide widget-ul și apasă prima oară pe tab-ul "Tickete", e aruncat direct în ultimul ticket activ (imaginea 1) în loc să vadă ecranul welcome cu mesajul prescris + linkul "Vezi tickete anterioare" (imaginea 2). Cauza: `useEffect`-ul din `SupportChatWidget.tsx` care auto-selectează `openTickets[0]` când `ticketId === null` rulează la fiecare intrare pe tab, nu doar după Back.
2. Eticheta tab-ului "Tickete" trebuie să devină "Suport" / "Support" pentru utilizatorii normali, dar să rămână "Tickete" pentru admini.

## Soluție

### 1. Welcome by default pe tabul Suport

În `src/components/support/SupportChatWidget.tsx`:
- Elimin auto-resume-ul în ticket pentru user-ii normali. Concret: șterg blocul din `useEffect` care setează `ticketId = openTickets[0].id` când suntem pe tab-ul tickets fără ticket selectat. Welcome screen-ul (cu mesaj prescris + buton "Vezi tickete anterioare") rămâne starea implicită ori de câte ori `ticketId === null`.
- Astfel, flag-ul `userLeftTicket` adăugat anterior devine redundant pentru user-i; îl pot lăsa pe loc fără efecte negative sau îl curăț odată cu efectul.
- Comportamentul admin nu e afectat (oricum era gardat cu `!isAdmin`).

### 2. Rename tab pentru user-i

În același fișier, butonul de tab "Tickete" (linia ~919-920):
- Eticheta devine `isAdmin ? t("Tickete", "Tickets") : t("Suport", "Support")`.
- Iconul rămâne `Ticket` (e ok semantic pentru ambele).
- FAB-ul și restul textelor rămân.

## Fișiere

- `src/components/support/SupportChatWidget.tsx` — elimin auto-resume pentru tab-ul Suport și redenumesc eticheta tab-ului în funcție de rol.

## În afara scope-ului

- Layout welcome screen, lista de tickete arhivate, fluxul admin inbox — rămân neschimbate.
