Voi ajusta calendarul din cardul de rezervare astfel:

1. Prima săptămână afișată rămâne săptămâna curentă, cu zilele trecute vizibile dar indisponibile/gri.
2. În luna Mai nu se vor mai afișa rândurile complet inutile din trecut; calendarul va porni vizual de la săptămâna 17–23 Mai.
3. Ziua curentă, 21 Mai, va rămâne evidențiată și selectabilă ca prima zi disponibilă.
4. Zilele 17–20 Mai vor rămâne vizibile, dar indisponibile/gri.
5. După 22 Mai, calendarul va continua natural până în Iunie în același grid de 5 săptămâni, fără al doilea calendar/lună completă dedesubt.
6. Voi elimina `numberOfMonths={2}` și voi folosi afișarea unei singure luni, cu zilele din luna următoare vizibile subtil ca outside days.
7. Voi păstra logica existentă de blocare pentru date trecute și date deja rezervate.

Detalii tehnice:
- Modific doar `src/components/product/PremiumBookingCard.tsx`.
- Setez calendarul să pornească vizual de la luna curentă, dar ascund doar săptămânile complet trecute prin clasa existentă `rdp-hide-past-weeks`.
- Păstrez `disabled={d => isBefore(d, new Date()) || isDateBooked(d, bookedDates)}` ca zilele trecute să nu poată fi închiriate.
- Elimin forțarea celor 2 luni, astfel luna Iunie apare doar subtil în completarea gridului, nu ca al doilea calendar separat.