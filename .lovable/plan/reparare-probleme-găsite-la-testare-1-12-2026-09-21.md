# Reparare probleme găsite la testare (1 → 12)

Le rezolv în ordinea din raport, în trei etape: mai întâi banii, apoi documentele și siguranța, la final textele și afișarea.

## Etapa 1 — Bani și plăți (1, 2, 5, 6)

1. **Comision lipsă la plata din portofel** — plata din portofel reține acum totalul (preț + comision), la fel ca la Stripe: din exemplul testat, 17,25 lei în loc de 15 lei. Proprietarul primește partea lui, platforma comisionul.
2. **Pagina Financiar din admin** — sumele apar 0 lei pentru că raportul cere obligatoriu un interval de date și nu primește unul; îl fac să afișeze implicit tot istoricul. Înlocuiesc textele „20% / 80%" cu comisionul real (15%), calculat din date, nu scris fix.
3. **Sume greșite în chat și notificări** — peste tot unde se cere plata se va afișa totalul cu comision, nu doar prețul.
4. **Tranzacție rămasă „autorizată"** — la plata din portofel tranzacția trece corect pe „finalizată", ca să apară în rapoarte.

## Etapa 2 — Documente, chat, SMS (3, 4, 7)

5. **Date de contact în chat** — telefonul, emailul și linkurile sunt blocate cât timp rezervarea nu e plătită; după plată comunicarea directă e permisă. Blocarea se face și în baza de date, nu doar în pagină, ca să nu poată fi ocolită.
6. **Document de predare fără PDF** — la predare se salvează fișierul PDF semnat, exact ca la returnare, și rămâne descărcabil din pagina închirierii.
7. **Codurile SMS nu apar în jurnal** — înregistrarea în jurnalul de SMS-uri se face înainte de încheierea trimiterii, ca să nu se piardă.

## Etapa 3 — Afișare și texte (8, 9, 10, 11, 12)

8. **Buton „Lasă un review"** — dispare după ce recenzia a fost trimisă.
9. **Text dublat** la fotografiile procesului-verbal.
10. **„Rata de conversie 586,8%"** — se calculează corect (rezervări raportate la vizite/anunțuri, plafonat logic) sau, dacă nu are sens, se înlocuiește cu un indicator util.
11. **Notificările de rezervare** duc către o adresă inexistentă — corectez legătura către pagina de căutare.
12. **Emailuri în mod test** — trec trimiterea pe adresa reală noreply@rentli.ro, după verificarea domeniului; scot avertismentul de mod test din panou.

## Alte probleme observate în timpul testării

- Raportul financiar din admin nu returnează nimic fără interval de date (cauza sumelor 0) — inclus la punctul 2.
- Avertismente în consolă pe tabelele de admin (rezervări, anunțuri, utilizatori) — le curăț la trecerea prin etapa 3.
- Erorile la încărcarea ferestrelor de rezervare sunt înghițite în tăcere; adaug afișarea lor.
- La plata din portofel proprietarul este creditat din calculul de sold, nu printr-o înregistrare proprie — verific și aliniez cu plata prin Stripe, în etapa 1.

## Detalii tehnice

- `pay_rental_with_wallet`: debitează `subtotal + platform_fee`, verifică soldul față de total, scrie `platform_fee`/`owner_payout` în metadata și creditează proprietarul cu `owner_payout`; tranzacția asociată trece pe `completed`.
- `get_admin_financial_summary`: parametrii de dată devin opționali (`WHERE (start_date IS NULL OR ...)`), iar `AdminFinances.tsx` afișează procentul real din `platform_fee_percent`.
- Validare contact în chat: `containsContactInfo` aplicat în `sendMessage` (`messagingApi.ts`) + trigger pe `messages` care blochează dacă rezervarea legată nu are `payment_status` plătit.
- `generate-pv-pdf`: salvare `pdf_path` și pentru faza `handover`.
- `send-phone-otp`: `await` la insertul în `sms_logs`.
- `RentalPopupManager.tsx:206`: `/cautare` → `/cauta`.
- Emailuri: verificare domeniu, apoi trecere de pe expeditorul de test pe `noreply@rentli.ro` în funcțiile de trimitere și în `AdminTestEmails`.

După fiecare etapă verific în aplicație (inclusiv o închiriere de test plătită din portofel) și îți raportez rezultatul.
