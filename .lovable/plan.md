## Hide balance toggle

Add an eye toggle on the "Balanță disponibilă" card inside `AccountHubBody` (used by both the desktop My Account dropdown and the mobile off-canvas drawer). One change covers both surfaces.

### UX
- Small icon button next to the "Balanță disponibilă" label (left of the "Retrage" button), using `Eye` / `EyeOff` from lucide-react.
- When hidden:
  - Amount renders as `•••• RON`
  - The "+X RON luna aceasta" line is masked as `••• RON …`
  - IBAN tail `•••XXXX` becomes `••••••••` (the "IBAN neadăugat" CTA stays visible if no IBAN)
- Tooltip / aria-label: "Ascunde balanța" / "Hide balance" and "Afișează balanța" / "Show balance".
- Default: visible.

### Persistence
- Store preference in `localStorage` under key `rentli:hideBalance` (`"1"` / `"0"`).
- Read on mount, write on toggle. No backend/DB change.

### Files touched
- `src/components/layout/AccountHubMenu.tsx` — inside `AccountHubBody`, add `hideBalance` state + toggle button + masked rendering for amount, monthly earnings, and IBAN tail.

No other files change; the mobile drawer already renders `AccountHubBody`, so the toggle appears there automatically.
