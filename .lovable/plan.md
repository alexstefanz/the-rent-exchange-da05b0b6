## Goal
Reshape the `AccountHubMenu` dropdown (desktop + mobile sheet) to look like the attached screenshot, while keeping all current data sources and behavior.

## New layout (top → bottom)

1. **Account hero card** (kept as-is, light orange gradient)
   - Avatar + name + email + green verified dot
   - "Profil completat XX%" progress bar
   - Clicking opens `/contul-meu`

2. **Action buttons row**
   - Full-width orange gradient **"+ Adaugă anunț"** button (existing)
   - If admin: green **"Admin"** button next to it (existing logic kept)

3. **Two list rows** (white cards with icon circle, title, subtitle, chevron)
   - **Produsele mele** — "Gestionează anunțurile și cererile" → `/anunturi`
   - **Închirieri** — "Active și istoric" → `/rezervari` — only shown when the user has any rental activity (active as renter OR owner OR past completed rentals > 0)

4. **Balance card** (dark/near-black rounded card, like screenshot)
   - Label "BALANȚĂ DISPONIBILĂ" + orange **"Retrage"** pill button → `/castiguri`
   - Large amount in RON (uses `signals.availableBalance`)
   - Sub-line "+X RON luna aceasta" (new computation: sum of `owner_payout` transactions in current month — added to `useAccountDashboard`)
   - IBAN line: masked last 4 digits `RO•••XXXX` from `profile.iban`, or "IBAN neadăugat" link → `/castiguri` if missing

5. **Finalizează contul** row (compact, kept)
   - Shows X/5 completion with chevron → opens existing health flow (unchanged)

6. **Suport & Tickete** row (existing white card with badge for open tickets)

7. **Footer (sticky)**
   - RO / EN segmented switch (left)
   - "Ieși din cont" (right)

Removed from the dropdown:
- The 2×2 quick StatusCards grid (replaced by the two list rows + balance card)
- The standalone amber "Verifică-ți identitatea" KYC banner (KYC is still surfaced via "Finalizează contul" row)

## Files

- `src/hooks/useAccountDashboard.ts` — add `signals.monthlyEarnings` (sum of `owner_payout` transactions in current calendar month) and expose `signals.totalCompletedRentals`.
- `src/components/layout/AccountHubMenu.tsx` — rewrite `TopZone` / `MiddleZone` / `FooterZone` to match the new layout above. Reuse the existing `HeaderCard` (account hero) untouched. Add small internal components: `ListRow` (icon circle + title + subtitle + chevron) and `BalanceCard` (dark card with Retrage button + monthly + IBAN).

## Technical notes

- Balance card styling: `bg-zinc-900 text-white rounded-2xl p-4`, Retrage button `bg-primary hover:bg-[#F98715] rounded-full px-3 py-1.5 text-xs`.
- IBAN masking: keep last 4 chars, e.g. `RO•••4827`. If null → render "IBAN neadăugat" as a link to `/castiguri`.
- Monthly earnings query: filter completed `owner_payout` transactions where `created_at >= startOfMonth(now)`.
- Bilingual labels via `t()` (RO primary), consistent with project memory.
- No backend / RLS changes.
- Copyright/other footer items untouched (this is the menu, not the site footer).
