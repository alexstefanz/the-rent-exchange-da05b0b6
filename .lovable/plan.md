Aplic limita standard de caractere speciale (`MAX_SPECIAL_CHARS = 20`) și limita de lungime (`MAX_MESSAGE_LENGTH = 500`) și pe composer-ul admin de tickete, ca să se comporte ca restul chat-urilor (mesagerie + suport client).

Modific `src/components/admin/tickets/AdminConversation.tsx`:
1. Import `MAX_MESSAGE_LENGTH`, `MAX_SPECIAL_CHARS`, `countSpecialChars` din `@/features/messaging/messagingApi`.
2. În `send()`: blochez trimiterea dacă mesajul depășește lungimea sau numărul de simboluri speciale și afișez `toast.error` cu același copy bilingv folosit în restul chat-urilor.
3. Pe `<Textarea>`: adaug `maxLength={MAX_MESSAGE_LENGTH}` și `slice` pe input ca să previn lipirea peste limită.
4. Sub composer afișez un contor mic, vizibil când utilizatorul se apropie de limită — `{count}/{MAX_SPECIAL_CHARS}` simboluri și `{len}/{MAX_MESSAGE_LENGTH}` caractere, ca în `MessageInput` și `TicketChat`.
5. Disable buton `Trimite` și pentru `text > MAX_MESSAGE_LENGTH` sau `simboluri > MAX_SPECIAL_CHARS`.

Nu se modifică altă logică (notă internă, atașamente, AI assist rămân la fel).