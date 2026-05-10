## Goals

Improve the homepage hero search (`src/components/home/SmartSearch.tsx`) on three fronts requested by the user.

### 1. Location-aware search ("Bicicleta Iași")

When the user types a query that contains a Romanian county or city, route to `/cauta` with both `q` and `judet`/`localitate` set so results are filtered by location.

How:
- Build a lookup index from `src/data/romaniaLocations.ts` (`judete` + their `localitati`) once via `useMemo`, normalized (lowercase, diacritics stripped).
- On submit (and on suggestion click), tokenize the query, scan tokens (longest-match first, supports 2-word cities like "Cluj Napoca") against the index. If a match is found:
  - Strip the matched location tokens from the search query.
  - Append `judet=...` and, when a city matches, `localitate=...` to the URL.
  - If only the leftover query is empty, still navigate with the location filters.
- Add a small visual hint inside the dropdown when a location is detected: a `MapPin` chip showing "Caut «bicicletă» în Iași / Searching «bike» in Iași" so the user knows it parsed correctly.
- Live product suggestions query stays the same (uses original title `ilike`), but we strip the location term when probing so suggestions stay relevant.

### 2. Readable text on the blurred dropdown (poza 2)

Current popover uses `bg-background/98` which on the dark hero appears blurred-dark, and its text uses `text-foreground` / `text-muted-foreground` — invisible against the dark blur.

Change inside `PopoverContent`:
- Switch surface to a translucent dark glass: `bg-black/55 backdrop-blur-xl border-white/10`.
- Section headers ("Sugestii", "Căutări recente", "În tendințe"): `text-white/70`.
- Suggestion rows, recent rows: `text-white`, leading icon `text-white/70`, hover `hover:bg-white/10`.
- Trailing chevron / category label: `text-white/50`.
- Trending pills: `bg-white/10 text-white hover:bg-white/15` (drop the orange-on-orange combo that disappears on the blur).
- "Șterge" clear-recent button: `text-white/60 hover:text-white`.

The input itself (above, on white card) stays unchanged.

### 3. Trending bug after typing then clicking away (poza 3)

Repro: type "playstation" → click outside → popover closes, but next focus shows broken/empty state.

Root causes in current code:
- `suggestions` state is left populated from the previous query. When the user re-opens with a stale query, the "Sugestii" block renders but "Recent" / "Trending" blocks render conditionally on `query.trim().length < 2`, producing a half-empty UI.
- The popover only opens via `onFocus` / `onChange`; clicking back into the input when it already has focus does not reopen it.
- The debounce timeout is not cleared on close, so a stale fetch can still set suggestions after close.

Fixes:
- Add `onClick` on the input that sets `setOpen(true)`.
- When popover closes (`onOpenChange(false)`), clear any pending debounce.
- Always render the "Trending" section (even when there are suggestions) so the dropdown never looks empty; reorder: Suggestions → Recent → Trending.
- Guard the suggestions block so it only renders when both `query.length >= 2` AND suggestions exist; otherwise fall through to recent + trending.
- Ensure the trending block is shown unconditionally at the bottom — this also matches the design in poza 1 where trending should always be visible.

## Out of scope

- No backend / RPC changes.
- No changes to `Search.tsx` filtering (it already accepts `q`, `judet`, `localitate`).
- No changes to `HeroSearchForm.tsx` (legacy form, not currently mounted on the redesigned hero).

## Files touched

- `src/components/home/SmartSearch.tsx` — all three changes above.

## Technical notes

- Diacritics stripping: `s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()`.
- Location matching priority: city match wins over county match; longest token sequence wins to handle "Cluj Napoca", "Baia Mare", "Târgu Mureș".
- Keep the component a single file, no new deps.
