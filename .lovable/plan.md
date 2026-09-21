# Verificare completă a platformei Rentli

Rulez un test end-to-end pe opt zone ale platformei, cu conturi de test create special pentru asta, card de test (fără bani reali) și fără emailuri/SMS-uri reale trimise — verific doar în jurnalele platformei că au plecat.

## Ce testez, pas cu pas

**1. Creare cont + cod de confirmare**
Înregistrare cu email și telefon, primire și introducere cod, confirmare, prima intrare în cont. Verific și mesajele de eroare (parolă respinsă, email deja folosit, cod greșit sau expirat).

**2. Procesul de închiriere — chiriaș**
Căutare produs, alegere perioadă în calendar, trimitere cerere cu mesaj, urmărirea cererii în „Rezervări", anulare, cerere de returnare anticipată.

**3. Procesul de închiriere — proprietar**
Primirea cererii (inclusiv pop-up-ul), acceptare și refuz, semnarea procesului-verbal la predare și la retur, confirmarea automată a predării, finalizarea închirierii și încasarea în portofel.

**4. Plata cu cardul**
Plata cu card de test, plata din portofel, revenirea pe site după plată (desktop și mobil), plata eșuată și anulată, blocarea și eliberarea sumei, rambursarea la refuz.

**5. Chat**
Pornirea conversației de la un produs, trimitere mesaj și imagine, mesaje noi în timp real, blocarea datelor de contact, butonul de telefon după rezervare confirmată, accesul blocat pentru vizitatori nelogați.

**6. Panoul de administrare**
Trec prin fiecare secțiune: tablou de bord, utilizatori, anunțuri și aprobări, rezervări, finanțe și retrageri, categorii, conversații, notificări, SMS, rapoarte, analize și jurnalul de activitate — verific că datele afișate corespund cu cele din bază și că acțiunile de administrare funcționează.

**7. Ticketing**
Creare tichet de către un client, apariția lui în panou, preluare, răspuns, schimbare de stare și închidere cu verdict, plus verificarea codului TCK și a termenelor de răspuns.

**8. Recenzii**
După o închiriere încheiată: recenzia chiriașului despre proprietar și produs, recenzia proprietarului despre chiriaș, criteriile multiple, blocarea recenziilor duble și actualizarea mediei pe profil și pe anunț.

## Cum lucrez

Parcurg aplicația ca un utilizator real, automat, și fac capturi de ecran la pașii importanți. În paralel verific în baza de date că fiecare acțiune a lăsat urmele corecte (rezervare, plată, tichet, recenzie, jurnal) și mă uit în jurnalele funcțiilor de server pentru erori.

## Ce primești la final

Un raport pe cele opt zone, cu:
- ce funcționează corect;
- ce este defect, cu pașii de reproducere și dovada (captură sau eroare din jurnal);
- ordinea recomandată de reparare, de la blocant la cosmetic.

Nu repar nimic în timpul testului — la final îți propun separat reparațiile, ca să decizi tu ce intră.

## Detalii tehnice

- Automatizare Playwright pe aplicația care rulează, script-uri temporare în `/tmp/browser/`.
- Conturi de test noi (chiriaș + proprietar), credit adăugat manual în portofel pentru testarea plății din portofel; date marcate clar ca test și curățate la final.
- Card de test Stripe `4242 4242 4242 4242`; verific `payment_intent`, hold/capture și refund prin API-ul Stripe, fără încasări reale.
- Verificări SQL directe pe `rentals`, `transactions`, `owner_payouts`, `ops_tickets`, `reviews`, `user_activity_logs`, `notifications`.
- Emailuri/SMS: verificate doar prin coada de emailuri și `AdminNotificationAudit` / `AdminSmsLogs`, fără trimiteri reale către adrese externe.
- Jurnale edge functions relevante: `respond-rental-request`, `create-checkout-session`, `verify-stripe-payment`, `capture-rental-payment`, `generate-pv-pdf`, `notify-rental-event`.
