# Reparare SMS-uri care nu mai pleacă

## Ce am confirmat până acum

- SMS-urile legate de închirieri (cerere nouă, returnare în curs, semnare proces-verbal) **eșuează constant din 7 septembrie**; ultima reușită pe acest traseu a fost pe 2 septembrie.
- Toate cele 50 de eșecuri au același mesaj: serviciul de SMS răspunde cu eroare înainte să apuce să scrie ceva în jurnalul de SMS-uri.
- Utilizatorii afectați au numere de telefon valide și profiluri normale, deci nu e o problemă de date.
- Un alt traseu de SMS (memento-ul de returnare, trimis automat zilnic) **a funcționat pe 17 septembrie** — deci furnizorul de SMS și cheile lui sunt în regulă.

Concluzie: se blochează ceva pe traseul „eveniment de închiriere → trimitere SMS", nu la furnizor. Cauza exactă **nu e încă confirmată** — de aceea primul pas e reproducerea, nu o reparație ghicită.

## Pași

1. **Reproducere controlată.** Apelez serviciul de SMS exact cum îl apelează sistemul de evenimente, dar cu un destinatar inexistent, ca să nu plece niciun SMS real. Citesc jurnalele serviciului ca să văd codul de eroare și mesajul exact.
2. **Reparare în funcție de ce arată eroarea.** Ipotezele probabile, în ordine:
   - verificarea de securitate dintre cele două servicii respinge apelul (versiuni diferite de bibliotecă între ele — cel care funcționează și cel care eșuează folosesc versiuni diferite);
   - cheile furnizorului nu sunt disponibile pentru acest serviciu în anumite condiții;
   - o eroare netratată la pregătirea mesajului.
3. **Jurnalizare mai bună.** Azi eșecul se salvează doar ca „Edge Function returned a non-2xx status code", fără cod sau motiv. Voi salva codul de răspuns și textul erorii, ca data viitoare cauza să fie vizibilă din prima.
4. **Verificare finală.** Retrimit un eveniment de test și confirm că apare o înregistrare „trimis" în jurnalul de SMS-uri, apoi curăț datele de test.

## Detalii tehnice

- Traseul care eșuează: `notify-rental-event` → `supabase.functions.invoke("send-sms-notification")`; cel care merge: `notify-return-day` → aceeași funcție.
- Diferență notabilă: `notify-rental-event` importă `@supabase/supabase-js@2` de pe esm.sh (versiune nefixată), `notify-return-day` folosește `npm:@supabase/supabase-js@2.57.2`. Suspect principal pentru modul în care se trimite antetul `Authorization` către `requireCaller` din `_shared/authGuard.ts`.
- Căi de răspuns non-2xx în `send-sms-notification` care nu scriu în `sms_logs`: 401 (guard), 400 (validări), 500 (lipsă `SMS_ALERT_USERNAME`/`SMS_ALERT_API_KEY`, eroare la citirea profilului, excepție netratată).
- Îmbunătățirea jurnalizării: în `notify-rental-event`, la eroare, salvez în `notification_audit_log.error` statusul HTTP și corpul răspunsului (`FunctionsHttpError.context`), nu doar mesajul generic.
- Fără publicare până la confirmarea ta.
