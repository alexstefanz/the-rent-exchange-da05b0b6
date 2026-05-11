## Problema

Când proprietarul apasă "Discută cu chiriașul" și ajunge pe `/mesaje?conv=...`, pagina ar trebui să selecteze automat tab-ul **De Închiriat**. Momentan rămâne pe **Rezervări** din cauza unui typo: pagina setează cheia `"de_inchiriat"` (underscore), dar componenta `ConversationList` folosește `"de-inchiriat"` (cratimă), deci `Tabs` nu recunoaște valoarea.

## Soluție

**`src/pages/Messages.tsx`** (linia 49): înlocuiește `"de_inchiriat"` cu `"de-inchiriat"` pentru a se potrivi cu `TabsTrigger` din `ConversationList`.

**`src/components/profile/MessagesTab.tsx`**: adaugă același efect de sincronizare a tab-ului pe baza `searchParams.get("conv")` (sau a conversației selectate) — în prezent nu folosește URL-ul, dar pentru consistență când e folosit ca tab în profil, vom selecta tab-ul corect (`rezervari` dacă utilizatorul e `buyer`, `de-inchiriat` dacă e `owner`) automat la deschiderea unei conversații.

Nicio modificare de logică business sau de stil.
