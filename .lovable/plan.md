# Limită de tichete și un singur email de răspuns per tichet

## Ce se schimbă
1. **Maxim 5 tichete pe zi** — un utilizator poate deschide cel mult 5 tichete în 24 de ore. Acum limita este 1. La al 6-lea apare un mesaj clar: „Ai atins limita de 5 tichete pe zi. Încearcă din nou mâine sau răspunde într-un tichet existent.” Administratorii nu au limită. Rămân și celelalte protecții: maxim 10 tichete deschise și blocarea duplicatelor în 10 minute.
2. **Un singur email la răspuns** — acum fiecare răspuns al echipei trimite un email. De acum, doar primul răspuns trimite email; următoarele apar doar ca notificare în site. Emailurile de confirmare la creare și de rezolvare rămân.

## Detalii tehnice
- Migrație: în `enforce_ticket_antispam` se schimbă `v_daily_limit` din 1 în 5.
- `opsTicketsApi.ts` (`addOpsTicketMessage`): înainte de `ticket-replied` se verifică dacă există deja un mesaj public anterior de la ADMIN pe tichet (excluzând mesajul curent). Emailul se trimite doar dacă nu există, cu cheia de unicitate `ticket-replied-${ticketId}` (în loc de id-ul mesajului), ca dublura să fie blocată și la trimitere.
- Frontend-ul de creare tichet: se mapează eroarea `ANTISPAM_DAILY:5` la mesajul în română de mai sus. Se verifică unde e afișată acum.
- Test: typecheck; verificare SQL a funcției actualizate.
