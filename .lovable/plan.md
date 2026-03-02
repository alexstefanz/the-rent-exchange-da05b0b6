

## Plan: Fixed Support Chat Button

### What we'll build
A floating action button (FAB) fixed in the bottom-right corner of the screen. Clicking it opens a dialog/drawer with a form (name, subject, description). After submitting, it creates an ops_ticket and opens an inline chat view where the user can exchange messages with admins in real-time.

### Implementation

#### 1. Create `SupportChatWidget` component (`src/components/support/SupportChatWidget.tsx`)
- Fixed button in bottom-right (above mobile nav on mobile: `bottom-20 lg:bottom-6 right-4`)
- Uses `Headphones` or `MessageSquare` icon
- Opens a popover/card overlay (not a full dialog) anchored to bottom-right
- Two states:
  - **Form state**: Name, Subject, Description fields. On submit, calls `createUserTicket` to create an ops_ticket
  - **Chat state**: Shows messages for the created ticket using `fetchUserTicketMessages` / `addUserTicketMessage`. Polls or uses realtime for updates. Shows admin replies (non-internal messages)

#### 2. Form details
- Name field (pre-filled from profile if logged in)
- Subject (text input)
- Description (textarea)
- Category auto-set to `USER` / `GENERAL_INQUIRY` (or similar existing category type)
- User must be authenticated; if not, show a message to log in first

#### 3. Chat view after submission
- Display ticket `public_id` as reference
- Show message timeline (customer vs admin messages)
- Input field to send new messages via `addUserTicketMessage`
- Poll messages every 10 seconds with react-query

#### 4. Persistence
- Store active ticket ID in localStorage so reopening the widget resumes the conversation
- "New conversation" button to start fresh

#### 5. Integration
- Add `<SupportChatWidget />` in `App.tsx` alongside `<Toaster />` etc., so it appears on all pages

### Technical details
- No database changes needed -- uses existing `ops_tickets` and `ops_ticket_messages` tables with existing RLS policies
- Need to add a `GENERAL_INQUIRY` category type or use existing `USER` group. Looking at the existing categories, `USER` group likely has suitable types. Will check and use the closest match or add one to the constant.
- The widget will be hidden on admin routes (`/admin/*`) to avoid clutter

