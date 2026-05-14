## Plan

1. **Fix pentru datele afișate în report details**
   - Pentru report-urile pe conversație, voi afișa ambii participanți cu nume, email și rol în conversație: `Raportat de`, `Utilizator raportat`, `Cumpărător`, `Proprietar`.
   - Voi separa clar `Motiv report` (categoria selectată: Altceva/Fraudă/Hărțuire etc.) de `Detalii reporter`.
   - Pentru report-urile vechi unde în `reason` apare doar `Conversation <uuid>`, nu voi mai afișa acel text ca motiv; îl voi trata ca detaliu tehnic ascuns/legacy.
   - În conversația raportată voi afișa mesajele recente cu numele expeditorului, nu doar timestamp-ul.

2. **Raportarea conversației cu motiv real**
   - Voi înlocui confirmarea simplă din panoul de chat cu un dialog similar celui de raportare mesaj.
   - Utilizatorul va putea alege motivul report-ului și completa detalii opționale.
   - La trimitere se va salva `conversation_id`, `reported_user_id` și categoria/motivul, nu doar conversația.

3. **Schema backend pentru utilizator raportat și avertizări**
   - Voi adăuga în `message_reports` un câmp `reported_user_id`, populat automat pentru report-urile noi.
   - Voi face backfill pentru report-urile existente: dacă raportorul este buyer, utilizatorul raportat devine owner și invers.
   - Voi crea un tabel securizat `user_warnings` pentru avertizări, vizibil/administabil doar de admini, iar utilizatorul avertizat își poate vedea propriile avertizări.

4. **Fix pentru ban din Reports**
   - Pentru conversații raportate, banarea va folosi `reported_user_id`, nu `author_id` (care e gol când nu există mesaj selectat).
   - Butonul/checkbox-ul va arăta explicit pe cine banează: numele utilizatorului raportat.
   - Voi trata erorile de banare cu mesaj clar în UI, ca să nu pară că report-ul s-a rezolvat dacă banarea a eșuat.

5. **Variantă de avertizare**
   - În acțiuni moderare voi adăuga flux real de `Avertizează utilizatorul raportat`.
   - La avertizare se creează înregistrare în `user_warnings` și o notificare in-app către utilizator, cu motivul și notele adminului.
   - Report-ul se marchează rezolvat cu acțiunea `warning` doar după ce avertizarea s-a salvat.

## Fișiere vizate

- `supabase/migrations/...sql` — câmp `reported_user_id`, tabel `user_warnings`, RLS și backfill.
- `src/lib/chatMedia.ts` — suport pentru `category`, `reportedUserId`, `conversationId`.
- `src/components/messaging/InfoPanel.tsx` — dialog de raportare conversație cu motiv/detalii.
- `src/features/admin/messageReportsApi.ts` — hidratare participanți, utilizator raportat, mesaje recente cu nume, funcție `warnUser`.
- `src/pages/admin/AdminReports.tsx` — UI complet pentru detalii, ban pe utilizatorul corect și avertizare.

## Notă importantă

Report-ul din screenshot are conversația `429bee...`, iar baza de date arată că acea conversație are 0 mesaje. De aceea nu poate afișa text de conversație, dar după schimbare vei vedea cel puțin participanții, utilizatorul raportat, motivul real și acțiunile corecte de ban/avertizare.