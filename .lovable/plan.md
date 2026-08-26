# KYC externalizat prin Stripe Identity (cu strat de provider comutabil)

## Părerea mea, pe scurt

Da, Stripe Identity se poate implementa și este clar mai bun decât ce avem acum.

Astăzi fluxul este: utilizatorul încarcă poze cu buletinul și un selfie într-un bucket privat, un model AI extrage datele (CNP, serie, nume) și le salvează în baza noastră, iar un admin aprobă manual fiecare caz. Asta înseamnă că noi găzduim documente de identitate și CNP-uri — date sensibile sub GDPR — și că verificarea depinde de disponibilitatea unui om.

Cu Stripe Identity, pozele documentului și selfie-ul nu mai trec prin serverele noastre: utilizatorul e redirecționat într-o sesiune găzduită de Stripe, care face verificarea documentului, liveness/face-match și returnează doar rezultatul (verified / requires_input) plus câteva câmpuri minime (nume, dată naștere, ultimele cifre ale documentului). Noi păstrăm doar decizia.

Avantaje: mai puțină răspundere GDPR, verificare în secunde în loc de ore, detecție de fraudă mult peste ce poate face un model AI pe o poză, Stripe e deja integrat în proiect (plăți), deci nu adăugăm un furnizor nou în stiva de contracte.

Limite de care trebuie ținut cont:
- Cost per verificare (se plătește fiecare încercare reușită, aproximativ 1.5 USD/verificare — de confirmat pe contul vostru).
- Stripe Identity NU returnează CNP-ul. Dacă CNP-ul e necesar pentru procesele-verbale sau pentru contracte, el trebuie cerut separat utilizatorului și validat prin algoritmul de control, nu extras din document.
- Rămâne nevoie de un fallback manual pentru cazurile respinse repetat (documente atipice, utilizatori fără document acceptat).

Recomandarea mea: implementăm un strat de provider în spatele fluxului actual, cu Stripe Identity ca prima integrare. Dacă a doua variantă pe care o așteptați se dovedește mai bună (preț, suport documente RO, KYB pentru firme), se schimbă doar adaptorul, nu tot fluxul.

## Ce se construiește

### 1. Strat de provider
Tabela `kyc_cases` are deja `provider_name` și `provider_case_id`, deci structura suportă asta fără migrare majoră. Adăugăm:
- `MANUAL` = fluxul actual (rămâne ca fallback)
- `STRIPE_IDENTITY` = flux nou
Un singur comutator de configurare decide ce provider e activ pentru utilizatori noi.

### 2. Flux utilizator (Stripe Identity)
1. Utilizatorul apasă „Verifică identitatea" în fluxul existent.
2. Se creează un caz KYC și o sesiune de verificare la Stripe.
3. Utilizatorul e dus în interfața Stripe (document + selfie), apoi revine în aplicație.
4. Pagina arată „verificare în curs"; când rezultatul sosește, statusul devine VERIFICAT sau RESPINS cu motiv.
5. La respingere repetată (peste 2 încercări), cazul intră automat la revizuire manuală de către admin.

### 3. Admin
Panoul de KYC rămâne, dar pentru cazurile Stripe afișează rezultatul furnizorului (tip document, țară, nume, potrivire față, motivul respingerii) în loc de poze. Adminul poate suprascrie decizia (aprobare/respingere manuală), cu urmă în jurnalul de audit.

### 4. Date și retenție
- Nu mai stocăm imagini de document pentru cazurile Stripe.
- Din datele returnate salvăm doar: nume complet verificat, data nașterii, tipul și ultimele cifre ale documentului, decizia.
- CNP: se cere separat în formular, doar dacă e necesar pentru PV/contract, cu validare de checksum.
- Documentele vechi din fluxul manual: propun o politică de ștergere după aprobare (de confirmat cu voi).

## Detalii tehnice

- Funcții edge noi:
  - `kyc-create-verification-session` — creează `identity.verification_session` la Stripe, leagă `provider_case_id` de cazul KYC, întoarce URL-ul găzduit. Validează JWT-ul utilizatorului.
  - `kyc-stripe-webhook` — `verify_jwt = false`, validează semnătura Stripe, tratează `identity.verification_session.verified` / `.requires_input` / `.canceled`, actualizează `kyc_cases` + `profiles.kyc_status/kyc_level` cu service role, scrie în `kyc_audit_log`.
- Migrare: coloane pentru rezultatul furnizorului pe `kyc_cases` (document type, country, verified name, dob, last4, motiv eșec) + politici RLS (utilizatorul vede doar cazul propriu; scrierea doar prin service role/trigger, ca acum).
- Frontend: `KycInlineFlow.tsx` primește o ramură nouă pentru providerul Stripe (redirect + ecran de așteptare cu polling scurt), fără să schimbe ramura manuală.
- Secrete: cheia Stripe existentă poate fi refolosită; e nevoie în plus de secretul de semnătură al webhook-ului Identity.
- `extract-id-data` și `kyc_extracted_data` rămân neatinse, folosite doar de fluxul manual.

## Ordine de lucru

1. Migrare bază de date + comutator de provider.
2. Funcția de creare sesiune + webhook.
3. Ramura nouă în fluxul de KYC din interfață.
4. Adaptarea panoului de admin.
5. Test end-to-end în modul de test Stripe, apoi activare pentru utilizatori noi.

## De confirmat înainte de start

- Activăm Stripe Identity pe contul Stripe existent (necesită acceptarea termenilor Identity în dashboard-ul Stripe).
- Aveți nevoie de CNP în continuare pentru procesele-verbale? Dacă da, îl cerem separat.
- Firmele (conturi business) rămân pe verificarea actuală prin CUI/ANAF, sau vreți și verificarea administratorului?
