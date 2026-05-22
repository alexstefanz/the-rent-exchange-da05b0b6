## Tranziție push smooth între chat și lista de conversații (mobil)

### Problema actuală
Când utilizatorul apasă „back" în chat pe mobil, containerul fullscreen al chat-ului iese cu `animate-slide-out-right`, dar lista de conversații nu este montată în spatele lui — apare un flash alb ~280ms până când `setSelectedConversation(null)` re-randează lista.

### Soluție
Randăm **ambele** panouri simultan în timpul tranziției:
- Lista de conversații rămâne montată dedesubt (sau intră din stânga cu `slide-in-left`)
- Chat-ul iese deasupra cu `slide-out-right`

Astfel utilizatorul vede conversațiile „dezvăluite" în timp ce chat-ul alunecă spre dreapta — efect push iOS-style, fără flash alb.

### Modificări

**1. `tailwind.config.ts`**
- Adaug keyframes `slide-in-left` (translateX -30% → 0, cu fade opacity 0.6 → 1) — listă care „revine" din stânga, ușor decalată, ca în iOS push back.
- Păstrez `slide-out-right` existent pentru chat.
- Durate aliniate la 280ms ease-out forwards.

**2. `src/pages/Messages.tsx`** (ramura mobile fullscreen chat)
- Când `selectedConversation` există ȘI `!isDesktop`, în loc să returnez doar containerul chat, returnez un wrapper care conține:
  - Lista de conversații (Navbar + ConversationList + Footer wrapper, exact ca ramura „mobile list") **dedesubt**, cu `animate-slide-in-left` activ doar când `isClosing`.
  - Containerul chat fullscreen `fixed inset-0 z-50` deasupra, cu `animate-slide-in-right` la deschidere și `animate-slide-out-right` la închidere.
- `handleCloseAnimationEnd` rămâne identic: la final demontează chat-ul și curăță `?conv=`.
- Lista de dedesubt nu trebuie să fie interactivă în timpul tranziției (`pointer-events-none` când `isClosing`) ca să nu primească tap-uri accidentale.

**3. `src/components/profile/MessagesTab.tsx`**
- Același pattern: în ramura mobile cu `selectedConversation`, randez `ConversationList` ca fundal + `ChatPanel` overlay cu animația slide-out la `isClosing`.

### Detalii tehnice
- `transform-gpu will-change-transform` pe ambele panouri pentru fluiditate 60fps.
- Lista de fundal nu se animează la deschiderea chat-ului (doar la închidere), ca să nu apară mișcare în plus când utilizatorul intră într-o conversație.
- Nu se modifică `ChatPanel`, `ChatHeader`, `ConversationList`, sau logica backend.

### Fișiere atinse
- `tailwind.config.ts`
- `src/pages/Messages.tsx`
- `src/components/profile/MessagesTab.tsx`
