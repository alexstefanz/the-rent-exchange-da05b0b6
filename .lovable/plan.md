## Diagnoză

Meniul de 3 puncte din header-ul widget-ului de suport are toate cele 3 opțiuni în cod (Marchează rezolvat / Necesită investigații / Anulează ticket), dar **`DropdownMenuContent` din shadcn folosește `z-50`** iar panoul widget-ului are `z-[60]` (fixed). Astfel popoverul portalat e renderat sub panoul widget, iar adminul vede vizibil doar partea de jos a meniului — itemul roșu "Anulează ticket", care iese în afara marginii panoului în jos. De aceea pare că "doar Anulează" funcționează.

În plus, în widget nu se afișează statusul curent al ticketului în header, așa că adminul nu vede confirmarea vizuală că `RESOLVED` / `WAITING_INTERNAL` / `CLOSED` s-au aplicat.

## Schimbări

1. **Fix z-index dropdown** (`src/components/support/SupportChatWidget.tsx`)
   - Pe `<DropdownMenuContent>` adăugăm `className="z-[70] w-56"` ca să fie deasupra panoului widget-ului (`z-[60]`).
   - Verificăm și `AlertDialog`-ul; `AlertDialogContent` shadcn folosește deja `z-50` într-un portal cu overlay propriu, dar pentru consistență adăugăm `z-[80]` pe overlay + content ca să apară peste widget când e nevoie.

2. **Status vizibil în header (admin)** (`src/components/support/SupportChatWidget.tsx`)
   - Sub titlul ticketului (lângă `headerSubtitle`), pentru admin pe ticket activ, afișăm `<StatusPill status={ticketInfo?.status} size="xs" />` ca să se vadă instant noul status după acțiune.
   - Pentru tickete `RESOLVED`/`CLOSED`, StatusPill rămâne afișat (banner-ul "ticket închis" deja apare jos).

3. **Verificare propagare în ERP admin**
   - Mutația `updateOpsTicketField` deja invalidează `opsTickets` în query client; adăugăm și un `refetch` pe AdminTickets nu este necesar — `useAdminTicketsRealtime` ascultă deja schimbările pe `ops_tickets`. Nu mai sunt schimbări de cod necesare pentru ca statusul setat din widget să apară imediat în `/admin/tickete` (cu același status badge: Nou / În lucru / Așteptare client / Așteptare internă / Rezolvat / Închis).

## Fișiere atinse

- `src/components/support/SupportChatWidget.tsx` — z-index dropdown/dialog + StatusPill în header.

## Out of scope

- Nu adăugăm un widget de tickete pe `AdminDashboard` (overview-ul). Lista de tickete este în secțiunea dedicată `/admin/tickete` și deja afișează statusul.
- Niciun status DB nou — folosim mapările existente (RESOLVED, WAITING_INTERNAL, CLOSED) discutate anterior.
