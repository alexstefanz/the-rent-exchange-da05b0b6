## Obiectiv

După ce o închiriere ajunge în starea `completed` (Finalizat), conversația dintre proprietar și chiriaș se marchează automat ca închisă: input-ul de mesaje este blocat, se afișează un banner „Conversație finalizată" și un buton „Reia conversația". Oricare dintre cele două părți poate reactiva chatul cu un click.

## Modificări baza de date

Adăugăm o coloană pe `conversations`:

- `reopened_at timestamptz NULL` — setată când oricare participant apasă „Reia conversația".

Logica de „închis" devine pur derivată:

```text
isClosed = rental.status === 'completed'
         && (conversations.reopened_at IS NULL
             OR conversations.reopened_at < rental.completed_at)
```

Astfel, dacă chatul este reluat, rămâne deschis; dacă în viitor apare o nouă finalizare (nu e cazul aici, dar e safe), s-ar reînchide.

Politica RLS existentă „Conversation participants can update conversation" permite deja buyer/owner să facă `UPDATE` pe rândul lor — nu sunt necesare schimbări de policy.

## Modificări UI (`src/components/messaging/ChatPanel.tsx`)

1. Citim `reopened_at` din `conversations` (în efectul existent care încarcă `buyer_last_read_at` / `owner_last_read_at`).
2. Calculăm `isClosed` din `rentalCtx.status === 'completed'` + `reopened_at`.
3. Când `isClosed`:
   - Ascundem `<MessageInput />` și în locul lui afișăm un panou:
     - Iconiță + text: „Conversație finalizată. Închirierea a fost încheiată."
     - Buton primar „Reia conversația" / „Resume conversation".
   - Apăsarea butonului face `UPDATE conversations SET reopened_at = now()` și invalidează query-urile de conversații / mesaje. După aceea inputul reapare normal.
4. Realtime: subscription-ul existent pe `UPDATE conversations` reflectă automat schimbarea la celălalt participant, deci când unul reia, celuilalt i se deschide chatul fără refresh.

## Lista conversațiilor (`ConversationList.tsx`)

- Adăugăm un mic badge gri „Finalizat" pe item-ul de conversație când rentalul atașat e `completed` și `reopened_at` nu e mai recent decât finalizarea. (cosmetic, opțional, dar îmbunătățește claritatea)

## Localizare

Adăugăm cheile noi în `uxCopy.ts`:

- „Conversație finalizată" / „Conversation closed"
- „Închirierea a fost încheiată" / „The rental has ended"
- „Reia conversația" / „Resume conversation"

## Ce NU se schimbă

- Mesajele istorice rămân vizibile integral.
- Nu se schimbă nimic în lifecycle-ul rentalului, doar UI-ul chatului reacționează la `status = 'completed'`.
- Nu se șterg/arhivează conversații.
