## Probleme

1. **Delay la trimitere mesaj (~2s)**: în `src/features/messaging/messagingApi.ts → sendMessage()` se face `await supabase.functions.invoke('send-message-notification', …)` *înainte* de a returna. UI-ul așteaptă această invocare ca să afișeze mesajul trimis. În plus, `update conversations.updated_at` este și el `await`-uit deși nu blochează inserarea mesajului.
2. **Mesajele necitite nu ies suficient în evidență** în `ConversationList.tsx` — titlul produsului e `font-bold` dar restul (numele user-ului, ultimul mesaj, ora) folosesc `font-medium`/`font-semibold`, iar fundalul `bg-primary/5` e foarte palid.
3. **Tab-urile "Rezervări" / "De închiriat" din widget-ul de support nu au badge** de necitite (în pagina `/mesaje` există deja). Cele din imaginea 2 sunt în pagina `/mesaje`, dar utilizatorul vrea același comportament și în widget.

## Soluție

### 1. Eliminare delay (sendMessage)

În `src/features/messaging/messagingApi.ts`:
- Mut `supabase.functions.invoke('send-message-notification', …)` într-un `void (async () => { … })()` fire-and-forget — UI-ul primește răspunsul imediat ce INSERT-ul mesajului se confirmă.
- La fel pentru `update conversations.updated_at` (nu e nevoie de `await` pentru ca user-ul să vadă mesajul; oricum `updated_at` se sincronizează apoi prin invalidare cache la realtime).
- Returnez `data as Message` imediat după INSERT.

Bonus: în `ChatPanel.tsx` (`handleSend`) adaug **optimistic update** — push imediat în `localMessages` un mesaj temporar (`id: "tmp-…"`, fără server roundtrip), pe care îl înlocuiesc/dedup când vine confirmarea sau realtime payload-ul. Dacă INSERT eșuează, scot mesajul temporar și arăt toast.

### 2. Mesaje necitite mai vizibile

În `src/components/messaging/ConversationList.tsx → renderItem`:
- Card întreg necitit: fundal mai pronunțat (`bg-primary/10`) + border-left mai gros.
- Numele user-ului: `font-bold` în loc de `font-medium` când `isUnread`.
- Ultimul mesaj: `font-bold text-foreground` (în loc de `font-medium`) când `isUnread`.
- Adaug un dot `bg-primary` (8×8) lângă timp pentru semnalizare vizuală instant.
- Badge-ul de count rămâne, dar îl fac mai pronunțat (shadow subtil).

### 3. Badge-uri pe sub-tab-urile widget-ului

În `src/components/support/SupportChatWidget.tsx`, secțiunea sub-tabs `Rezervări` / `De închiriat` (linii 939–964):
- Calculez `rezervariUnread` și `deInchiriatUnread` din `conversations` (analog cu `ConversationList`).
- Adaug un span badge roșu/destructive lângă text când `> 0`, identic stilistic cu cel din imaginea 2 (`bg-destructive text-destructive-foreground rounded-full`).

## Fișiere

- `src/features/messaging/messagingApi.ts` — non-blocking edge function call + non-blocking conversation update.
- `src/components/messaging/ChatPanel.tsx` — optimistic update în `handleSend` (mesaj temporar, dedup la realtime/confirmare).
- `src/components/messaging/ConversationList.tsx` — îmbunătățesc stilul vizual pentru `isUnread` (bold puternic, fundal, dot).
- `src/components/support/SupportChatWidget.tsx` — adaug badge-uri pe sub-tab-urile Rezervări/De închiriat.

## În afara scope-ului

- Modificări la edge function `send-message-notification`.
- Schimbări de schema DB sau RLS.
- Realtime presence/typing — funcționează deja.
