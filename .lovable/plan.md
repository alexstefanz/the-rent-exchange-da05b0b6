Plan de remediere pentru notificările bottom-center la închirieri:

1. **Corectez livrarea realtime pentru toast-uri**
   - Înlocuiesc dependența exclusivă de evenimentul realtime `INSERT notifications`, deoarece rândurile există în DB pentru RNT-000101, dar toast-ul nu se afișează.
   - Adaug un mecanism de fallback în `useGlobalRealtime`: la conectare, focus sau schimbări pe `rentals`, verifică notificările noi necitite ale utilizatorului și afișează bottom-center doar pe cele care nu au mai fost afișate în sesiune.
   - Păstrez realtime-ul existent, dar îl fac rezilient când websocket-ul ratează evenimentul sau tab-ul nu era pregătit.

2. **Elimin cauza dublării/confuziei între toast-uri**
   - Ajustez configurația Sonner ca toate notificările custom din `notifyFromDb` să ajungă sigur în viewport-ul bottom-center.
   - Păstrez toast-urile legacy normale fără să le afectez.

3. **Acopăr toți pașii din timeline-ul închirierii**
   - Mă asigur că `notify-rental-event` este apelat pentru pașii discutați: cerere creată, acceptată/refuzată, plată confirmată, pickup stabilit, PV predare, predare confirmată, închiriere activă, returnare, PV retur, finalizare, review, dispute/anulări.
   - Pentru accept/refuz verific și completez flow-ul `respond-rental-request`, astfel încât proprietarul și chiriașul primesc notificări in-app adaptate rolului.
   - Pentru plata Stripe, înlocuiesc notificarea veche `send-rental-notification` cu evenimentul centralizat `payment_succeeded`, ca să fie consistent cu restul timeline-ului.

4. **Verific pe cazul real RNT-000101**
   - Confirm că notificările in-app sunt create pentru ambii utilizatori.
   - Verific logurile funcției și tabela `notification_audit_log` după remediere.
   - Testez că un utilizator conectat vede toast bottom-center chiar dacă notificarea a fost creată înainte ca realtime-ul să prindă evenimentul.

Fișiere vizate: `src/hooks/useGlobalRealtime.ts`, `src/components/ui/sonner.tsx`, `supabase/functions/verify-stripe-payment/index.ts`, `supabase/functions/respond-rental-request/index.ts` și, dacă este necesar, `supabase/functions/notify-rental-event/index.ts`.