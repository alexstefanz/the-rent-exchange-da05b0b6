## Modificare TrustBarPremium (mobil)

În `src/components/home/TrustBarPremium.tsx`, schimb gridul de la 1 coloană pe mobil → 2 coloane, păstrând 4 pe desktop.

**Schimbare:**
- `grid-cols-1 md:grid-cols-4` → `grid-cols-2 md:grid-cols-4`
- ajustez padding/gap pentru a încăpea bine pe 390px: `gap-2` rămâne, iar pe item reduc `px-3 py-2.5` la `px-2.5 py-2` pe mobil
- icon container rămâne `h-10 w-10`, dar pe mobil îl fac `h-9 w-9` ca să dea aer textului
- textul valoare rămâne `text-sm md:text-base`, label `text-[11px]` — OK pentru 2 coloane
- adaug `min-w-0` și `truncate` unde e nevoie ca să prevină overflow pe label-uri lungi ("Echipă reală 7 zile pe săptămână")
- pentru label-urile lungi, permit 2 linii (`line-clamp-2`) în loc de truncate, ca să nu pierdem info

Restul (containerul card, shadow, hover) rămâne neschimbat.