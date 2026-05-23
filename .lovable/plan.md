# Ascunde „Toate produsele disponibile" pe mobil

În `src/pages/Search.tsx` (linia 93), paragraful de sub titlu afișează fie „Rezultate pentru …", fie „Toate produsele disponibile". Adaug `hidden md:block` pe acest `<p>` ca să dispară pe mobil/tablet mic și să rămână vizibil pe desktop.

Titlul „Toate produsele" rămâne afișat normal.
