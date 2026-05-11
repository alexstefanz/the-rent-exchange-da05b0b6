
# Owner Listings Dashboard — Premium Redesign

Transformăm `/anunțuri` (`ListingsPage` + `LendingsTab`) într-un dashboard premium pentru proprietari, mobile-first, cu statistici, filtre, status-uri, quick actions și insights.

## 1. Structură pagină nouă

`src/pages/ListingsPage.tsx` devine layout-ul complet (înlocuiește `LendingsTab`):

```
[ Header premium ]
[ Stats summary cards ]
[ Search + filters bar ]            (sticky pe scroll)
[ Bulk actions bar ]                (apare când selectezi)
[ Listings grid / list ]
[ Empty state / Skeletons ]
[ Mobile sticky CTA "Adaugă produs" ]
```

Componente noi în `src/components/listings/`:
- `ListingsHeader.tsx` — titlu, subtitlu, CTA "Adaugă produs"
- `ListingsStatsBar.tsx` — 6 carduri statistice (count-up animation)
- `ListingsFilterBar.tsx` — search + select-uri (status, categorie, oraș, sortare); pe mobil → `ListingsFilterSheet.tsx` bottom sheet
- `ListingsBulkActionsBar.tsx` — apare când există selecție
- `ListingCard.tsx` — card premium (cover image, status badge, preț, locație, mini-stats, quality score bar, primary CTA + dropdown "…")
- `ListingStatusBadge.tsx` — color-coded: Activ, În verificare, Draft, Ascuns, Respins, Indisponibil
- `ListingQuickActionsMenu.tsx` — dropdown cu Edit / View / Hide / Calendar / Cereri / Duplicate / Share / Delete
- `ListingAvailabilityDialog.tsx` — calendar pentru blocked_dates + toggle available_immediately
- `ListingInsightsPopover.tsx` — sugestii: "Adaugă mai multe poze", "Preț peste medie"
- `ListingsEmptyState.tsx` — premium empty + CTA
- `DeleteListingDialog.tsx` / `HideListingDialog.tsx` — confirmări cu impact

## 2. Statistici

Card-uri în `ListingsStatsBar`:
- Total produse
- Active
- În verificare (`approval_status = pending`)
- Drafturi (din `product_drafts`)
- Cereri noi (rentals `pending_owner_action` pentru produsele lui)
- Vizualizări luna aceasta (placeholder dacă nu există tabel — îl marcăm "în curând" doar dacă lipsește)
- Câștiguri generate (din `owner_payouts` agregat — folosește RPC existent)

Hook nou: `src/hooks/queries/useOwnerListingsStats.ts` — un singur RPC nou `get_owner_listings_stats(owner_id)` care întoarce toate valorile într-un singur round-trip.

## 3. Filtre & sortare

State local în `ListingsPage`:
- `search` (debounced)
- `status` (all / active / pending / draft / hidden / rejected)
- `category`, `city`
- `sort` (recent / popular / most_booked / price_asc / price_desc / availability)

Filtrare client-side peste `useMyProducts` (dataset mic per owner). Pentru `most_booked` / `popular` îmbogățim datele cu `times_rented` și `views_count` printr-un RPC `get_owner_products_with_stats` sau extindem `getMyProducts`.

## 4. Quality score & insights

Reutilizăm `computeQualityScore` din `src/lib/qualityScore.ts` — afișăm bară mică în card + popover cu sugestii.

Insights simple, derivate client-side:
- < 3 imagini → "Adaugă mai multe poze"
- descriere < 80 caractere → "Completează descrierea"
- preț > 1.3× media categoriei → "Preț peste media categoriei" (folosind agregat din lista curentă)
- 0 disponibilitate următoarele 7 zile → "Verifică disponibilitatea"

## 5. Quick actions & realtime

- Primary action pe card: **Editează**
- Secondary: **Vezi anunț**
- Dropdown "…": Calendar, Cereri, Ascunde/Reactivează, Duplicate, Share (Web Share API), Șterge

Realtime via Supabase channel pe `products` (filtru `owner_id`) și `rentals` (filtru `owner_id`) → invalidează `my-products` & stats.

## 6. Bulk actions

Checkbox pe card (vizibil pe hover desktop / always pe mobil în mod selecție). Bara apare sticky jos cu: Activează / Ascunde / Șterge / Update preț (dialog cu % sau valoare nouă).

## 7. Mobile-first

- Stats: scroll orizontal cu snap
- Filter bar: buton "Filtre" → bottom sheet (`Sheet` shadcn)
- Card vertical full-width, touch targets ≥ 44px
- CTA "Adaugă produs" sticky bottom (peste `MobileBottomNav` cu offset corect)

## 8. Backend (minim necesar)

Migrație nouă:
```sql
-- RPC agregat pentru stats owner
create or replace function public.get_owner_listings_stats(p_owner uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'total', (select count(*) from products where owner_id = p_owner and deleted_at is null),
    'active', (select count(*) from products where owner_id = p_owner and is_active and approval_status = 'approved' and deleted_at is null),
    'pending', (select count(*) from products where owner_id = p_owner and approval_status = 'pending' and deleted_at is null),
    'hidden', (select count(*) from products where owner_id = p_owner and not is_active and deleted_at is null),
    'rejected', (select count(*) from products where owner_id = p_owner and approval_status = 'rejected' and deleted_at is null),
    'drafts', (select count(*) from product_drafts where owner_id = p_owner),
    'new_requests', (select count(*) from rentals where owner_id = p_owner and status in ('pending_owner_action')),
    'earnings_total', coalesce((select sum(amount) from owner_payouts where owner_id = p_owner and status = 'completed'),0)
  );
$$;
```

Coloană opțională `views_count` pe products doar dacă nu există (verificăm întâi). Dacă lipsește, ascundem statistica "Vizualizări" elegant.

## 9. Files atinse

Create:
- `src/components/listings/*` (toate de mai sus)
- `src/hooks/queries/useOwnerListingsStats.ts`
- `src/hooks/queries/useOwnerListingsRealtime.ts`
- 1 migrație SQL

Editate:
- `src/pages/ListingsPage.tsx` — layout nou
- `src/components/dashboard/LendingsTab.tsx` — folosit ca fallback simplificat sau înlocuit cu noile componente
- `src/features/products/productsApi.ts` — extindem `getMyProducts` cu stats opționale
- `src/data/uxCopy.ts` — copy bilingv pentru toate string-urile

## 10. Out of scope (clarificări)

Dacă vrei și acestea le adăugăm într-un follow-up:
- Tabel real de `product_views` pentru vizualizări (acum afișăm doar dacă există date)
- Duplicate listing → necesită endpoint dedicat care clonează produsul ca draft
