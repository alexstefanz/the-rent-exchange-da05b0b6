## Problemă

În `ChatPanel.tsx`, când trimiți un mesaj:
1. `sendMessage()` face INSERT în `messages`
2. UI-ul **NU** adaugă mesajul local — așteaptă ca evenimentul Realtime `postgres_changes` să-l aducă înapoi
3. Dacă Realtime întârzie sau nu se declanșează, mesajul apare doar după refresh (când React Query refetch-uiește)

În plus, tabela `conversations` **nu este** în publication-ul `supabase_realtime`, deci read receipts (peer_last_read_at) nu se actualizează în timp real.

## Soluție

### 1. Optimistic update la trimitere (`src/components/messaging/ChatPanel.tsx`)
În `handleSend`, după ce `sendMessage` returnează mesajul, adaugă-l imediat în `localMessages` (cu deduplicare după `id` — guard-ul existent din canalul realtime previne dublarea când evenimentul ajunge ulterior).

```ts
const sent = await sendMessage(conversationId, finalContent);
if (sent) {
  let attachments: AttachmentRow[] = [];
  if (uploaded.length > 0) {
    await attachToMessage(sent.id, uploaded.map((u) => u.id));
    // refetch attachments pentru a le include în bula optimistă
    const { data } = await supabase
      .from("message_attachments")
      .select("*")
      .eq("message_id", sent.id);
    attachments = (data || []) as AttachmentRow[];
  }
  setLocalMessages((prev) =>
    prev.some((m) => m.id === sent.id) ? prev : [...prev, { ...sent, attachments }]
  );
}
```

Astfel sender-ul vede mesajul instant, iar receiver-ul îl primește prin canalul realtime existent.

### 2. Adaugă `conversations` în publicația realtime (migrare nouă)
Pentru ca update-urile de read receipt (`buyer_last_read_at` / `owner_last_read_at`) să ajungă instant la peer:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
```

Tabela `messages` este deja în publicație, deci INSERT-urile funcționează — iar fix-ul #1 elimină dependența vizuală de latența realtime pentru sender.

### 3. (Opțional, recomandat) Invalidare conversations la mesaj nou
În handler-ul realtime `INSERT` din `ChatPanel`, adaugă un `queryClient.invalidateQueries({ queryKey: ["conversations"] })` ca să se actualizeze sidebar-ul cu ultimul mesaj/badge unread fără refresh.

## Out of scope
- Schimbări la `useChatPresence` sau presence/typing.
- Refactor la `messagingApi.ts` sau la flow-ul de attachments.
- Schimbări UI/styling.
