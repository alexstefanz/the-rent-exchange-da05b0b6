## Pe pauză
Pun pe hold planul Resend / domeniu sender până adăugăm înregistrările DNS pentru `rentli.ro`. Nu mai facem teste de trimitere până atunci.

## Modificări în `src/pages/ActivityLogPage.tsx`

1. **Eliminăm textul tehnic gri din dreapta badge-ului**
   - Scoatem complet blocul care afișează `log.metadata.title / new_status / product_id` (ex: `confirmed`, `12699393-e827-…`, `VERIFIED`, `APPROVED`, `SUBMITTED`).
   - Rămâne doar: iconiță + badge acțiune (în română) + data în dreapta.

2. **Toate acțiunile traduse în română (fallback inclus)**
   - Extindem `actionLabels` cu cheile care apar acum „raw" în UI (KYC_APPROVED, KYC_SUBMITTED, KYC_REJECTED, KYC_REUPLOAD_REQUESTED, KYC_CASE_CREATED dacă lipsește, etc.). Verific întâi în DB ce valori `action` distincte există în `user_activity_logs` pentru a nu rata niciuna.
   - Pentru orice cheie încă nemapată, fallback-ul nu va mai fi `log.action` brut SCREAMING_CASE — îl transformăm într-un text prietenos (lowercase + spații, prima literă mare) ca să nu mai apară niciodată „KYC_APPROVED" în UI.

3. **Aplicăm aceeași curățare și în `src/components/admin/user-detail/UserActivityTab.tsx`**
   - Aceleași etichete RO extinse + eliminăm linia cu `metadata.title / product_id / new_status` (sau o păstrăm doar pt admin? — propunere: în admin păstrăm metadata, în pagina publică user o scoatem). Confirmă dacă vrei și în admin curățat.

## Ce NU schimbăm
- Logica de logging, structura tabelei, iconițele, culorile badge-urilor, layoutul listei.
- Versiunea EN rămâne sincronizată (adăugăm și traducerile EN pentru cheile noi).

Spune-mi dacă vrei curățarea metadata și în tab-ul admin sau doar pe pagina user, și dau drumul.