## Notificare vizuală pe cardurile „chiriaș" și „proprietar" din My Account

### Scope
Modific doar componenta `src/components/profile/dashboard/QuickActions.tsx`. Cele două carduri vizate sunt:
- „Închirierile mele" (rol chiriaș) — badge `activeRentalsAsRenter`
- „Cereri primite" (rol proprietar) — badge `activeRentalsAsOwner`

Cardurile „Mesaje" și „Câștiguri" rămân neschimbate (nu sunt „cereri noi").

### Comportament
Când `badge > 0` pe unul din cele două carduri vizate, cardul intră în starea „notificare":

- Fundalul cardului devine portocaliu (`#F59E0B`, hover `#F98715`), cu shadow ușor mai pronunțat.
- Iconița (cercul interior) → fundal `bg-white/20`, iar `Icon` devine alb.
- Textul label (ex. „Închirierile mele" / „Cereri primite") → alb, semibold.
- Cercul cu numărul (badge-ul mic, dreapta-sus pe iconiță) → fundal alb, text negru bold, fără shadow roșu (înlocuiește varianta `bg-destructive`).
- Tranziție smooth pe culoare/shadow la hover.

Când `badge === 0`, cardul rămâne exact cum este azi (fundal `bg-card`, badge ascuns).

### Implementare tehnică
În `QuickActions.tsx`:
- Adaug prop `highlight?: boolean` pe componenta `Secondary`. Calculat ca `!!badge && badge > 0`, dar se setează doar pentru cele două carduri vizate (transmis explicit din părinte, nu derivat automat — astfel „Mesaje" nu se colorează niciodată în portocaliu).
- Aplic clase condiționate prin `cn(...)`:
  - container: `highlight ? "bg-[#F59E0B] hover:bg-[#F98715] border-transparent text-white shadow-md" : "bg-card hover:border-primary/40 hover:shadow-sm"`
  - cerc iconiță: `highlight ? "bg-white/20" : "bg-muted group-hover:bg-primary/10"`
  - Icon: `highlight ? "text-white" : "text-foreground group-hover:text-primary"`
  - badge cifre: `highlight ? "bg-white text-black" : "bg-destructive text-destructive-foreground"`
- Restul markup-ului rămâne identic. Nu se atinge logica de date, hook-uri sau alte componente.

### Out of scope
- Nu modific `useAccountDashboard` sau orice query.
- Nu modific celelalte carduri (Mesaje, Câștiguri, CTA Adaugă produs).
- Nu modific stiluri globale / tokens.
