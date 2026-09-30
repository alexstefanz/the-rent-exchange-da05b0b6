# Eroarea DISPUTE_OPEN la semnarea PV (RNT-000235)

## Cauza (verificată în baza de date)
Pe RNT-000235 există o dispută deschisă:
- deschisă de Denis Matrescu (proprietar) pe 30.09.2026 la 13:29, cu un minut înainte să semneze PV-ul;
- faza: predare; motiv: „Am o problema are plata fake".

Cât timp o dispută e deschisă, sistemul blochează intenționat confirmarea predării. Semnătura Oanei ar confirma automat predarea, așa că tot pasul e refuzat, iar semnătura nu se salvează. Semnarea funcționează corect; blocajul vine de la regula de protecție a disputei, nu de la o eroare.

## Ce schimbăm
1. **Mesaj clar în loc de „DISPUTE_OPEN"**: „Rezervarea este în verificare la echipa Rentli (dispută deschisă). Semnarea va fi posibilă după rezolvarea disputei." (RO/EN).
2. **Fereastra de semnare, când există dispută deschisă**: afișăm din start un banner, iar caseta de semnătură și butonul sunt dezactivate. Astfel, nimeni nu mai desenează semnătura degeaba.
3. **Pagina închirierii**: butonul de semnare PV arată „În verificare" cât timp disputa e deschisă.

## Pentru RNT-000235 (decizia ta)
Disputa pare deschisă din greșeală sau ca test. Din panoul de administrare, un admin o poate închide (Rezervări → RNT-000235 → rezolvă disputa). După aceea, Oana poate semna. Dacă vrei, o pot închide direct eu, cu nota „închisă la cererea echipei".

## Detalii tehnice
- `mapPvError` există deja în `ownerRentalsApi.ts`; îl extindem pentru codul simplu `DISPUTE_OPEN` și îl folosim în `handleSign` din `PvSignatureDialog.tsx`, prin `setSignError`.
- Dialogul primește `disputeStatus` de la `RentalDetailPage` / tab-uri; dacă valoarea e `open`, afișăm banner-ul, iar `canSign` devine false.
- Nu modificăm triggerul `enforce_pv_gates`: blocajul e corect ca regulă de business.
