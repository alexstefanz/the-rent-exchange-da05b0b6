

## Plan: Navigate to Messages page instead of opening chat popup

### Problem
Clicking "Discută cu proprietarul/chiriașul" in the notifications section opens a `ChatDialog` popup. Instead, it should navigate to the `/mesaje` page with the conversation pre-selected.

### Changes

**File: `src/components/profile/NotificationsTab.tsx`**

1. **Update `handleStartChat`**: Instead of setting `setChatOpen(true)` and related state, navigate to `/mesaje?conv={conversationId}` using `useNavigate`. The messages page already supports the `conv` URL parameter for auto-selecting a conversation.

2. **Remove unused state and component**: Remove `chatOpen`, `chatConversationId`, `chatOtherUserName`, `chatOtherUserAvatar`, `chatProductTitle` state variables and the `<ChatDialog>` component render + its import.

Single file change, no new dependencies.

