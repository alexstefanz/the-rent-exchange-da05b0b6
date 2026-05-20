# Open ticket in full support page from widget

Add a button in the `SupportChatWidget` header (visible when a ticket conversation is open) that navigates the user to the full support page with that ticket pre-opened, then closes the floating widget.

## Changes

**File:** `src/components/support/SupportChatWidget.tsx`

1. In the active-ticket header (next to the 3-dot menu / close button), add a new icon button using `Maximize2` (or `ExternalLink`) from `lucide-react`.
2. On click:
   - `navigate(\`/suport?open=${ticketId}\`)` using `useNavigate` (already imported elsewhere in the file, or add it).
   - Close the widget panel (call the same handler used by the `X` button).
3. Tooltip / aria-label: RO `"Deschide în pagina de suport"`, EN `"Open in support page"`.
4. Visible for both customer and admin views as long as a `ticketId` is active. Hidden in the inbox/empty state.

`UserTickets.tsx` already reads `?open=<id>` into `selectedId`, so no changes needed there.

## Out of scope
- No new routes, no admin redirect to `/admin/tickete`, no design system changes.
