## Goal

În widget-ul de suport (`SupportChatWidget.tsx`), când userul are un ticket deschis (status ≠ RESOLVED/CLOSED), conversația cu suportul trebuie să rămână activă. Apăsarea pe back sau închiderea/redeschiderea widget-ului nu trebuie să arunce userul înapoi pe ecranul de "mesaj inițial". Un ticket nou se creează doar la cererea explicită a userului.

## Schimbări

1. **Auto-resume ticket deschis la deschiderea widget-ului**
   - În efectul care rulează când `isOpen` devine true (pentru useri non-admin), dacă `userTickets` conține un ticket cu status ∈ {NEW, IN_PROGRESS, WAITING_CUSTOMER, WAITING_OWNER, WAITING_INTERNAL}, se selectează cel mai recent (`updated_at` desc) și se setează `ticketId` + `ticketPublicId` automat.
   - Welcome screen-ul ("Echipa Rentli – Bună! Suntem aici să te ajutăm…") se afișează doar dacă userul **nu** are niciun ticket deschis.

2. **Schimbarea comportamentului butonului back din header-ul ticketului activ**
   - Pentru tickete cu status deschis: ascundem butonul back (săgeata din imaginea 1). Headerul rămâne doar cu avatar + "Suport Rentli / TCK-xxxxx" + X (închide widget). Astfel userul nu mai poate "părăsi" un ticket activ accidental.
   - Pentru tickete arhivate (RESOLVED/CLOSED) deschise din "Vezi tickete anterioare", butonul back rămâne și revine la lista de arhivă.

3. **Crearea unui ticket nou doar explicit**
   - Eliminăm flow-ul în care, după back, primul mesaj scris generează automat alt ticket.
   - Adăugăm un buton explicit "Ticket nou" / "New ticket" în două locuri:
     - În welcome screen (cum este deja, prin scrierea primului mesaj — rămâne valabil pentru userii fără tickete deschise).
     - În ecranul "Vezi tickete anterioare" (lista de arhivă), ca acțiune secundară "+ Deschide ticket nou" care duce userul în welcome screen (curăță `ticketId`, ignoră auto-resume printr-un flag `userRequestedNewTicket`).
   - `userLeftTicket` și `handleBackFromTicket` se refactorizează: back nu mai e disponibil pe ticket activ; pe ticket arhivat back duce la lista de arhivă.

4. **Reset la închidere**
   - La închiderea widget-ului (`isOpen` false) păstrăm comportamentul de reset al state-ului local, dar la următoarea deschidere auto-resume preia ticketul activ din DB, deci UX-ul rămâne continuu.
   - Flagul `userRequestedNewTicket` se resetează la închidere.

## Fișiere atinse

- `src/components/support/SupportChatWidget.tsx` — auto-resume effect, header conditional back button, buton "Ticket nou" în arhivă, flag pentru a sări peste auto-resume.

## Out of scope

- Logica admin (inbox-ul de tickete pentru admini) rămâne neschimbată.
- Nicio modificare de schemă DB sau RPC.
