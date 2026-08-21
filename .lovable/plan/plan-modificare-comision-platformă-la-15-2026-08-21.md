# Plan: Modificare comision platformă la 15%

## Obiectiv
Comisionul standard Rentli trece de la **5% la 15%** pentru fiecare produs. Promoția „primele 3 anunțuri fără comision” se păstrează.

## Modificări propuse

### 1. Bază de date
- Schimbă valoarea implicită (default) a coloanei `products.platform_fee_percent` de la `5.00` la `15.00`.
- Actualizează toate produsele existente care au `platform_fee_percent = 5` la `15`, cu excepția celor aflate în promoția „primele 3 gratuite" (valoare `0`).
- Actualizează fallback-ul din triggerul `tg_rentals_enforce_price` de la `5` la `15`, pentru cazul în care un produs are valoare `NULL`.

### 2. Backend / Edge Functions
- Nu sunt modificări directe în edge functions: acestea citesc `platform_fee_percent` direct din închiriere/produs.

### 3. Frontend
- `src/features/products/productsApi.ts`: modifică logica de determinare a comisionului la publicare de la `existingCount < 3 ? 0 : 5` la `existingCount < 3 ? 0 : 15`.
- `src/features/rentals/rentalsApi.ts`: modifică fallback-ul implicit al parametrului `platformFeePercent` de la `5` la `15`.
- `src/data/supportFaq.ts`: actualizează textul FAQ care menționează 5% la 15%.

### 4. Documentație/memorie
- Actualizează memoria de proiect referitoare la comision (5% → 15%) pentru a reflecta noua regulă.

## Ce NU se schimbă
- Prima 3 anunțuri per utilizator rămân cu `0%` comision.
- Logica de calcul `calcPlatformFee` (comision minim 1 RON când procentul > 0) rămâne neschimbată.
- Coloanele `rentals.platform_fee` și `rentals.platform_fee_percent` continuă să fie calculate automat de trigger.

## Verificare
- După implementare, se verifică:
  - Un produs nou publicat de un utilizator cu ≥3 anunțuri primește `platform_fee_percent = 15`.
  - Primele 3 anunțuri rămân cu `0`.
  - Prețul afișat pe pagina de produs și checkout reflectă 15%.
  - Textul FAQ este actualizat.
