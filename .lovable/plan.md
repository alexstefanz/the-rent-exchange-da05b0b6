## Scop

În widget-ul de suport (`SupportChatWidget.tsx`), userul (non-admin) trebuie să poată ieși dintr-o conversație activă fără să o piardă și să vadă lista cu toate ticketele (active + arhivate). Conversațiile rămân salvate și pot fi reluate oricând, inclusiv după navigare pe alte pagini.

## Comportament dorit

- Buton "Back" vizibil mereu când userul este într-un ticket (activ sau închis), nu doar pentru admin / ticket închis.
- Apăsarea Back din ticket → afișează lista cu **toate** ticketele userului (active sus, închise mai jos), nu ecranul de welcome.
- Selectarea unui ticket din listă → reia conversația cu istoricul complet din DB (deja funcționează prin `fetchUserTicketMessages`).
- Navigarea pe alte pagini nu afectează widget-ul: el este montat global, deci starea (ticket deschis, listă) se păstrează. Auto-resume rămâne activ pentru reveniri ulterioare.
- Comportament admin neschimbat.

## Modificări

### `src/components/support/SupportChatWidget.tsx`

1. **`handleBackFromTicket`** — în loc să decidă pe baza statusului ticketului, setează mereu `showTicketArchive = true` pentru non-admin (admin păstrează comportamentul curent care îl întoarce la inbox).
2. **`showBack`** — include `!!ticketId` pentru non-admin (nu doar pentru ticket închis), astfel butonul Back e vizibil în conversație activă.
3. **Vizualizarea "tickete anterioare"** — extinde lista să afișeze **și** ticketele active (cu badge de status), nu doar arhivate. Folosește `userTickets` complet, sortat: active primele, apoi închise.
4. **Titlu header** când `showTicketArchive` e activ: `"Conversațiile mele" / "My conversations"` (în loc de "Tickete anterioare"), pentru a reflecta că include și conversații în curs.
5. **Auto-resume** — rămâne, dar respectă `showTicketArchive`: dacă userul tocmai a apăsat back și e în listă, nu îl arunca înapoi automat în ultimul ticket (deja gestionat prin guard-ul `showTicketArchive` în `useEffect`-ul de auto-resume).
6. Buton "Conversație nouă" / "New conversation" în listă pentru a porni un ticket nou (deja există `handleStartNewTicket`).

## Detalii tehnice

- Niciun schimb de schemă DB sau RLS — datele există deja în `ops_tickets` / `ops_ticket_messages`.
- Nicio modificare în alte componente; widget-ul este deja montat global în layout.
- Reset-on-close (`useEffect` pe `!isOpen`) rămâne — la închiderea widget-ului starea se resetează, dar auto-resume + lista vor reîncărca ticketul / conversațiile la reschimbarea.