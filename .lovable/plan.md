# Repară butonul „Publică anunțul”

## Ce știm deja
- Anunțul cu bicicleta nu s-a salvat. Ultimul anunț salvat este Xbox-ul din 24.09.
- Pe server nu apare nicio eroare, deci cererea de salvare fie nu pleacă, fie e respinsă fără să se înregistreze.
- Mesajul roșu adăugat data trecută se afișează la finalul paginii, deasupra barei de jos. Probabil nu îl vezi pentru că rămâne în afara ecranului.

## Pași
1. **Reproduc problema pe contul tău.** Deschid site-ul logat ca tine (cu acordul tău), completez un anunț de test și apăs „Publică anunțul”. Urmăresc exact ce trimite pagina și ce răspunde serverul, ca să aflu cauza reală.
2. **Repar cauza găsită.** Posibile cauze: o regulă de pe server care respinge salvarea, o verificare din pagină care se oprește fără mesaj sau o problemă cu sesiunea.
3. **Fac eroarea mereu vizibilă.** Mesajul roșu apare în bara fixă de jos, lângă buton, deci îl vezi fără să derulezi. Rămâne acolo până apeși din nou.
4. **Verific.** Public anunțul de test până la capăt și confirm că ajunge în „Anunțurile mele” cu statusul „În așteptare”. La final șterg anunțul de test.

## Detalii tehnice
- `PublishWizard.tsx`: mut bannerul `publishError` în `PublishFooter` (nou prop `error`), în interiorul barei sticky.
- Testul se face cu Playwright și o sesiune generată pentru contul tău. În `handlePublish` / `createProduct` urmăresc apelurile către `products` și răspunsurile lor.
