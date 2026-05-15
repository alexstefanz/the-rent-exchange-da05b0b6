## Obiectiv

Pe `SupportChatWidget` (butonul plutitor portocaliu, vizibil userilor non‑admin):
1. Schimbă iconița FAB de la `Headphones` la `MessageCircle` (bulă de chat clasică).
2. Tab-ul „Chat" devine lista conversațiilor utilizatorului cu chiriași/proprietari (din `/mesaje`), nu FAQ AI.
3. Asistentul AI / FAQ-ul de suport dispare complet din widget. Restul fluxului de tickete rămâne în tab-ul „Tickete".

Adminul își păstrează propriul widget (`AdminSupportWidget`) — nu este atins.

## Scope (un singur fișier)

`src/components/support/SupportChatWidget.tsx`

### Schimbări

**FAB**
- Înlocuiește `Headphones` cu `MessageCircle` în butonul plutitor (păstrează dimensiune, culoare `#F98715`, badge de notificare existent).
- `aria-label` rămâne „Suport" / „Support".

**Tab „Chat" — conținut nou**
- Înlocuiește complet conținutul actual (welcome message + listă FAQ + flux AI assistant) cu o listă compactă a conversațiilor userului.
- Sursă date: `getConversations()` din `@/features/messaging/messagingApi`, gated `enabled: isOpen && !!user && activeTab === "chat"`, `refetchInterval: 30000`.
- Sub-tabs „Rezervări" (`buyer_id === userId`) / „De închiriat" (`owner_id === userId`) — pattern identic cu `ConversationList.tsx` (pill-uri rotunde, count unread per tab).
- Fiecare item: avatar + nume celălalt user + ultimul mesaj (truncate) + ora + badge unread.
- Click pe item → `navigate(\`/mesaje?conversation=\${conv.id}\`)` și închide widget-ul (`setIsOpen(false)`). Nu deschidem chat in‑widget — reutilizăm pagina existentă `/mesaje`.
- Empty state: „Nu ai conversații încă" / „No conversations yet" cu icon `MessageCircle`.
- Loading: spinner `Loader2`.

**Tab „Tickete" — neschimbat**
- Păstrează lista de tickete + click → deschide conversația ticketului in‑widget (flux existent `ticketId` / `fetchUserTicketMessages` / `addUserTicketMessage`).
- Buton „+" din header → creează ticket nou direct, fără pre‑filtrare AI: deschide imediat un text input gol (input + send + atașament) care la prima trimitere apelează `createUserTicket` cu titlu derivat din primul mesaj (primii ~60 char) și apoi `addUserTicketMessage`.

**Cod eliminat**
- Constanta `CHAT_URL` și tot fluxul fetch către `support-ai-chat`.
- Importul `SUPPORT_FAQ` și UI-ul de listă FAQ.
- Stările `aiPhase`, `aiMessages`, `streamingText`, `selectedFaq` și handler-ele aferente (`handleSelectFaq`, `handleSendAi`, `handleEscalate`, etc.).
- Edge function `support-ai-chat` rămâne deployed (nu o ștergem acum — out of scope), dar nu mai e apelată din UI.

### Detalii tehnice

- Import nou: `import { useNavigate } from "react-router-dom";` + `import { getConversations, type Conversation } from "@/features/messaging/messagingApi";`
- Lucide: scoatem `Headphones`, `Bot`, `Sparkles`, `ChevronRight` (dacă rămân nefolosite); adăugăm `MessageCircle`.
- Header widget: titlul „Suport Rentli" rămâne, sub-text „Online" rămâne.
- Stilistică: aceleași tokens (`primary`, `bg-primary/10`, rounded-full pills, 12px radius).
- Bilingv via `t(ro, en)` existent.

### Out of scope
- Nu modificăm pagina `/mesaje`, `ConversationList`, `ChatPanel`.
- Nu modificăm tabela `ops_tickets` sau RLS.
- Nu ștergem edge function `support-ai-chat`.
- Nu modificăm `AdminSupportWidget` sau `MobileDrawer`.

## Verificare

- Build pass.
- FAB arată iconiță chat (bulă) pe portocaliu.
- Click FAB → tab „Chat" activ → vezi lista conversațiilor reale.
- Click pe o conversație → navighează la `/mesaje?conversation=…` și widget-ul se închide.
- Click „Tickete" → lista ticketelor; click pe ticket → conversație ticket in‑widget; „+" → creare ticket nou.
