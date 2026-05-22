## Problemă identificată

**1. Butonul back nu funcționează consistent pe mobil**

În `src/pages/Messages.tsx`, când se deschide o conversație prin URL (`/mesaje?conv=...`), `handleBack` doar resetează `selectedConversation` la `null`, dar **lasă parametrul `?conv` în URL**. Un `useEffect` urmărește `searchParams` și, dacă găsește `conv`, redeschide imediat conversația — efectul vizibil este că butonul "nu reacționează" prima dată (de fapt închide și redeschide instant). După o navigare ulterioară parametrul dispare și back-ul pare să funcționeze.

**2. Butonul "Vezi produs" e prea lat pe mobil**

În `src/components/messaging/ChatHeader.tsx`, butonul portocaliu cu text complet ocupă mult spațiu și împinge numele utilizatorului în truncare ("Al…").

## Modificări

### `src/pages/Messages.tsx` — `handleBack`
- La închiderea chatului pe mobil, șterge și parametrul `conv` din URL (folosind `setSearchParams({}, { replace: true })` sau `navigate("/mesaje", { replace: true })`) **înainte** de `setSelectedConversation(null)`, ca `useEffect`-ul de sincronizare să nu redeschidă conversația.
- Păstrează comportamentul `returnTo` existent (acela navighează în altă parte, deci nu e afectat).

### `src/components/messaging/ChatHeader.tsx` — buton "Vezi produs"
- Pe mobil: doar iconița `Package` într-un buton compact (`size="icon"`, `h-9 w-9`), fără text, cu `aria-label="Vezi produs"` și tooltip.
- Pe desktop (`lg:`): textul "Vezi produs" rămâne vizibil ca acum.
- Implementare: folosește două variante condiționate prin `hidden lg:inline-flex` / `lg:hidden`, sau o singură instanță cu `<span className="hidden lg:inline">Vezi produs</span>` și icon vizibil mereu, cu padding redus pe mobil (`px-2.5 lg:px-3`).
- Eliminăm `mr-1.5` de pe icon când textul e ascuns.

Rezultat: numele "Oana Ciuhureanu" devine vizibil integral lângă avatar pe ecrane înguste, iar acțiunea "Vezi produs" rămâne accesibilă ca iconiță portocalie.

### Niciun alt fișier modificat
Nu sunt necesare schimbări de backend, RLS, sau în `ChatPanel.tsx` / `MessagesTab.tsx`.
