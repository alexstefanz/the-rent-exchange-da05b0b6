

## Plan: Complete Operational Tickets Module for Admin ERP

This is a large feature that replaces the existing simple `support_tickets` table with a full operational ticketing system. I'll break it into phases for implementation.

### Phase 1: Database Schema (Migration)

Drop the old `support_tickets` table and create new tables:

**Table: `ops_tickets`**
- `id` uuid PK
- `public_id` text UNIQUE NOT NULL (auto-generated TCK-000001 format via trigger)
- `title` text NOT NULL
- `description` text NOT NULL
- `category_group` text NOT NULL (RESERVATION, PRODUCT, FINANCIAL, DISPUTE, USER)
- `category_type` text NOT NULL (OWNER_CANT_FULFILL, LATE_HANDOVER, etc.)
- `priority` text NOT NULL DEFAULT 'MEDIUM' (LOW, MEDIUM, HIGH, URGENT)
- `status` text NOT NULL DEFAULT 'NEW' (NEW, IN_PROGRESS, WAITING_CUSTOMER, WAITING_OWNER, WAITING_INTERNAL, RESOLVED, CLOSED)
- `created_by` uuid (admin who created)
- `assigned_to` uuid nullable
- `requester_user_id` uuid nullable
- `rental_user_id` uuid nullable
- `owner_user_id` uuid nullable
- `reservation_id` uuid nullable (FK to rentals)
- `product_id` uuid nullable (FK to products)
- `tags` text[] DEFAULT '{}'
- `created_at`, `updated_at`, `closed_at` timestamps
- Indexes on: public_id, status, priority, category_type, reservation_id, product_id, rental_user_id, owner_user_id

**Table: `ops_ticket_messages`**
- `id` uuid PK
- `ticket_id` uuid FK to ops_tickets
- `author_type` text NOT NULL (ADMIN, CUSTOMER, OWNER, SYSTEM)
- `author_id` uuid nullable
- `message_text` text NOT NULL
- `is_internal` boolean DEFAULT false (internal admin notes)
- `created_at` timestamp

**Table: `ops_ticket_attachments`**
- `id` uuid PK
- `ticket_id` uuid FK
- `message_id` uuid nullable FK
- `file_url` text NOT NULL
- `file_name` text NOT NULL
- `file_type` text
- `file_size` integer
- `uploaded_by_type` text
- `uploaded_by_id` uuid
- `created_at` timestamp

**Table: `ops_ticket_audit_log`**
- `id` uuid PK
- `ticket_id` uuid FK
- `action` text NOT NULL (STATUS_CHANGED, ASSIGNED_CHANGED, PRIORITY_CHANGED, etc.)
- `old_value` text nullable
- `new_value` text nullable
- `actor_id` uuid nullable
- `created_at` timestamp

**Auto-increment trigger** for `public_id`: sequence + trigger to generate TCK-000001 format.

**Updated_at trigger** on `ops_tickets`.

**RLS Policies**: All tables restricted to users with admin role via `has_role(auth.uid(), 'admin')`. The existing `app_role` enum already has `admin` and `moderator`. For now, RBAC (SUPPORT, FINANCE, KYC_REVIEWER) will be handled at the UI level since the current role system only supports admin/moderator/user. A note will be left for future granular role expansion.

**Storage bucket**: `ticket-attachments` (public: false) for file uploads.

### Phase 2: API Layer

**File: `src/features/admin/opsTicketsApi.ts`**
- CRUD for tickets: `fetchOpsTickets`, `fetchOpsTicket`, `createOpsTicket`, `updateOpsTicket`
- Status/priority/assignment changes with audit log creation
- Messages: `fetchTicketMessages`, `createTicketMessage`
- Attachments: `uploadTicketAttachment`, `fetchTicketAttachments`
- Audit log: `fetchTicketAuditLog`
- Auto-populate context: when `reservation_id` is set, fetch rental to get product_id, renter_id, owner_id

### Phase 3: UI Components

**Update `AdminSidebar.tsx`**: Keep existing "Tickete" menu item pointing to `/admin/tickets`.

**Replace `src/pages/admin/AdminTickets.tsx`** completely with new list page:
- Stats cards: NEW count, IN_PROGRESS count, URGENT unresolved count
- Filters: status, category_group, category_type, priority, assigned_to, date range
- Search: by public_id, user name
- Table: public_id, title, category, priority (colored badge), status (colored badge), assigned_to, created_at, SLA alert icon for URGENT>2h
- Click row to navigate to detail page

**New `src/pages/admin/AdminTicketDetail.tsx`**:
- Header: public_id, title, status badge, priority badge, category
- Context panel (sidebar/card):
  - Reservation link (if reservation_id)
  - Product link (if product_id)
  - Renter info (if rental_user_id)
  - Owner info (if owner_user_id)
- Action buttons: change status, assign, change priority, add tag
- Timeline: messages (with internal note toggle), attachments inline
- Message input with internal note checkbox + file attachment
- Audit log tab
- Stub buttons for "Create Refund" / "Apply Penalty" (TODO)

**New `src/pages/admin/AdminTicketCreate.tsx`** (or dialog):
- Form: title, description, category_group, category_type (cascading), priority
- Optional: reservation_id (searchable), product_id, requester_user_id
- Auto-populate context when reservation selected

**Route**: Add `/admin/tickets/:id` for detail page.

### Phase 4: Hooks

**File: `src/hooks/queries/useOpsTickets.ts`**
- `useOpsTickets(filters)` - list with filters
- `useOpsTicket(id)` - single ticket detail
- `useTicketMessages(ticketId)` - messages
- `useTicketAuditLog(ticketId)` - audit log

### Phase 5: Seed Data

Insert 4 demo tickets via the migration:
1. RESERVATION / OWNER_CANT_FULFILL with a note
2. PRODUCT / DAMAGED_ON_RETURN
3. FINANCIAL / PAYMENT_ISSUE
4. USER / KYC_REVIEW

### Files to Create/Modify

| Action | File |
|--------|------|
| Create | Migration SQL (new tables, triggers, indexes, RLS, seed) |
| Create | `src/features/admin/opsTicketsApi.ts` |
| Create | `src/hooks/queries/useOpsTickets.ts` |
| Rewrite | `src/pages/admin/AdminTickets.tsx` (list page) |
| Create | `src/pages/admin/AdminTicketDetail.tsx` |
| Create | `src/pages/admin/AdminTicketCreate.tsx` |
| Modify | `src/App.tsx` (add routes for detail/create) |
| Modify | `src/components/admin/AdminSidebar.tsx` (no change needed, already has Tickete) |
| Delete/keep | `src/features/admin/ticketsApi.ts` (old API, will be replaced) |

### RBAC Note

The current `user_roles` table uses `app_role` enum with `admin`, `moderator`, `user`. Full RBAC (SUPPORT, FINANCE, KYC_REVIEWER) would require altering the enum and adding more roles. For this implementation, all ticket operations will be gated by `admin` role. UI-level role checks can be added later when the enum is expanded. A comment/TODO will be left in the code.

### Technical Considerations

- The `ops_tickets` table will NOT have foreign keys to `auth.users` (per guidelines). References to user IDs are plain uuid columns.
- Foreign keys to `rentals` and `products` tables will be added for referential integrity.
- The `public_id` sequence ensures unique, human-readable ticket IDs.
- SLA alert is purely UI-calculated (created_at + 2h vs now for URGENT+NEW tickets).

