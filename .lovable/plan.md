## Modificare SupportChatWidget

Adaugă două tab-uri în interiorul panoului flotant de suport (FAB-ul rămâne neschimbat):

### 1. Tab "Chat" (default)
- Păstrează tot comportamentul actual: FAQ → AI assistant → vizualizare conversație ticket
- Activ la deschiderea widget-ului

### 2. Tab "Tickete" (nou)
- Listă cu ticketele utilizatorului curent (similar screenshot-ului de referință)
- Fiecare item: punct portocaliu, cod `TCK-XXXXXX`, status pill ("Nou"/"În lucru"/etc.), titlu, dată formatată
- Badge mic cu numărul de tickete deschise lângă label-ul tabului când > 0
- Empty state: "Nu ai tickete deschise" / "No open tickets"
- Click pe ticket → setează `ticketId`+`ticketPublicId`, persistă în localStorage, comută înapoi pe tabul "Chat" → se randează vizualizarea conversației existente

### Detalii tehnice
- State nou: `activeTab: "chat" | "tickets"`, reset la "chat" când widget-ul se închide
- Date din `fetchUserTickets()` (`@/features/tickets/userTicketsApi`), gated `enabled: isOpen && activeTab === "tickets" && !!user`, `refetchInterval: 15000`
- Folosește `StatusPill` existent din `src/components/support/center/StatusPill.tsx`
- Tab-urile folosesc design tokens existente (primary `#F59E0B`, rounded-full pills, `bg-primary/10` inactiv, `bg-primary text-primary-foreground` activ) — fără `Tabs` shadcn pentru a păstra stilul minimal al widget-ului
- Butonul "+" din header (creare conversație nouă) funcționează identic indiferent de tab
- Label-uri bilingve via `t()`

### În afara scopului
- Fără modificări de backend / API (folosește `fetchUserTickets` + RLS `ops_tickets` existente)
- FAB icon, poziție și flow-ul AI chat existent rămân neschimbate