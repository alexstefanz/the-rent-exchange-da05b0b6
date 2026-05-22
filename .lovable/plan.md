# Fix focus pe inputul de chat după Enter

## Problemă
După ce dau Enter și mesajul se trimite, textarea „Scrie un mesaj…" rămâne fără focus, așa că trebuie click din nou ca să continui scrisul.

## Cauză
În `src/components/messaging/MessageInput.tsx`, la trimitere se setează `sending=true` → atributul `disabled` pe `<Textarea>` devine true → browserul scoate focus-ul. După finalul `handleSend`, `sending` redevine false dar textarea nu mai primește focus automat.

## Soluție
În blocul `finally` din `handleSend`, după `setSending(false)`, refocalizez textarea prin `textareaRef.current?.focus()` (învelit într-un `requestAnimationFrame` ca să ruleze după re-render-ul care reactivează inputul).

## Fișier editat
- `src/components/messaging/MessageInput.tsx`
