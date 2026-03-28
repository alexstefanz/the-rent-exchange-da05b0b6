

## Plan: AI-Powered Support Chat with Admin Handoff

Replace the current support form in the `SupportChatWidget` with a two-phase flow: first an AI assistant gathers context through conversational questions, then creates a ticket and hands off to a human admin.

### How it works

1. User opens the chat widget → instead of a form, the AI greets them and asks what they need help with
2. The AI asks 2-3 clarifying questions (category, details, urgency) in a conversational way
3. Once enough context is gathered, the AI automatically creates an `ops_ticket` with the collected info (subject, description, category) and notifies the user that a human admin will take over
4. From that point, the chat becomes the existing ticket messaging system — user and admin exchange messages as before

### Technical Implementation

**1. New Edge Function: `supabase/functions/support-ai-chat/index.ts`**
- Receives the conversation history (array of messages) from the client
- Uses Lovable AI (Gemini Flash) with a system prompt in Romanian that:
  - Greets the user warmly as "Rentli Support"
  - Asks about their issue category (rental problem, account issue, product listing, payment, other)
  - Asks for details about the specific problem
  - When enough info is gathered, returns a structured tool call with `{ ready: true, subject, description, category_type }` to signal ticket creation
- Uses tool calling to extract structured data when ready to create a ticket
- Streams responses for a natural chat feel

**2. Refactor `SupportChatWidget.tsx`**
- Remove the form (subject, description, name fields)
- Add a new "AI phase" state before the ticket is created:
  - Local `aiMessages` state with `{role, content}[]`
  - On user message → call edge function with full history → stream AI response
  - When AI signals readiness (via a special marker in response or separate call), auto-create the ticket using existing `createUserTicket`
  - Insert the AI conversation summary as the ticket description
  - Transition to existing ticket chat view seamlessly
- The AI messages are displayed with a "bot" avatar/style (different from admin messages)
- Show typing indicator while AI is responding

**3. Message display distinction**
- AI messages: shown with a bot icon, slightly different styling (e.g., subtle gradient or bot label)
- Admin messages: existing `AGENT` author_type styling
- User messages: existing `CUSTOMER` styling

### Files to create/modify
- **Create** `supabase/functions/support-ai-chat/index.ts` — AI chat edge function with streaming
- **Modify** `src/components/support/SupportChatWidget.tsx` — replace form with AI conversation flow, add streaming, add auto-ticket creation on handoff

### AI System Prompt (Romanian)
The AI will be instructed to:
- Be concise and friendly
- Ask maximum 3 questions before creating the ticket
- Categorize the issue into existing category types (GENERAL_INQUIRY, PAYMENT_ISSUE, ACCOUNT_ISSUE, etc.)
- When it has enough info, signal readiness with a specific format

No database changes needed — reuses existing `ops_tickets` and `ops_ticket_messages` tables.

