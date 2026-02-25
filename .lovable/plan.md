

## Plan: User Ticket Creation & Navigation

### Context
Currently, ops_tickets are admin-only (RLS restricts all operations to admin role). Users need to be able to create and view their own tickets. The user wants links placed in three locations replacing/augmenting "Centru de asistență".

### Phase 1: Database Changes (Migration)

Update RLS on `ops_tickets` to allow authenticated users to:
- **INSERT** tickets where `requester_user_id = auth.uid()`
- **SELECT** their own tickets where `requester_user_id = auth.uid()`

Update RLS on `ops_ticket_messages` to allow:
- **INSERT** messages on tickets they own (non-internal only)
- **SELECT** non-internal messages on tickets they own

Update RLS on `ops_ticket_attachments` to allow:
- **INSERT** attachments on tickets they own
- **SELECT** attachments on their own tickets (non-internal messages only)

### Phase 2: New Pages

**`src/pages/UserTickets.tsx`** - User's ticket list and creation page:
- Shows a list of the user's own tickets (filtered by `requester_user_id`)
- "Creează ticket" button opens a simplified form (title, description, category_group, category_type cascading select, optional reservation/product link)
- Each ticket shows: public_id, title, status badge, priority badge, created_at
- Click on a ticket to expand/view messages timeline (non-internal only)
- User can add messages to their open tickets
- Layout: Navbar + content + Footer, consistent with other pages

**Route**: `/suport` in App.tsx

### Phase 3: Navigation Updates

**Navbar.tsx (Desktop dropdown)** - Line 228-232:
- Replace "Centru de asistență" (`/centru-asistenta`) with "Suport & Tickete" (`/suport`) using a `LifeBuoy` or `HelpCircle` icon

**Navbar.tsx (Mobile offcanvas)** - Line 413-420:
- Replace "Centru de asistență" link with "Suport & Tickete" pointing to `/suport`

**Profile page (`src/pages/Profile.tsx`)** - Add a new tab or a prominent link/card in the AccountTab:
- Add a card/link in AccountTab.tsx (at the bottom, before security section) that says "Ai o problemă? Deschide un ticket" linking to `/suport`

### Phase 4: Keep Help Center

The existing `/centru-asistenta` page can remain accessible (e.g., from the Footer) for general FAQ/guides, but the primary navigation links switch to `/suport`.

### Files to Create/Modify

| Action | File |
|--------|------|
| Create | Migration SQL (new RLS policies for user access) |
| Create | `src/pages/UserTickets.tsx` |
| Modify | `src/App.tsx` (add `/suport` route) |
| Modify | `src/components/layout/Navbar.tsx` (replace "Centru de asistență" in dropdown + offcanvas) |
| Modify | `src/components/profile/AccountTab.tsx` (add link to support) |

### Technical Details

- User-created tickets will have `requester_user_id` set to `auth.uid()` and `created_by` set to null (since they're not admin)
- The `author_type` for user messages will be `CUSTOMER`
- Internal notes (`is_internal = true`) will never be visible to users via RLS
- The simplified user form won't expose priority (defaults to MEDIUM) or assignment fields

