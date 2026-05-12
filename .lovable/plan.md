## Plan

Voi ajusta layout-ul chat-ului mobil astfel încât bara de scriere să stea jos, ca în aplicațiile de chat, fără să fie împinsă în mijlocul ecranului când se deschide tastatura.

### Modificări propuse

1. **`src/pages/Messages.tsx`**
   - Înlocuiesc folosirea directă a `visualViewport.height` ca înălțime totală a chat-ului, deoarece pe iOS/SwiftKey poate muta întregul layout sus și lasă spații mari.
   - Pentru mobil, containerul chat-ului va fi `position: fixed` pe tot viewport-ul (`inset-0`), cu `height: 100dvh` și `overflow-hidden`.
   - Adaug un CSS custom property pentru spațiul ocupat de tastatură (`--keyboard-inset`) calculat din diferența dintre `window.innerHeight` și `visualViewport.height + visualViewport.offsetTop`.
   - Acest spațiu va fi folosit doar ca padding jos, nu ca înălțime a întregului chat.

2. **`src/components/messaging/ChatPanel.tsx`**
   - Fac panoul mobil să aibă `min-h-0`, `overflow-hidden` și structură stabilă: header sus, lista de mesaje flexibilă, input jos.
   - Aplic `padding-bottom: var(--keyboard-inset, 0px)` pe wrapper-ul chat-ului, astfel încât input-ul să rămână lipit de tastatură, nu să sară sus.
   - Păstrez comportamentul desktop neschimbat.

3. **`src/components/messaging/MessageInput.tsx`**
   - Fixez input bar-ul ca zonă de jos a chat-ului: `shrink-0`, safe-area support (`env(safe-area-inset-bottom)`) și fără margini/padding care pot crea spațiu inutil.
   - Păstrez fontul de 16px pe mobil pentru a preveni zoom-ul iOS.

### Rezultat așteptat

- Când tastatura este închisă: chat-ul ocupă normal ecranul, input-ul este jos.
- Când tastatura este deschisă: input-ul rămâne imediat deasupra tastaturii, iar lista de mesaje se micșorează/scrollează normal.
- Nu mai apare spațiul alb mare de sub input și input-ul nu mai este împins sus peste ecran.