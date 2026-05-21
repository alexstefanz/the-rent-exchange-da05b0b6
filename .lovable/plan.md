## Problem
Pe pagina `/inchirieri/:id` butonul „Discută cu proprietarul / chiriașul” apare doar după ce plata este autorizată (`isPaidEarly`). Înainte de plată secțiunea de chat dispare complet, deși utilizatorii au nevoie să comunice și înainte (ex: clarificări înainte de a plăti).

Datele de contact în chat sunt deja restricționate la nivel de RPC (`get_contact_info_if_in_conversation` — doar după `payment_status` authorized/paid sau `status` confirmed/active/completed), iar placeholder-ul din `InfoPanel` afișează „Datele de contact vor fi vizibile după plată.” Nu e nevoie de modificări suplimentare aici.

## Plan

### `src/pages/RentalDetailPage.tsx`
Elimin gating-ul `isPaidEarly` de pe secțiunea de chat CTA (linia 475), astfel încât butonul să fie vizibil în orice stare a închirierii, mai puțin după finalizare (unde e înlocuit de Review CTA) și după anulare/respingere.

Condiție nouă:
```ts
{rental.status !== "completed" 
  && rental.status !== "cancelled" 
  && rental.status !== "rejected" 
  && (
    <section ...> ... </section>
)}
```

Pentru stările pre-plată adaug un subtext contextual:
- Dacă `!isPaidEarly`: „Poți discuta cu proprietarul și înainte de plată. Datele de contact devin vizibile după ce plata este efectuată.”
- Dacă `isPaidEarly`: textul actual „Coordonati predarea, locatia si detaliile direct in chat.”

Restul logicii (`handleChat`, `getOrCreateRentalConversation`, navigare către `/mesaje?conv=...`) rămâne neschimbat.

### Verificare contact info în chat
Deja implementat anterior:
- RPC `get_contact_info_if_in_conversation` returnează contact doar pentru rentale plătite/active.
- `InfoPanel.tsx` tab „Contact” arată placeholder-ul „Datele de contact vor fi vizibile după plată.” când RPC nu returnează nimic.

Nu sunt necesare modificări suplimentare în chat.

## Files
- `src/pages/RentalDetailPage.tsx` — relaxat condiția de afișare a secțiunii Chat CTA + subtext condiționat de starea plății.