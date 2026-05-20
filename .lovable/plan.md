## Scop

1. **Desktop** — Înlocuim butonul rotund portocaliu de chat (FAB) cu un card-pill „Live Help · Online" similar primei imagini (avatar + status dot verde + titlu + subtitlu „Bună! Te putem ajuta?").
2. **Mobil** — Ascundem complet FAB-ul de suport, iar în pagina `/mesaje` adăugăm un al treilea tab **„Suport"** lângă „Rezervări" / „De Închiriat", care randează același flux de tickete folosit azi în widget (listă tickete + buton „Ticket nou" + chat ticket).

## Comportament

### Desktop FAB (card „Live Help")
- Container fix `bottom-6 right-6`, doar `lg:flex` (ascuns sub `lg`).
- Card alb cu shadow-lg, rounded-2xl, padding ~12-14px:
  - Avatar 36-40px (poză agent — folosim un asset existent din `src/assets/` cu o reprezentantă; dacă nu există, generăm un avatar realist și îl importăm).
  - Punct status verde `bg-green-500` ring-2 alb, poziționat top-left peste avatar.
  - Text dreapta:
    - Rând 1: `Live Help` (bold) + chip mic verde „Online".
    - Rând 2: `Bună! Te putem ajuta?` (text-muted-foreground, text-sm).
- Pe hover: scale subtil (`hover:scale-[1.02]`) + shadow mai pronunțat.
- Badge cu `fabBadgeCount` rămâne (cerc roșu mic în colț top-right) când există mesaje necitite.
- Click → `setIsOpen(true)` (același comportament).

### FAB mobil
- Se elimină varianta mobilă a butonului flotant (clasă `bottom-20` + `flex` pe sub `lg`). Widget-ul pe mobil se va deschide DOAR din noul tab „Suport" în pagina `/mesaje`. Restul (rute non-`/mesaje`) — fără FAB pe mobil.

### Tab „Suport" în `/mesaje` (mobil)
- În `ConversationList.tsx`, `TabsList` capătă a treia opțiune `value="suport"` cu icon `LifeBuoy` + text „Suport" / „Support".
- Când `activeTab === "suport"`, în loc de lista de conversații, se randează un panou nou `SupportTabPanel`:
  - Listă tickete existente (din `useSupportTickets` deja folosit în `SupportChatWidget`) cu status badge, ultimul mesaj, timp.
  - Buton primary fix sus „Ticket nou" → deschide formular inline (subiect + descriere + atașament opțional), exact ca în widget.
  - Tap pe un ticket deschide chat-ul ticketului (folosim `TicketChat` deja existent în `src/components/support/center/TicketChat.tsx`) full-screen în interiorul layout-ului mobil (fluxul actual de `Messages.tsx` cu split-view).
- Tabul „Suport" e vizibil pe orice formă (nu îl ascundem pe desktop — e consistent), dar pe desktop suportul rămâne accesibil și prin card-ul „Live Help".
- Badge roșu pe tab cu numărul total de mesaje suport necitite (`supportUnread` din același hook).

## Implementare tehnică

**Fișiere modificate:**

1. `src/components/support/SupportChatWidget.tsx`
   - Înlocuiește blocul FAB (`{!isOpen && (...)}`) cu un nou subcomponent `LiveHelpCard` afișat `hidden lg:flex` (cu badge unread păstrat).
   - Eliminăm complet apariția pe mobil (`< lg`).
   - Restul panoului (când `isOpen`) rămâne neschimbat.

2. `src/components/messaging/ConversationList.tsx`
   - Adaugă al 3-lea `TabsTrigger value="suport"` cu icon `LifeBuoy` + badge `supportUnread`.
   - Props noi: `supportUnread?: number`.
   - Când `activeTab === "suport"`, NU randa lista convorbirilor — randa `<SupportTabPanel />` (componentă nouă) sau lasă conditional în `Messages.tsx`.

3. `src/pages/Messages.tsx`
   - Adaugă state pentru suport (ticket selectat).
   - Când `activeTab === "suport"`, înlocuiește panoul de conversații cu noul `SupportTabPanel`.
   - Tipăm `activeTab: "rezervari" | "de-inchiriat" | "suport"`.

4. **Nou:** `src/components/support/SupportTabPanel.tsx`
   - Extras din logica existentă a widget-ului: listă tickete, formular ticket nou, deschiderea chat-ului. Reutilizează cât mai mult din helperele deja existente în `SupportChatWidget.tsx` (sau extrage într-un `useSupportTickets` separat dacă deja există — verificăm).
   - Layout responsive: pe mobil ocupă tot panoul listei; pe desktop, când pagina e afișată, randa la fel ca celelalte taburi.

5. **Asset nou (opțional):** `src/assets/live-help-avatar.jpg` (avatar realist agent) — dacă nu există ceva potrivit deja, îl generăm cu `imagegen` (foto profesional, fundal neutru, headshot).

## Ce NU se modifică

- Funcționalitatea de tickete (creare, mesagerie, hooks) — doar mutată/împărtășită.
- Conversațiile chiriaș-proprietar — rămân pe taburile existente.
- Logica de notificări/badge — folosim aceleași hookuri/contoare deja existente.
- Restul paginii `Messages.tsx` (split view desktop) — neschimbat în afară de noul tab.
