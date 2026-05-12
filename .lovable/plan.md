## Scop
În lista de conversații (`/mesaje`), mesajele necitite trebuie să fie evident diferite: primele în listă, cu text bold și un mic accent de culoare (primary).

## Stare curentă
`src/components/messaging/ConversationList.tsx` deja împarte lista în două secțiuni: „Necitite" și „Citite", iar necititele apar primele. Lipsește însă diferențierea vizuală — titlul produsului și numele utilizatorului nu sunt bold, fundalul e neutru, iar accentul de culoare lipsește. În screenshot apare doar antetul „CITITE" pentru că nu există conversații necitite în tab-ul curent.

## Modificări (un singur fișier: `src/components/messaging/ConversationList.tsx`)

1. În `renderItem`, adaugă o variabilă `isUnread = (conv.unread_count || 0) > 0`.

2. Pe `<button>` adaugă, când `isUnread`:
   - `bg-primary/5` (subtle tint)
   - `border-l-2 border-primary` (accent vertical stânga)
   - menține `bg-muted` pentru selectat (selected wins)

3. Titlu produs (linia 73): când `isUnread` → `font-bold text-foreground`; altfel rămâne `font-medium`.

4. Nume utilizator (linia 90): când `isUnread` → `text-foreground font-medium`; altfel rămâne `text-muted-foreground`.

5. Timestamp (linia 78): când `isUnread` → `text-primary font-semibold`; altfel rămâne `text-muted-foreground`.

6. Badge contor (linia 104): schimbă `variant="default"` ca să folosească `bg-primary text-primary-foreground` (default deja face asta — dar verifică). Păstrează.

7. Sortare în interiorul fiecărei secțiuni: sortează `unread` și `read` descrescător după `last_message?.created_at` (sau `updated_at`) ca să fie mereu cele mai recente sus.

8. Antetul secțiunii „Necitite" (linia 155): schimbă culoarea din `text-muted-foreground` în `text-primary` pentru micul accent vizual.

## Note
- Folosim doar token-urile design system (`primary`, `foreground`, `muted-foreground`) — fără culori hardcodate.
- Nicio modificare backend / API; doar prezentare.
- Nu se atinge logica de marcare ca citit (rămâne ca în `ChatPanel`).
