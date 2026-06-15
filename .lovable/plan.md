# Fix: titlu duplicat în notificările toast

## Problema
În screenshot, cardul toast afișează același text de două ori: pe primul rând (titlu, bold) și pe al doilea rând (descriere, gri). Acest lucru se întâmplă pentru toate apelurile vechi de forma `toast({ title: "..." })` fără `description`, inclusiv "Anunț aprobat cu succes" din `AdminApprovals.tsx`.

## Cauza
În `src/hooks/use-toast.ts` (bridge-ul legacy către sistemul `notify`):

```ts
notify.success(message || title || "", title || "Succes");
```

Când lipsește `description`, `message` devine gol și fallback-ul folosește `title`, iar `title` este folosit și ca titlu — deci aceeași frază apare de două ori în card.

## Soluția
O singură modificare, în `src/hooks/use-toast.ts`:

- Dacă `description` lipsește (sau coincide cu `title`), trimit `message=""` și păstrez `title` ca titlu unic al cardului.
- Comportamentul cu titlu + descriere distincte rămâne neschimbat.
- Cazul `variant: "destructive"` rămâne neschimbat (folosește deja `notifyError`).

Pseudo-cod:
```ts
const t = title || "Succes";
const m = message && message !== title ? message : "";
notify.success(m, t);
```

## Scope
- Singur fișier modificat: `src/hooks/use-toast.ts`.
- Nu modific `src/lib/notify.tsx`, cardul vizual, sau apelurile existente — fix-ul este centralizat și acoperă **toate** locurile care încă folosesc `toast({ title })` din shadcn legacy (ListingsPage, ListItem, PublishProduct, ProductPreview, AdminApprovals, HelpCenter, BusinessOnboarding, ProductDetail, UserTickets, Auth, etc.).

## Verificare
După fix, în `/admin/approvals` la aprobarea unui anunț, cardul va afișa doar:
- Titlu: "Anunț aprobat cu succes"
- Fără linie duplicată dedesubt.

Restul toast-urilor care au atât `title` cât și `description` rămân neafectate.
