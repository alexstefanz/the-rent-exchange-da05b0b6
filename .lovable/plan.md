

## Plan: Add unread count badges to Rezervări / De Închiriat tabs

**File: `src/components/messaging/ConversationList.tsx`**

1. Compute unread counts per tab by filtering conversations:
   - `rezervariUnread` = sum of `unread_count` where `conv.buyer_id === userId`
   - `deInchiriatUnread` = sum of `unread_count` where `conv.owner_id === userId`

2. Update the `TabsTrigger` elements to show a `Badge` next to the label when the respective count is > 0:
   ```
   Rezervări (3)    De Închiriat (1)
   ```
   Use a small inline `Badge` (same style as conversation unread badges) next to each tab label.

Single file change, no new dependencies.

