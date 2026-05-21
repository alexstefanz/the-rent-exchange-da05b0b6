## Plan: Limită 500 caractere + max 20 simboluri speciale în chat

### Scop
- Limită totală: **500 caractere/mesaj** (în loc de 1000)
- Limită simboluri speciale non-punctuație: **max 20/mesaj**
- Aplicat în: chat chiriaș↔proprietar și chat suport (widget flotant + pagina /suport)

### Definiție „caracter special"
Orice caracter care NU este:
- literă (inclusiv diacritice RO: ăâîșțĂÂÎȘȚ)
- cifră
- spațiu / newline / tab
- punctuație normală: `. , ! ? ; : - ' " ( ) … –`

Adică simboluri precum `@ # $ % ^ & * < > { } [ ] \ | ~ \`` + emoji-uri sunt numărate. Regex aprox.:
```ts
const SPECIAL_RE = /[^\p{L}\p{N}\s.,!?;:\-'"()…–]/gu;
```
Limită: max 20 potriviri/mesaj.

### Fișiere modificate

1. **`src/features/messaging/messagingApi.ts`**
   - `MAX_MESSAGE_LENGTH = 1000` → `500`
   - Adaug constantă `MAX_SPECIAL_CHARS = 20` + helper `countSpecialChars(text)` (exportate).
   - În `sendMessage` (sau echivalent server-side helper): respinge cu eroare clară dacă depășit.

2. **`src/components/messaging/MessageInput.tsx`** (chat chiriaș↔proprietar)
   - Folosește deja `MAX_MESSAGE_LENGTH` → va deveni automat 500.
   - Adaug indicator simboluri speciale (`X/20`) când se apropie/depășește limita.
   - Blochez trimiterea + toast dacă > 20 simboluri.

3. **`src/components/support/SupportChatWidget.tsx`** (widget suport flotant)
   - Folosește deja `MAX_MESSAGE_LENGTH` → 500 automat.
   - Aceeași validare simboluri speciale (2 locuri: liniile ~979 și ~1206).

4. **`src/components/support/center/TicketChat.tsx`** (pagina /suport ticket chat)
   - Acum NU are limită → adaug `maxLength={500}`, counter + validare simboluri speciale identică.
   - Validare în `handleSend` cu toast bilingv.

### UX
- Contor caractere afișat când >80% din limită (pattern existent în MessageInput).
- Contor simboluri speciale afișat doar când > 0, devine roșu la ≥20.
- Mesaj toast bilingv: „Maxim 20 simboluri speciale per mesaj." / "Maximum 20 special symbols per message."

### Notă
Nu modific schema bazei de date — validarea rămâne client-side + în helper-ul shared (`messagingApi.ts`). RLS-ul existent rămâne neschimbat.