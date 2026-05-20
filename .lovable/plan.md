# Auto-grow user input in SupportChatWidget

Replace the single-line `<Input>` used for the user-side message input with an auto-resizing `<Textarea>`, mirroring the behavior already implemented in `TicketChat.tsx`.

## Changes — `src/components/support/SupportChatWidget.tsx`

1. Import `Textarea` from `@/components/ui/textarea`.
2. Add a `useRef<HTMLTextAreaElement>` (one ref is enough — both input blocks render conditionally and never simultaneously).
3. In both input blocks (lines ~973 and ~1195), swap `<Input>` → `<Textarea>`:
   - `rows={1}`, `className="text-sm flex-1 rounded-2xl resize-none overflow-y-auto min-h-9 max-h-40 py-2"`.
   - `onChange`: update state AND set `el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 160) + "px"`.
   - Keep `onKeyDown` Enter-to-send (Shift+Enter for newline).
   - Align container to `items-end` so the send button stays at the bottom as the textarea grows.
4. In `handleSendTicketMessage` success / after `setMessageText("")`, reset `textareaRef.current.style.height = "auto"`.

No backend or business-logic changes.
