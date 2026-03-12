

## Fix: Butoane portocalii aliniate cu restul contentului

### Problema
Butonul activ are `data-[state=active]:scale-105` care il mareste cu 5%, facand-ul sa iasa din container pe stanga/dreapta.

### Solutie
In `src/pages/Profile.tsx`, linia 127:
- Elimin `data-[state=active]:scale-105` (cauza principala a overflow-ului)
- Inlocuiesc cu un efect vizual care nu afecteaza layout-ul (ex: `ring-2 ring-white/50` sau doar shadow mai pronuntat)
- Pastrez `gap-3`, `grid-cols-2 lg:grid-cols-4` — identic cu BalanceCard

Un singur fisier modificat, o singura linie.

