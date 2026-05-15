## Problema

Badge-ul de categorie (ex. "Electronice") apare lățit pe toată cardul produsului în loc să fie doar cât textul.

Cauza: în `src/components/products/ProductCard.tsx`, container-ul părinte este `flex flex-col`, iar `align-items: stretch` (default flex) întinde span-ul pe toată lățimea, chiar dacă are `inline-block`.

## Soluție

În `src/components/products/ProductCard.tsx`, pe ambele instanțe ale badge-ului de categorie (liniile ~109 și ~181):

- Înlocuiesc `max-w-full` cu `w-fit self-start` pe `<span>`-ul de categorie.

Rezultat: background-ul portocaliu va avea exact lățimea textului. `truncate` rămâne pentru siguranță la nume foarte lungi.

Nicio altă modificare vizuală/funcțională.