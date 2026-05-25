## Fix bară accessory deasupra tastaturii (chat mobil)

### Modificări

**1. `src/components/messaging/MessageInput.tsx`**
Pe `<Textarea>` adaug atributele care fac Safari iOS să nu mai afișeze bara AutoFill (cheie/card/locație/✓):
- `name="message"`
- `autoComplete="off"`
- `autoCorrect="on"`
- `autoCapitalize="sentences"`
- `spellCheck={true}`
- `enterKeyHint="send"`
- `inputMode="text"`

**2. `src/components/support/center/TicketChat.tsx`**
Aceleași atribute pe inputul de mesaj din ticket chat.

**3. `src/pages/Messages.tsx` — fix înălțime chat mobil**
- Refactor `useKeyboardInset` → `useChatViewport`: scrie `--chat-h` (în px) egal cu `visualViewport.height` la fiecare `resize`/`scroll`. Fallback `100dvh`.
- Containerul fullscreen chat mobil:
  - `style.height` = `var(--chat-h, 100dvh)` (înlocuiește `100dvh` fix)
  - elimin `paddingBottom: var(--keyboard-inset)` (devine inutil)
- Rezultat: pe Chrome iOS, unde bara ↑↓✓ nu poate fi ascunsă, inputul stă fix deasupra ei fără gap.

**4. `src/components/profile/MessagesTab.tsx`**
Aplic același hook + `style={{ height: "var(--chat-h, 100dvh)" }}` pe overlay-ul mobil fullscreen.

### Note
- Bara nativă Chrome iOS rămâne (Apple nu permite ascunderea ei din web), dar nu se va mai suprapune peste input.
- Bara Safari AutoFill va dispărea la majoritatea utilizatorilor după aceste atribute.
- Zero modificări de business logic, validări, layout desktop.
