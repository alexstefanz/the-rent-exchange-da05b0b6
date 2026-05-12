## Observație

Am verificat fluxul pe `/produs/xbox-one-x`: după selectarea unei singure zile, cardul setează corect `Început = Sfârșit` și totalul pentru 1 zi. Problema observată este că utilizatorul logat pare să fie proprietarul produsului, iar `PremiumBookingCard` dezactivează/nu permite rezervarea când `isOwnProduct` este true. Din UI nu este clar de ce nu se poate continua.

## Plan

1. **Clarific blocarea pentru propriul produs**
   - În `PremiumBookingCard.tsx`, când produsul este al utilizatorului curent, afișez butonul ca stare dedicată, de tip „Nu poți rezerva propriul produs”, în loc să pară că rezervarea pe o singură zi nu funcționează.
   - Butonul rămâne dezactivat doar în acest caz.

2. **Păstrez rezervarea pe o singură zi activă pentru ceilalți utilizatori**
   - Dacă `startDate` și `endDate` sunt aceeași zi, butonul rămâne activ și textul rămâne „Rezervă acum”.
   - Nu schimb calculul de preț sau logica de checkout, deoarece acestea deja calculează corect `rentalDays = 1`.

3. **Verific după modificare**
   - Testez vizual selectarea unei singure zile în card.
   - Confirm că pentru produs propriu apare mesajul corect, iar pentru cazul normal butonul indică rezervarea activă.