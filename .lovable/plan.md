

## Plan: „Discută cu chiriașul" → deschide pagina de mesaje

### Problemă

În dialogul „Cerere acceptată!" (`AcceptedRentalDialog`), butonul **„Discută cu chiriașul"** deschide un al doilea pop-up (`ChatDialog`) suprapus peste dialog. Utilizatorul vrea să fie dus în pagina dedicată `/mesaje` cu conversația selectată — experiență consistentă cu restul platformei (mesageria split-view desktop / fullscreen mobile).

### Modificare

**`src/components/dashboard/AcceptedRentalDialog.tsx`**

În `handleStartChat`:
- Caut conversația existentă între owner (user curent) și renter pentru produsul respectiv (filtrare corectă: `product_id` + `buyer_id = renter_id` + `owner_id = current user`).
- Dacă există → închid dialogul curent și navighez la `/mesaje?conv={id}` (pagina Messages auto-selectează conversația din query param — logica deja există în `src/pages/Messages.tsx`).
- Dacă nu există → navighez la `/mesaje` simplu (owner-ul nu poate crea conversații conform RLS — comportamentul actual).

Înlocuiesc `window.location.href` cu `useNavigate` pentru tranziție SPA fluidă (fără full reload).

### Curățare cod nefolosit

- Elimin importul `ChatDialog` și state-urile `chatOpen` / `chatConversationId` (nu mai sunt folosite).
- Elimin blocul `<ChatDialog>` din JSX-ul de la final.
- Păstrez `startingChat` pentru loading state pe buton.

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/components/dashboard/AcceptedRentalDialog.tsx` | Înlocuiesc deschiderea `ChatDialog` cu navigare la `/mesaje?conv={id}`; curăț cod nefolosit |

### Rezultat

Click pe „Discută cu chiriașul" închide dialogul „Cerere acceptată" și deschide pagina de mesaje cu conversația respectivă deja selectată — fără pop-up suprapus.

