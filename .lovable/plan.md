# Jurnal de activitate global în panoul de administrare

## Situația actuală (verificată)

Jurnalul există și se completează în continuare: în baza de date sunt peste 900 de înregistrări, cea mai recentă din 18 septembrie, ora 13:23 (telefon actualizat). Se înregistrează acțiuni precum: rezervare creată / confirmată / anulată / activă / finalizată, anunț creat / dezactivat / reactivat / șters, preț modificat, telefon actualizat, resetare parolă cerută (plus înregistrări istorice de la verificarea de identitate, eliminată între timp).

Ce lipsește: o pagină în care aceste înregistrări să fie văzute la nivel de platformă. Acum jurnalul apare doar:
- în fișa fiecărui utilizator (tab „Activitate”), câte un utilizator pe rând;
- în contul propriu al utilizatorului, la „Activitatea mea”.

De asemenea, pagina „Audit notificări” există, dar nu are legătură în meniul lateral, deci nu poate fi accesată decât scriind adresa manual.

## Ce construim

1. Pagină nouă: Admin → „Jurnal activitate” (`/admin/activity`)
   - Listă cronologică cu toate acțiunile de pe platformă, cele mai recente primele.
   - Coloane: data și ora, utilizator (nume + email, cu legătură către fișa lui), acțiune (etichetă în română, cu culoare pe tip), tip de element, element vizat (legătură către anunț / rezervare când există), detalii suplimentare.
   - Filtre: căutare după nume/email, tip de acțiune, interval de date; paginare (50 pe pagină) și buton de export CSV.
   - Stil identic cu celelalte tabele din ERP (Rezervări, Produse).

2. Meniul lateral
   - Adăugăm „Jurnal activitate” și „Audit notificări” în meniul de administrare, în zona de monitorizare, împreună cu „SMS Logs”.

3. Dashboard
   - Card compact „Ultima activitate” cu ultimele 8 acțiuni și legătură către pagina completă.

## Detalii tehnice

- Acces: politica existentă `Admins can read activity logs` permite deja citirea completă administratorilor, deci nu e nevoie de migrare sau funcție nouă în baza de date.
- Fișiere noi: `src/pages/admin/AdminActivityLog.tsx`, `src/features/admin/activityFeedApi.ts` (interogare paginată `user_activity_logs` + alăturarea numelui/emailului din `profiles`), `src/hooks/queries/useAdminActivityFeed.ts`.
- Traducerea acțiunilor: un dicționar `ACTION_LABELS` (RO/EN) reutilizat și de tabul existent din fișa utilizatorului.
- Rută nouă în `src/App.tsx` (lazy, ca restul) și intrări în `src/components/admin/AdminSidebar.tsx` + `MobileAdminMenu.tsx`.
