# Codul de verificare SMS nu ajunge

## Ce am găsit
- La 16:26 (azi) s-a generat un cod pentru +40743588802 și furnizorul de SMS **a acceptat mesajul** (a răspuns „ok” și a dat un număr de mesaj). Deci site-ul trimite corect; mesajul se pierde după ce pleacă de la noi (la furnizor sau la operatorul telefonic).
- Jurnalul de SMS-uri din admin e **gol** — nici codul de azi nu apare. Cauza: salvarea în jurnal eșuează în tăcere pentru că lipsește un câmp obligatoriu (cheia unică a mesajului). De aceea nu vezi nimic în panoul de SMS-uri.
- După resetare nu mai există alte SMS-uri în jurnal.

## Pași
1. **Reparare jurnal**: codurile de verificare se salvează din nou în jurnalul de SMS-uri (trimis / eșuat, cu motivul).
2. **Verificare la furnizor**: interoghez furnizorul de SMS după numărul mesajului de azi ca să aflu starea livrării (livrat, respins de operator, fără credit, expeditor neaprobat).
3. **Stare livrare vizibilă**: salvez și starea raportată de furnizor, ca să apară în admin dacă un SMS a fost acceptat dar nelivrat.
4. **Test real**: retrimit un cod pe numărul tău și confirm că apare în jurnal și că ajunge pe telefon. Dacă furnizorul raportează problemă de cont (credit, expeditor), îți spun exact ce trebuie făcut la ei.

## Detalii tehnice
- `send-phone-otp`: insert-ul în `sms_logs` nu setează `idempotency_key` (NOT NULL) → eroare înghițită de `.then(()=>{}, ...)`. Adaug `idempotency_key: phone_otp:${userId}:${Date.now()}` și log explicit al erorii.
- Interogare status mesaj la API-ul smsalert.mobi cu `providerId` (ex. `f466c694…`); salvare în `provider_response`.
- Fără publicare până la confirmarea ta.
