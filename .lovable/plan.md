## Problem

Mesajele noi din chat nu apar live — e nevoie de refresh. Din console logs văd că:
- `notifications-realtime` (per-user) trimite intermitent `CHANNEL_ERROR`.
- Canalul `global-realtime` funcționează (toast-ul „Mesaj nou..." apare).
- `ChatPanel` are un canal propriu `chat-panel-${conversationId}` care ascultă `INSERT` pe `messages` și actualizează lista locală — dar dacă acel canal eșuează (concurrent channel error, race la auth) nu există fallback și mesajul nu apare decât la refetch (refresh manual).

Cache-ul listei de mesaje folosește cheia `["messages-attached", conversationId]`, dar `useGlobalRealtime` invalidează doar `["messages", conversationId]`, deci nu împrospătează panoul deschis.

## Schimbări

### 1. `src/hooks/useGlobalRealtime.ts`
La `INSERT` pe `messages`, pe lângă cheile actuale, invalidează și:
- `["messages-attached", m.conversation_id]`
- `["messages-attached"]` (umbrella) ca fallback

Aceasta garantează că, indiferent dacă subscripția locală din `ChatPanel` reușește sau nu, panoul deschis își reface lista din DB imediat ce ajunge orice INSERT pe `messages` pentru acest user (RLS permite doar mesajele conversațiilor sale).

### 2. `src/components/messaging/ChatPanel.tsx`
- Adaugă logging la `.subscribe((status) => ...)` pentru `CHANNEL_ERROR/TIMED_OUT` (diagnoză rapidă).
- Pe `SUBSCRIBED`, invalidează `["messages-attached", conversationId]` ca să prindă mesaje sosite între deschidere și subscribe-ready (RLS race).
- Mută `markConversationRead` într-un debounce mic ca să nu lupte cu invalidarea.

### 3. Verificare
După deploy, deschid `/mesaje`, selectez o conversație într-un tab și trimit un mesaj din alt tab/cont — mesajul trebuie să apară < 1s fără refresh. Verific consola pentru `[chat-panel] status: SUBSCRIBED` și absența `CHANNEL_ERROR`.

## De ce nu modific RLS / publication

`messages` e deja în `supabase_realtime`, are RLS corectă pentru participanți și `relreplident=default` (suficient pentru INSERT). Problema e doar pe partea de client: lipsește invalidarea cheii corecte de cache la nivel global.
