Voi face calendarul din `PremiumBookingCard` să afișeze exact 6 săptămâni continue, de la săptămâna 17–23 Mai până la săptămâna 22–28 Iunie (deci acoperă până pe 27 Iunie), fără rândurile de săptămâni complet trecute.

Implementare:
1. În `src/components/product/PremiumBookingCard.tsx`:
   - Adaug `numberOfMonths={2}` + `fixedWeeks` ca să avem suficiente rânduri (6 pe lună).
   - Suprascriu `classNames.months` cu `flex flex-col gap-0 w-full` ca luna Iunie să stea sub Mai (nu lateral) și fără spațiu vizibil.
   - Ascund captionul/headerul lunii Iunie ca să nu pară un al doilea calendar separat — rămâne doar continuitatea gridului.
2. În `src/index.css`, extind regulile `.rdp-hide-past-weeks` ca să:
   - Ascundă în continuare săptămânile complet din trecut (regulă existentă — elimină rândurile pentru 26 Apr și 3 Mai și 10 Mai).
   - Ascundă prima săptămână din luna Iunie (cea care duplică 31 Mai – 6 Iun, deja prezentă în Mai).
   - Ascundă ultima săptămână a lui Iunie (28 Iun – 4 Iul) ca să se termine vizual la 27 Iunie.
3. Săptămâna curentă (17–23 Mai) rămâne vizibilă cu 17–20 indisponibile (gri) iar 21 Mai marcat ca azi, conform comportamentului existent prin `disabled` și `modifiers.today`.

Rezultat vizual:
- Rândurile afișate: 17–23 Mai, 24–30 Mai, 31 Mai–6 Iun, 7–13 Iun, 14–20 Iun, 21–27 Iun → exact 6 săptămâni.
- Un singur grid continuu, fără al doilea header de lună.