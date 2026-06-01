## Problem

Formularul **Asistență & Contact** din `/centru-ajutor` (și cel din `/contact`) deschide clientul de email implicit (Outlook) prin `mailto:` în loc să creeze un tichet în sistemul intern. Rezultatul: nu se generează tichet, mailul nu se trimite și utilizatorul rămâne blocat.

Infrastructura de tickete există deja: `createUserTicket` din `src/features/tickets/userTicketsApi.ts` scrie în `ops_tickets`, iar `addUserTicketAttachment` urcă fișiere în bucket-ul `ticket-attachments`. Pagina `/suport` listează deja tichetele utilizatorului.

## Soluție

Înlocuim trimiterea prin `mailto:` cu crearea unui tichet real în baza de date și redirect către conversația din `/suport`.

### 1. `src/pages/HelpCenter.tsx` — `handleContactSubmit`
- Citește user-ul curent (`supabase.auth.getUser` sau `useAuth`)
- **Dacă NU este autentificat**: toast „Trebuie să fii autentificat pentru a deschide un tichet" + buton/redirect către `/auth?redirect=/centru-ajutor`. Fără fallback mailto.
- **Dacă este autentificat**:
  1. `createUserTicket({ title: subject, description: 'Nume: …\nEmail: …\n\n' + message, category_group: 'USER', category_type: 'GENERAL_INQUIRY', priority: 'MEDIUM' })`
  2. Pentru fiecare fișier atașat → `addUserTicketAttachment(ticket.id, file)` (best-effort, prinde erorile individual)
  3. Toast succes „Tichet creat — `TCK-XXXXXX`. Te-am redirecționat la conversație."
  4. `navigate('/suport')` (sau direct la detalii dacă există rută; momentan `/suport` listează tichetele)
  5. Reset formular + fișiere
- Buton dezactivat + spinner cât rulează submitul; gestionare erori cu toast.

### 2. `src/pages/HelpCenter.tsx` — `handleFeedbackSubmit`
- Aceeași logică: creează tichet `USER / GENERAL_INQUIRY`, titlu `[Feedback] {feedbackType}`, descriere cu rating + tip + mesaj. Aceleași condiții de autentificare.

### 3. `src/pages/Contact.tsx` — formularul de pe pagina Contact
- Aceeași migrare: înlocuim `mailto:` cu `createUserTicket` + aceleași reguli de auth/redirect.
- Păstrăm pe pagină informația vizuală „office@rentli.ro" ca link de email pentru cei care preferă, dar formularul nu mai deschide mailul.

### 4. UX: labeluri & helper text
- Sub butonul „Trimite mesajul" adăugăm un mic helper: „Mesajul tău devine un tichet pe care îl poți urmări din **Suport & Tichete**."
- Pentru utilizatorii neautentificați, înlocuim helper-ul cu „Autentifică-te pentru a deschide un tichet."

### Memory update
- Actualizez memoria `mem://content/writing-policy` pentru a reflecta că formularele de support trimit direct în sistemul de tichete (nu mai folosesc `mailto:`). Memoria veche „forms use mailto links" devine învechită și trebuie corectată ca să nu repetăm pattern-ul greșit.

### Out of scope

- Fără modificări de schemă DB / RLS / RPC (totul există deja: `ops_tickets`, `addUserTicketAttachment`, bucket `ticket-attachments`).
- Fără email tranzacțional nou — confirmările prin email pentru tichete create (dacă există deja un trigger) rămân așa cum sunt; dacă nu există, e o îmbunătățire separată.
- Fără pagină nouă de detaliu tichet — folosim cea existentă `/suport`.
