## Cauza

Pe iOS Safari, când un input/textarea are font-size sub 16px, browser-ul face automat zoom la focus. După deschiderea tastaturii, `100dvh` se micșorează corect, dar pagina rămâne zoom-ată și apar "spații" (de fapt: scroll offset + viewport zoom-at peste layout-ul recalculat). Textarea-ul din `MessageInput.tsx` și `ChatDialog.tsx` folosește `text-sm` (14px), deci e cauza zoom-ului.

În plus, înălțimea wrapper-ului mobil (`h-[100dvh]`) nu se ajustează la `visualViewport` când tastatura virtuală e deschisă pe iOS mai vechi — ceea ce poate lăsa input-ul să "plutească" în mijloc cu spațiu sub el.

## Modificări

### 1. `src/components/messaging/MessageInput.tsx`
- Schimbă clasa textarea de la `text-sm` la `text-base md:text-sm` (16px pe mobil, 14px pe desktop). Asta previne zoom-ul iOS la focus.

### 2. `src/components/messaging/ChatDialog.tsx`
- Aceeași corectare pe textarea (16px pe mobil).

### 3. `src/pages/Messages.tsx` — wrapper chat mobil
- Înlocuiește `h-[100dvh]` cu o combinație care urmărește `visualViewport`:
  - Adaug un mic hook/efect care setează `--app-height` (pe element) la `window.visualViewport?.height` și ascultă `resize`/`scroll` pe `visualViewport`.
  - Wrapper devine `style={{ height: 'var(--app-height, 100dvh)' }}` cu `overflow-hidden`.
- Asigură `overscroll-behavior: contain` și `touch-action: pan-y` pe containerul de mesaje pentru a evita rubber-band.

### 4. `src/components/messaging/ChatPanel.tsx` (verificare)
- Confirm că lista de mesaje folosește `flex-1 min-h-0 overflow-y-auto` (necesar ca flex-ul să nu depășească wrapper-ul). Dacă nu, ajustez.

## Out of scope

- Nu modific viewport meta din `index.html` (nu adaug `maximum-scale=1` — strică accesibilitatea).
- Nu modific layout-ul desktop al chat-ului.
- Nu schimb logica de mesaje, atașamente, realtime.

## Fișiere

- Editat: `src/components/messaging/MessageInput.tsx`
- Editat: `src/components/messaging/ChatDialog.tsx`
- Editat: `src/pages/Messages.tsx`
- Posibil editat: `src/components/messaging/ChatPanel.tsx` (doar dacă lipsește `min-h-0` pe scroller)
