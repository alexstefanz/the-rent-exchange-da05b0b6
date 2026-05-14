## Cauza
Conversația `429bee57-...` chiar nu are niciun mesaj în DB (0 totale, 0 ascunse) — utilizatorul a deschis chat-ul și a apăsat "Raportează conversația" fără să existe vreun mesaj. Pagina admin funcționează corect, dar afișează "Niciun mesaj" pentru că nu există ce să afișeze.

În plus, la nivel de schemă există o problemă structurală: rapoartele la nivel de conversație nu au `conversation_id` propriu — `InfoPanel.tsx:103` trimite `message_id: null` și injectează ID-ul în câmpul `reason` ca text (`"Conversation <uuid>"`). În admin recuperăm ID-ul cu regex pe `reason` (hack). Și când conversația are mesaje, nu vedem niciun context în panoul de raport.

## Soluție

### 1. Schemă DB (migration)
- Adaug coloana `conversation_id uuid NULL REFERENCES conversations(id) ON DELETE SET NULL` în `message_reports`.
- Index pe `(conversation_id)`.
- Backfill: pentru rapoartele existente unde `conversation_id IS NULL`:
  - dacă `message_id` există → ia `conversation_id` din `messages`;
  - altfel extrage UUID din `reason` cu regex și setează.
- RLS: păstrăm politicile actuale (admin RPC/role); doar adăugăm coloana în SELECT.

### 2. Frontend — inserare raport conversație
- `src/lib/chatMedia.ts` → `reportMessage` primește și `conversationId?: string` și îl trece la insert.
- `src/components/messaging/InfoPanel.tsx:103` → `reportMessage({ conversationId, reason: details })` în loc de hack-ul cu `Conversation ${id}` în `reason`.

### 3. Admin — listare și afișare
- `src/features/admin/messageReportsApi.ts`:
  - Selectez direct `conversation_id` din `message_reports` (elimin regex-ul din `convoFromReason`).
  - Pentru rapoartele fără `message_id`, fac un fetch separat al **ultimelor 5 mesaje** din `conversation_id` și le returnez ca `recent_messages`.
- `src/pages/admin/AdminReports.tsx` (panoul detail):
  - Dacă `message_content` este null și avem `conversation_id`, afișez secțiunea "Ultimele mesaje din conversație" (listă scurtă cu autor + conținut + ora) ca să avem context vizibil înainte să dăm click pe link-ul de conversație.
  - Dacă conversația e goală, afișez explicit "Conversație raportată fără mesaje".

### 4. Tipuri
- Adaug `conversation_id` în interfața `MessageReportRow` și `recent_messages?: { id; content; sender_id; created_at }[]`.

### Fișiere atinse
- migration SQL nouă (ALTER TABLE + backfill + index)
- `src/lib/chatMedia.ts`
- `src/components/messaging/InfoPanel.tsx`
- `src/features/admin/messageReportsApi.ts`
- `src/pages/admin/AdminReports.tsx`

### Ce NU se atinge
- `AdminConversationDetail.tsx` — funcționează corect; rămâne ca fallback prin link.
- RLS pe `messages` — nu schimbăm; deja admin are acces.

Rezultat: rapoartele de conversație au context vizibil direct în panoul de moderare; nu mai ajunge moderatorul pe o pagină goală fără să știe ce a raportat utilizatorul.