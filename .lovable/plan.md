## Enlarge header icons by ~25%

Bump icon sizes in the header so the Chat/Favorites/Bell glyphs and the avatar trigger feel ~25% larger on both desktop and mobile. Pure presentational change, no logic.

### Changes

**`src/components/layout/Navbar.tsx`**
- Desktop Chat: `MessageCircle` `h-4 w-4` → `h-5 w-5` (16→20px).
- Desktop Favorites: `Heart` `h-5 w-5` → `h-6 w-6` (20→24px).

**`src/components/layout/NotificationBell.tsx`** (used on both desktop and mobile)
- `Bell` `h-5 w-5` → `h-6 w-6` (20→24px).
- Trigger button: switch from `size="icon"` (h-10 w-10) to a slightly larger square (`h-11 w-11`) so the icon doesn't crowd the button.

**`src/components/layout/AccountHubMenu.tsx`** (desktop trigger avatar)
- Avatar in trigger: `h-8 w-8` → `h-10 w-10` (32→40px).
- Keep the rest of the dropdown unchanged.

**Mobile avatar** — the mobile header avatar lives in the menu trigger button. Confirm whether the user wants the Menu/avatar button at the right of the mobile navbar enlarged too; today it shows a `Menu`/`X` icon (`h-5 w-5`) inside an `h-10 w-10` button. Bump that icon to `h-6 w-6` to match.

### Out of scope
- No layout/spacing redesign, no color or animation changes.
- Notification badge size stays the same so it still reads as a small dot.