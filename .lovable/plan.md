## Probleme de rezolvat

1. **Buton ← invizibil** în header-ul ticketului (text alb pe fundal portocaliu, fără contrast).
2. **Reopen widget = sare în ultimul ticket** — `ticketId` e citit din `localStorage` la mount și widget-ul deschide automat conversația veche în loc să arate lista.
3. **Click pe o conversație user↔user te scoate din widget** și navighează la `/mesaje?conv=...`. Trebuie să se deschidă INTERN, în aceeași fereastră, cu funcționalitate completă (ChatPanel real).
4. **Tab Tickete** — fluxul de "ticket nou" trebuie schimbat în stilul Hostico: când nu există ticket activ, deschide direct un chat cu un mesaj prescris de bun-venit din partea echipei și se scrie direct cu adminul. Fără departamente, fără pasul de „compose + Anulează / Trimite".

## Plan de implementare (doar `SupportChatWidget.tsx`)

### 1. Fix back button
- Înlocuiesc `←` text cu `<ArrowLeft className="h-4 w-4" />` din lucide-react.
- Container: `h-8 w-8 rounded-full` cu `bg-primary-foreground/15 hover:bg-primary-foreground/25` pe mobil (header portocaliu) și `hover:bg-secondary` pe desktop. Iconița moștenește `currentColor`, deci e vizibilă pe ambele teme ale header-ului.
- Adaug `aria-label` traductibil.

### 2. Reopen → listă, nu ultima conversație
- `ticketId` devine pur in-memory (`useState<string | null>(null)`) — nu mai citesc din `localStorage` la init.
- Elimin `STORAGE_KEY`, `localStorage.setItem/removeItem` din `handleSelectTicket`, `handleCreateTicket`, `handleBackToList`, și din `useQuery(supportTicketInfo)`.
- La `setIsOpen(false)` resetez `ticketId`, `activeConvId`, `activeTab = "chat"`, `isComposingTicket = false` (deja există un `useEffect`, îl extind).
- Rezultat: orice reopen pornește din lista chat-urilor.

### 3. Chat user↔user inline (fără redirect la `/mesaje`)
- Adaug state nou: `activeConvId: string | null` și păstrez `Conversation` selectată într-un state local `activeConv`.
- `handleOpenConversation(conv)` setează state-ul în loc să facă `navigate(...)` și să închidă widget-ul.
- Când `activeConvId` e setat, randez în zona body `<ChatPanel ... onBack={() => setActiveConvId(null)} />` în loc de lista de conversații.
- Header-ul widget-ului afișează numele/avatarul `other_user`, butonul ← apelează același `setActiveConvId(null)` (nu mai apare ChatHeader-ul intern al ChatPanel — pasăm o variantă fără header propriu sau îi ascundem header-ul cu un wrapper). Cea mai simplă cale: continuăm să folosim header-ul widget-ului (deja există) și ascundem ChatHeader-ul intern via prop nou `hideHeader` în `ChatPanel`, sau nu pasăm `onBack` și lăsăm ChatPanel să-și afișeze header-ul propriu (dublu header) — **alegem hideHeader** ca să rămână UI curat.
- Înălțime: ChatPanel deja folosește `flex-1 min-h-0`, se va comporta corect în containerul widget-ului (`flex-col` cu `100dvh`/`600px`).
- **Acceptare**: send/receive realtime, atașamente imagine, presence/typing, RentalStageStepper și TransactionCard funcționează la fel ca pe `/mesaje`.

### 4. Tickete — flux „direct cu echipa"
- Elimin starea `isComposingTicket`, butonul `+`, ecranul de compose și `handleStartNewTicket`/`handleCreateTicket` în varianta cu textarea separată.
- Logică nouă pentru tab-ul Tickete:
  - Dacă userul **are deja un ticket activ deschis** (status ≠ CLOSED/RESOLVED), deschid direct cel mai recent. Listă de tickete arhivate apare sub forma unui mic dropdown „Conversații anterioare" (păstrăm lista existentă, dar comprimată).
  - Dacă **nu are niciun ticket activ**, creez automat la primul mesaj trimis de user un ticket cu `category_group: "USER"`, `category_type: "GENERAL_INQUIRY"`, `title = primele 60 chars din mesaj`. Până atunci ecranul arată:
    - Avatar „R" + nume „Echipa Rentli" + indicator verde (deja există).
    - Bubble prescris (system, partea stângă):
      > „Bună! Suntem aici să te ajutăm. Scrie-ne mesajul tău și un membru al echipei Rentli îți va răspunde cât mai curând."
      (RO/EN via `t()`).
    - Input identic cu cel din chatul de ticket (text + attach imagine + Send).
- La trimiterea primului mesaj: dacă nu există `ticketId`, apelez `createUserTicket(...)` apoi `addUserTicketMessage(...)` cu textul, setez `ticketId`, invalidez `userTickets` + `userTicketsOpenCount` + `supportChatMessages`.
- Lista veche de tickete rămâne accesibilă printr-un mic link în antet `„Vezi tickete anterioare ({n})"` care toggle-uiește un panou de listă în loc de chat.

### Detalii tehnice
- Importuri noi: `ArrowLeft` din `lucide-react`, `ChatPanel` din `@/components/messaging/ChatPanel`.
- Modific `ChatPanel` doar pentru a accepta un prop opțional `hideHeader?: boolean` care, când e `true`, nu randează `<ChatHeader />` (păstrăm comportamentul actual când lipsește).
- Header-ul widget-ului calculează titlul dinamic:
  - `activeConvId` → numele celuilalt user + titlu produs ca subtitlu.
  - `ticketId` → „Suport Rentli" + `public_id`.
  - altfel → „Mesajele mele" / „Tickete".
- Butonul ← apare ori de câte ori `activeConvId || ticketId || (activeTab==='tickets' && showArchive)`.
- Eliminat: tot codul referitor la `STORAGE_KEY`, `isComposingTicket`, `newTicketText`, `isCreatingTicket`, `handleStartNewTicket`, `handleCreateTicket` (varianta veche), butonul `+` din header.

### Out of scope
- `src/pages/Messages.tsx`, `ConversationList`, schema RLS, edge functions, AdminSupportWidget.
- Departamentele (Vânzări/Tehnic) nu se implementează — confirmat de user.
