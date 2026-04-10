

## Plan: Inversare ordine grafice în Admin Analytics

Schimb simplu de ordine în grid-ul de grafice din `AdminAnalytics.tsx`:
- **Distribuția Rezervărilor** (PieChart) → mută în stânga (primul în grid)
- **Tendințe Lunare** (BarChart) → mută în dreapta (al doilea în grid)

### Fișier afectat
- `src/pages/admin/AdminAnalytics.tsx` — swap blocurile de cod între liniile 140-168 (Tendințe Lunare) și 170-217 (Distribuția Rezervărilor)

