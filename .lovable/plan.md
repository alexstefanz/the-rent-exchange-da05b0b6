## Problem
In the support widget admin inbox (image attached), each ticket card stretches horizontally beyond the widget container because ticket titles/last_message contain long unbroken strings (e.g. `@@@@@@…`). `line-clamp-1` only truncates wrapped lines — it does not break unbreakable words, so the card grows past its parent width.

## Fix
In `src/components/support/SupportChatWidget.tsx`, constrain the ticket cards so long unbroken content can't push them wider than the widget:

1. **Admin inbox cards (lines ~837–887)**
   - Add `min-w-0 overflow-hidden` to the `<button>` so its content is bounded.
   - Add `min-w-0 flex-1` to the public_id span / header row item that needs to shrink, and ensure the header `<div className="flex items-center gap-2 mb-1">` uses `min-w-0`.
   - Replace `line-clamp-1` / `line-clamp-1` on `ticket.title` and `ticket.last_message` paragraphs with `truncate break-all` (or `line-clamp-1 break-all`) so long unbroken `@@@…` strings are clipped instead of expanding the card.
   - Same treatment for `requester_name` (`truncate break-all`).

2. **Archive list cards (lines ~907–935)**
   - Same `min-w-0 overflow-hidden` on the button.
   - `break-all` on the title `<p>` (keep `line-clamp-2`).
   - `min-w-0` on the header row.

3. **Parent container check**
   - Confirm the `ScrollArea` and its `space-y-2` wrapper don't need `min-w-0` themselves; if cards still bleed, add `min-w-0` to the wrapping `<div className="space-y-2">`.

No business-logic / data changes — purely CSS classNames in the widget component.

## Verification
- Reload widget as admin, confirm cards stay within the panel width with long `@@@@…` titles, and short titles still look identical to before.
