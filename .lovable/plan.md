## Suport widget: scoatere tab Chat + fix overflow bubble + limită caractere

### 1. Scoatere completă a tabului „Chat" (conversații user↔user) din `src/components/support/SupportChatWidget.tsx`
Rămâne doar fluxul de tickete/suport (ce era pe tabul „Tickete"/„Suport"). Widget-ul se deschide direct pe acel ecran, fără tab switcher.

- Elimin state-ul `activeTab` și `chatSubTab` (împreună cu setterii). Toată ramura `activeTab === "chat"` din JSX dispare, inclusiv:
  - sub-tab-urile „Rezervări / De închiriat"
  - lista de conversații (`sortedConvs.map`)
  - empty state-ul „Nu ai conversații încă"
- Elimin ramura `activeConv ? <ChatPanel … />` din body și state-ul `activeConv` + handlerul `setActiveConv` + `handleBack` pentru conv.
- Elimin tabs header-ul cu cele două butoane Chat / Tickete (lines ~876–927). Body-ul randează direct fluxul existent de tickete (admin inbox / archive / welcome+chat suport).
- Curăț query-urile/derivatele folosite doar pentru chat: `rezervariUnread`, `deInchiriatUnread`, `totalUnread` (folosit pentru badge tab Chat). Pentru `fabBadgeCount` păstrez doar partea de tickete (`adminInboxUnread + adminNewCount` pentru admin, `openTicketsCount` pentru user). `ticketsTabBadge` nu mai e necesar (nu mai există tab).
- `headerTitle` simplificat: scot ramura `activeConv` și „Mesajele mele"; default-ul (când nu e ticket selectat) devine „Inbox suport" (admin) / „Suport Rentli" (user).
- Import-uri neutilizate (ex. `ChatPanel`, `MessageCircle` doar în badge, `Conversation` type, fetcher-ele de conversations) — le scot.

### 2. Fix bubble overflow pe ticket (imaginea 2 cu `@@@@@…`)
Aceeași cauză ca la chat-ul principal: `break-words` nu sparge secvențe lungi fără spațiu.
- În `renderMessageContent` (linia 174): înlocuiesc `whitespace-pre-wrap break-words` cu `whitespace-pre-wrap [overflow-wrap:anywhere]`.
- Adaug `min-w-0` și pe wrapper-ul bubble-ului ticket (`max-w-[80%] …` line 763 și `max-w-[85%]` line 1208) ca să nu poată depăși containerul.

### 3. Limită standard de caractere pentru ticket (1000, ca la chat)
- Import `MAX_MESSAGE_LENGTH` din `@/features/messaging/messagingApi`.
- Pe `<Input>` ticket (line 838) adaug `maxLength={MAX_MESSAGE_LENGTH}`.
- În `handleSendTicketMessage` trunchiez `text.slice(0, MAX_MESSAGE_LENGTH)` ca defensive guard și blochez send-ul dacă depășește.
- Mic counter discret deasupra inputului (apare doar la >80% din limită), identic ca pattern cu MessageInput-ul.

### Verificare
- Widget-ul se deschide direct la fluxul de suport/tickete; nu mai există tab „Chat" și nici sub-tabs „Rezervări/De închiriat".
- Mesaj cu 200× `@` într-un ticket → bubble-ul nu mai sparge layout-ul.
- Inputul nu acceptă peste 1000 caractere; counter-ul apare aproape de limită.