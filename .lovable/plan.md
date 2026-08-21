# Tichete în locul chatului live de suport

Suportul devine un sistem de tichete asincron cu promisiune clară de răspuns în maximum 48 de ore, în locul experienței de chat live care presupune prezență permanentă.

## Ce se schimbă pentru utilizator

- Bula flotantă rămâne, dar nu mai arată ca un chat. La deschidere afișează:
  - un formular scurt de tichet (subiect, categorie, descriere, atașamente opționale, context rezervare/produs);
  - lista tichetelor proprii, cu stare și termen de răspuns.
- După trimitere, utilizatorul vede confirmarea cu numărul tichetului (TCK-XXXXXX) și textul „Răspundem în maxim 48 de ore”, plus termenul concret calculat.
- Firul tichetului devine stil email: mesaje asincrone cu marcaj de dată/oră, fără indicatori de „scrie acum”, fără sugestia de răspuns instant. Utilizatorul poate adăuga oricând completări la tichetele deschise.
- Se elimină limbajul și elementele de chat live (bule tip conversație, „Suport online”, autoscroll continuu, plasarea în tabul Mesaje ca și conversație).
- Aceleași reguli se aplică în Centru de ajutor, Contact și pagina Tichetele mele — toate creează tichete prin același flux.

## SLA 48 de ore

- Fiecare tichet primește un termen de răspuns (creare + 48h), afișat utilizatorului și în panoul de admin.
- SLA-ul se consideră îndeplinit la primul răspuns al echipei (mesaj non-intern).
- În admin: badge-uri de stare SLA (în termen / sub 12h rămase / depășit) și sortare cu tichetele riscante în față.
- Alerte interne: notificare admin la 24h fără răspuns și la depășirea celor 48h, generate de jobul cron existent pentru tichete.

## AI

Asistentul AI rămâne doar în fundal, pentru clasificare și prioritizare la crearea tichetului. Nu mai trimite răspunsuri către utilizator.

## Detalii tehnice

- Bază de date (migrare):
  - `ops_tickets`: coloane noi `first_response_at`, `sla_due_at` (default `created_at + 48h`), `sla_breached_at`.
  - Trigger la inserare mesaj de tip `AGENT`/`ADMIN` non-intern → completează `first_response_at`.
  - Extindere `supabase/functions/ops-tickets-cron/index.ts`: marchează `sla_breached_at` și inserează în `admin_notifications` la pragurile 24h/48h.
- Frontend:
  - `src/components/support/SupportChatWidget.tsx` refactorizat și redenumit conceptual în widget de tichete: două ecrane (formular nou / listă + detaliu tichet), fără UI de chat live. Vizualizarea admin (inbox) se păstrează.
  - `src/pages/UserTickets.tsx`, `src/pages/HelpCenter.tsx`, `src/pages/Contact.tsx`: mesaj SLA unificat și trimitere către același formular.
  - `src/features/tickets/userTicketsApi.ts`: expune `sla_due_at` / `first_response_at` și helper de formatare a termenului.
  - Admin: `src/features/admin/opsTicketsApi.ts` + panoul de tichete primesc indicatorii SLA.
  - Texte RO/EN adăugate în dicționarul centralizat de copy.
- Se păstrează regulile anti-spam existente, realtime pentru actualizări de tichet și emailurile tranzacționale la creare/răspuns.
