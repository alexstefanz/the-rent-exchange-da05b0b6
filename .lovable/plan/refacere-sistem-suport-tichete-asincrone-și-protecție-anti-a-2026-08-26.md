# Refacere sistem suport: tichete asincrone și protecție anti-abuz

## Obiectiv
Înlocuim complet experiența de chat rapid cu un sistem de tichete structurate. Utilizatorul trimite inițial un subiect și o descriere detaliată, apoi poate continua într-un fir asincron de corespondență. Echipa păstrează termenul de răspuns de maximum 48 de ore.

## Interfața utilizatorului
- Formularul de tichet nou va cere obligatoriu:
  - categorie;
  - subiect de minimum 8 și maximum 120 de caractere;
  - descriere de minimum 30 de caractere, cu limita existentă de lungime.
- Eliminăm orice cale care poate crea automat un tichet dintr-un singur mesaj scurt.
- După trimitere, afișăm tichetul ca fir de corespondență asincron, nu ca chat live:
  - mesaje prezentate ca răspunsuri datate;
  - zonă mai amplă pentru completări;
  - buton explicit „Trimite răspunsul”, fără trimitere rapidă cu Enter;
  - mesaj vizibil că răspunsul echipei poate dura până la 48 de ore.
- Păstrăm posibilitatea de a atașa imagini și istoricul tichetelor.
- Actualizăm textele din widget și pagina „Tichetele mele” pentru terminologie consecventă: tichet, descriere, răspuns, corespondență.

## Validare și anti-spam
- Validăm în interfață subiectul, descrierea și răspunsurile înainte de trimitere.
- Blocăm limbajul vulgar în subiect, descriere și răspunsuri, folosind filtrul RO/EN existent.
- Afișăm mesaje clare și localizate când textul este prea scurt, vulgar, repetitiv sau trimis prea rapid.
- Aplicăm aceleași reguli și în backend, astfel încât validarea să nu poată fi ocolită prin apeluri directe:
  - limite de lungime pentru subiect și descriere;
  - filtru de vulgarități pentru `ops_tickets` și `ops_ticket_messages`;
  - pauză între răspunsurile succesive ale aceluiași utilizator;
  - blocarea răspunsurilor duplicate/repetitive într-un interval scurt;
  - păstrarea limitelor existente pentru numărul de tichete noi.
- Mesajele sistemului, răspunsurile administratorilor și referințele interne pentru atașamente nu vor fi blocate accidental de regulile destinate utilizatorilor.

## Detalii tehnice
- Refactorizăm widgetul global și componenta firului de tichet pentru a elimina comportamentul și aspectul de chat.
- Centralizăm validarea tichetelor în API-ul frontend, inclusiv maparea erorilor backend în mesaje prietenoase RO/EN.
- Adăugăm o migrare cu funcții și triggere dedicate pentru validarea `ops_tickets` și `ops_ticket_messages`; funcțiile interne nu vor fi executabile direct de utilizatori.
- Menținem politicile de acces existente și separarea dintre răspunsurile publice și notele interne ale administratorilor.

## Verificare
- Testăm crearea unui tichet valid și afișarea termenului de 48h.
- Testăm blocarea exemplului vulgar din captură în subiect, descriere și răspuns.
- Testăm mesajele foarte scurte, duplicate și trimiterile succesive rapide.
- Testăm că un răspuns legitim și o imagine atașată pot fi trimise.
- Verificăm vizual fluxul pe desktop și mobil și rulăm verificările relevante ale proiectului.
