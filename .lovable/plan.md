## Plan: Actualizare mesaje suport la "24/7"

### Context
Utilizatorul a cerut ca peste tot în aplicație unde apare referire la suport "7 zile pe săptămână" / "7-day support" / "7/7" să fie schimbat cu "24/7".

### Fișiere afectate (6 locații)

1. **`src/components/home/HeroDynamic.tsx` (linia 87-88)**
   - RO: `Suport 7 zile pe săptămână.` → `Suport 24/7.`
   - EN: `7-day support.` → `24/7 support.`

2. **`src/data/uxCopy.ts` (linia 358)**
   - RO: `Suport 24/7 zile pe săptămână.` → `Suport 24/7.` (corectează pleonasmul)
   - EN: deja corect `24/7 support.`

3. **`src/data/uxCopy.ts` (linia 374)**
   - RO: `Suport 24/7 zile pe săptămână.` → `Suport 24/7.` (corectează pleonasmul)
   - EN: deja corect `24/7 support.`

4. **`src/components/home/TrustBarPremium.tsx` (linia 52-55)**
   - Valoare: `Suport Dedicat` (rămâne)
   - Label RO: `Echipă reală 7 zile pe săptămână` → `Echipă reală 24/7`
   - Label EN: `Real team 7 days a week` → `Real team 24/7`

5. **`src/components/home/WhyRentli.tsx` (linia 11)**
   - Title RO: `Suport dedicat` (rămâne)
   - Desc RO: `Echipă reală 7 zile pe săptămână.` → `Echipă reală 24/7.`
   - Desc EN: `Real team 7 days a week.` → `Real team 24/7.`

6. **`src/components/product/RentalProtection.tsx` (linia 10)**
   - Title RO: `Suport 7/7` → `Suport 24/7`
   - Title EN: `7-day support` → `24/7 support`

### Notă
Nu sunt afectate mențiunile "1-7 zile" din `supportFaq.ts` (termeni de rambursare Stripe) sau "weeks (7 days)" din `rentalPricing.ts` (logică de calcul durată), deoarece acestea nu se referă la suportul clienți.