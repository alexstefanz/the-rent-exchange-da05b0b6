## Problema

Când userul apasă **„Confirmă"** pe draftul de ticket din chat-ul de suport, butonul trimite mesajul `"Confirm, trimite ticketul."` înapoi la AI și se bazează pe el să apeleze tool-ul `create_support_ticket`. În practică modelul (Gemini Flash Preview) reapelează `draft_ticket` în loc de `create_support_ticket` → draftul reapare, userul mai apasă Confirmă, se intră într-un loop fără ca ticketul să fie vreodată creat.

Fluxul este fragil pentru că depinde de comportamentul probabilistic al modelului ca să declanșeze o acțiune deterministă (crearea ticketului).

## Soluția

Eliminăm AI-ul din pasul de confirmare. Când userul apasă **„Confirmă"**, apelăm direct `handleToolCall(msg.draft)` (care face deja `createUserTicket` + flush mesaje AI + setare `ticketId` + invalidare query). Draftul conține deja toate câmpurile necesare (subject, description, category_group, category_type, priority), deci nu mai e nevoie de un alt round-trip prin AI.

Butonul **„Modifică"** rămâne neschimbat — continuă să trimită mesaj la AI ca să întrebe ce să schimbe.

## Modificări

**`src/components/support/SupportChatWidget.tsx`** (singura modificare)

În blocul draft (linia ~770), butonul „Confirmă":
- `onClick`: `() => handleToolCall(msg.draft!)` în loc de `sendAiText(...)`
- păstrăm `disabled={isAiLoading || isCreatingTicket}` și loaderul „Se creează ticketul..." existent

Opțional: ascundem cardul de draft în timpul `isCreatingTicket` ca să nu mai fie clickable (deja e disabled, dar vizual e mai curat).

## Out of scope

- System prompt-ul edge function `support-ai-chat` rămâne cum e (nu schimbăm logică AI).
- Nu schimbăm nimic la flow-ul „Modifică", la upload imagini, la FAQ sau la realtime mesaje.
- Nu schimbăm `userTicketsApi` sau migrațiile.

## Verificare

După deploy: deschid widgetul de suport, parcurg întrebările AI până la draft, apăs „Confirmă" → ticketul trebuie creat instant (fără să mai treacă prin AI), chat-ul trece în modul „ticket activ" cu mesajele anterioare salvate.
