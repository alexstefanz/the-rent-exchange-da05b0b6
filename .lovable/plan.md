## Problemă

În widget-ul de support (`SupportChatWidget.tsx`), când se deschide o conversație user↔user, se montează `ChatPanel` care afișează:
- `RentalStageStepper` (cele 4 chip-uri: Cerere/Aprobat/Plătit/Predare),
- `TransactionCard` (card-ul cu poza produsului, titlu, perioadă, preț, link "Vezi detalii rezervare").

Ambele sunt mereu expandate și ocupă peste jumătate din înălțimea widget-ului (600px), așa că zona de mesaje rămâne foarte mică.

În plus, fereastra widget-ului e fixată la `lg:w-[400px]` × `min(600px, 100vh-100px)` — destul de strâmtă pentru un chat cu context de rezervare.

## Soluție

### 1. Mărire fereastră widget (doar desktop)

În `SupportChatWidget.tsx` (linia 640–646):
- lățime: `lg:w-[400px]` → `lg:w-[460px]`
- înălțime: `min(600px, calc(100vh - 100px))` → `min(720px, calc(100vh - 80px))`

Mobile rămâne fullscreen (`100dvh`).

### 2. Accordion pentru contextul de rezervare în `ChatPanel`

În `src/components/messaging/ChatPanel.tsx`, când `rentalCtx` există (deci suntem într-un thread legat de o rezervare):
- înlocuiesc blocul curent (stepper + transaction card mereu vizibile) cu un singur header colapsabil de tip accordion:
  - **Închis (default în widget-ul de support)**: o bară compactă cu thumbnail mic al produsului, titlu trunchiat, status badge (ex. "Plătit"/"Finalizată") și `ChevronDown`. Înălțime ~52px.
  - **Deschis**: dezvăluie `RentalStageStepper` + `TransactionCard` exact ca acum.
- Adaug un prop nou opțional `defaultRentalContextOpen?: boolean` (default `true` pentru a păstra comportamentul curent în pagina `/mesaje`). În `SupportChatWidget` îl pasez `false`, ca să fie închis by default în widget — chat-ul ocupă tot spațiul.
- Folosesc componenta deja existentă `Accordion` din `src/components/ui/accordion.tsx` (single, collapsible) ca să rămână în design system.

Rezultat: în widget contextul rezervării este o linie subțire deasupra mesajelor; user-ul îl deschide când vrea să vadă etapele/detaliile, fără să piardă spațiu de chat.

### 3. Restul nu se schimbă

- Pagina `/mesaje` (3 coloane desktop) păstrează cardul deschis by default (nicio regresie vizuală).
- Logica de mesaje, atașamente, presence, read receipts — neatinsă.
- Tab-urile, ticket-urile, fluxul admin — neatinse.

## Fișiere

- `src/components/support/SupportChatWidget.tsx` — măresc panelul desktop și pasez `defaultRentalContextOpen={false}` la `ChatPanel`.
- `src/components/messaging/ChatPanel.tsx` — wrap stepper+TransactionCard într-un `Accordion` controlat de prop nou.

## În afara scope-ului

- Restructurarea `TransactionCard`/`RentalStageStepper`.
- Schimbări pe mobile (rămâne fullscreen).
- Logica ticketelor sau a admin-ului.
