# Reparare tool de chat

Sunt 4 probleme distincte de rezolvat în `/mesaje`.

## 1. Limită standard pentru caractere (anti-spam / anti-crash)

În `src/features/messaging/messagingApi.ts` limita actuală e **5000** caractere — prea mare, permite mesaje gigantice care strică layoutul și pot bloca render-ul.

- Scădere `MAX_MESSAGE_LENGTH` la **1000** caractere (suficient pentru orice mesaj real într-un chat de tranzacții).
- În `MessageInput.tsx`: afișează un mic counter `text.length / 1000` în colțul de jos al textarea-ului, devine portocaliu la >900 și roșu la 1000. Submit-ul rămâne dezactivat când se atinge limita.
- `slice(0, MAX_MESSAGE_LENGTH)` deja există la onChange — rămâne ca hard cap.

## 2. Layout-ul se rupe la șiruri lungi fără spații (imaginea 2)

Bubble-ul portocaliu se întinde pe toată lățimea fiindcă `break-words` (= `overflow-wrap: break-word`) NU sparge un singur "cuvânt" foarte lung (ex. `@@@@@@…@@@`). Se vede ca o bandă portocalie pe tot ecranul.

- În `src/components/messaging/MessageContent.tsx`, la `<p>`-ul mesajului: înlocuiește `break-words` cu clasa Tailwind arbitrară `[overflow-wrap:anywhere]` (sparge oriunde, inclusiv în mijlocul unui șir). Păstrează `whitespace-pre-wrap`.
- În `MessageBubble.tsx`, adaugă `min-w-0` pe containerul cu `max-w-[78%]` ca să nu împingă layoutul în afara constrângerii.

## 3. Draftul rămâne între interlocutori (imaginea 1)

`MessageInput` ține `text` în state local. Când utilizatorul schimbă conversația în `MessagesTab`, `ChatPanel` se re-randează cu alt `conversationId`, dar `MessageInput` păstrează același state (același instanță React).

- În `ChatPanel.tsx`, la randarea `<MessageInput …/>`, adaugă `key={conversationId}`. Astfel React montează o instanță nouă per conversație → textul + atașamentele pending se golesc automat.

## 4. Imaginea atașată nu apare în chat și nici în tab-ul Media

Codul de upload (`src/lib/chatMedia.ts → uploadAttachment`) urcă blob-ul în bucket-ul `chat-media`, apoi inserează rândul în `message_attachments`. În `ChatPanel.handleSend`, pentru mesajele cu atașament NU se mai face inserarea optimistă (linia 190 `if (uploaded.length === 0)`), iar replace-ul depinde de realtime + refetch. Trebuie investigat dacă:

- bucket-ul `chat-media` există și are policy de INSERT pentru utilizatorul autenticat,
- RLS pe `message_attachments` permite insert pentru `uploader_id = auth.uid()`,
- în consolă apare `chat-media upload failed` sau `attachment insert failed`.

Pași în implementare:
1. Voi rula `supabase--read_query` pentru a verifica existența bucket-ului și a policy-urilor pe `storage.objects` + `message_attachments`.
2. Voi încerca un upload din browser și voi citi `console`/`network` pentru eroarea exactă.
3. În funcție de cauză: fie creez migrația pentru bucket + policies, fie corectez codul. Cel mai probabil fix de cod: și pentru mesajele cu atașamente să existe un placeholder optimist (cu skeleton) ca utilizatorul să vadă imediat că imaginea s-a trimis, iar refetch-ul după attach să o populeze.

## Fișiere atinse

```text
src/features/messaging/messagingApi.ts   (MAX_MESSAGE_LENGTH 5000 → 1000)
src/components/messaging/MessageInput.tsx (counter + reset implicit prin key)
src/components/messaging/MessageContent.tsx ([overflow-wrap:anywhere])
src/components/messaging/MessageBubble.tsx (min-w-0)
src/components/messaging/ChatPanel.tsx   (key={conversationId} pe MessageInput)
+ eventual o migrație pentru bucket/policies chat-media după diagnostic
```

## Detalii tehnice

- `[overflow-wrap:anywhere]` e suportat în toate browserele moderne și e diferit de `break-all` (care sparge agresiv chiar și texte normale). „anywhere" sparge doar când e necesar pentru a încăpea în container.
- Adăugarea `key={conversationId}` e idiomatic React pentru a reseta complet starea unei componente la schimbare de context.
- Counterul de 1000 e suficient pentru DM-uri tranzacționale; mesajele lungi gen contract / descriere se trimit prin emailuri sau atașament.