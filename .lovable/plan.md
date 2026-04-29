Am verificat captura și codul: modificarea anterioară a fost aplicată într-o componentă `BookingCard.tsx`, dar pagina curentă `/produs/ferestrau-spada` nu folosește acea componentă. Ea are încă propriul cadran de rezervare în `src/pages/ProductDetail.tsx`, cu formula veche:

```text
if rentalDays >= 30:
  total = ceil(rentalDays / 30) * priceMonth
```

De aceea intervalele lungi rămân la același preț pentru blocuri mari de zile. În captura ta, textul arată `33 zile x 1.05 RON`, dar totalul este `46 RON`, adică încă se folosește logica veche cu 2 luni, nu calculul pe zile afișat.

## Plan de corectare

1. Corectez calculul în `src/pages/ProductDetail.tsx`
   - Înlocuiesc formula cu descompunere pe luni + săptămâni + zile:

```text
months = floor(rentalDays / 30)
remaining = rentalDays % 30
weeks = floor(remaining / 7)
days = remaining % 7

total = months * priceMonth + weeks * priceWeek + days * clientPrice
```

2. Actualizez detalierea prețului din cadranul „Selectează perioada”
   - În loc de linia greșită `33 zile x 1.05 RON`, afișez liniile reale folosite la calcul, de exemplu:

```text
1 lună × 23 RON      23 RON
3 zile × 1.05 RON    3.15 RON
Total                26.15 RON
```

   - Se afișează doar liniile nenule: luni, săptămâni, zile.
   - Textul va rămâne bilingv RO/EN, ca restul paginii.

3. Aliniez checkout-ul cu aceeași logică
   - Acum checkout-ul creează rezervarea folosind `dailyPrice * rentalDays`, ceea ce poate produce o sumă diferită față de totalul afișat în pagina produsului.
   - Voi modifica fluxul astfel încât checkout-ul și înregistrarea rezervării să folosească același `totalPrice` calculat pe luni/săptămâni/zile.
   - Actualizez sumarul din checkout, ca să nu mai afișeze fals `preț/zi × zile` când de fapt se aplică tarife lunare/săptămânale.

4. Reduc riscul de reapariție
   - Creez o funcție helper reutilizabilă pentru calculul prețului, folosită atât de pagina produsului, cât și de checkout/API-ul de rezervare.
   - Astfel nu mai există două formule diferite în locuri diferite.

## Rezultat așteptat

Pentru produsul din exemplul tău, intervalul 1 Mai - 2 Iunie nu va mai avea același comportament ca 1 Mai - 31 Mai. Fiecare zi suplimentară peste luna completă va fi inclusă în total, iar detalierea afișată va corespunde exact sumei totale trimise către checkout/plată.

## Fișiere vizate

- `src/pages/ProductDetail.tsx`
- `src/pages/Checkout.tsx`
- `src/features/rentals/rentalsApi.ts`
- posibil un helper nou în `src/lib/` pentru calculul prețului reutilizabil

Nu sunt necesare modificări de bază de date.