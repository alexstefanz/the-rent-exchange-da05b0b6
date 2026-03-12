

## Bug: Dashboard cards nu funcționează — `getTabFromHash` validează doar tab-urile vizibile

### Cauza problemei

Pe linia 69 din `Profile.tsx`, `getTabFromHash` verifică hash-ul doar în array-ul `TABS` (care acum conține doar 4 tab-uri: contul-meu, cereri, inchirieri, anunturi). Când dai click pe un card din dashboard (ex: `#mesaje`, `#favorite`, `#castiguri`), hash-ul NU se găsește în `TABS`, deci funcția returnează default-ul `"contul-meu"` — și conținutul tab-ului nu se schimbă.

### Soluție

În `src/pages/Profile.tsx`:

1. Creez o listă separată cu TOATE ID-urile valide de tab (inclusiv cele ascunse): `contul-meu`, `cereri`, `inchirieri`, `anunturi`, `favorite`, `mesaje`, `castiguri`, `recenzii`, `notificari`.
2. Modific `getTabFromHash` să valideze hash-ul contra listei complete, nu doar contra `TABS`.

Un singur fișier modificat, fix minimal.

