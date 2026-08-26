# Ticket nou: pagină dedicată în loc de pop-up

## Ce se schimbă
- Butonul „Ticket nou” din pagina Suport & Tichete nu mai deschide un dialog modal, ci navighează către o pagină nouă: `/suport/ticket-nou`.
- Pagina nouă are Navbar, buton „Înapoi la tichete”, titlu „Creează un ticket” și textul cu termenul de răspuns de 48 de ore.
- Formularul este același (categorie, tip problemă, titlu, descriere), dar afișat pe lățime confortabilă, cu mai mult spațiu pentru descriere.
- După trimitere, utilizatorul e redirecționat automat la `/suport?open=<id>`, direct în firul tichetului creat.
- Dacă utilizatorul nu e autentificat, este trimis la autentificare cu redirect înapoi la pagina de creare.

## Detalii tehnice
- Se extrage `CreateTicketForm` din `src/pages/UserTickets.tsx` într-un component reutilizabil, `src/components/support/CreateTicketForm.tsx` (aceleași validări din `src/features/tickets/ticketValidation.ts`).
- Pagină nouă `src/pages/NewTicket.tsx`, rută lazy `/suport/ticket-nou` în `src/App.tsx`.
- În `UserTickets.tsx` se elimină `Dialog`/`DialogTrigger` pentru creare și starea `createOpen`; butonul devine `navigate("/suport/ticket-nou")`.
- Widgetul de suport (`SupportChatWidget`) rămâne neschimbat funcțional; doar dacă preferi, butonul lui de creare poate trimite tot la pagina nouă.
- Texte bilingve RO/EN, fără modificări de backend.

## Verificare
- Click pe „Ticket nou” duce la pagina nouă, nu la modal.
- Creare tichet valid → redirect în firul tichetului.
- Validările pentru titlu scurt/descriere scurtă/vulgarități rămân active.
- Verificare vizuală desktop și mobil.
