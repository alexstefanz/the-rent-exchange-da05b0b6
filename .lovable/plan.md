# Vizualizări pe pagina de produs

Momentan produsul nu are deloc contorizare de vizualizări (nu există tabel sau câmp pentru asta), doar „persoane urmăresc” (favorite). Adăugăm o contorizare reală și o afișăm în bara de sub titlu, lângă „Închiriat de X ori”.

## Ce vede utilizatorul
- Sub titlul anunțului apare un badge nou: „128 vizualizări” / „128 views”, în același stil cu celelalte.
- Se afișează doar dacă produsul are cel puțin o vizualizare.
- Vizualizarea se înregistrează la deschiderea paginii produsului, o singură dată per vizitator la 24h (nu se umflă la refresh). Proprietarul care își vede propriul anunț nu adaugă vizualizări.

## Detalii tehnice
- Tabel nou `product_views` (product_id, user_id nullable, visitor_hash, created_at) cu GRANT-uri și RLS: nimeni nu citește direct din client; scrierea se face doar prin funcție.
- RPC `track_product_view(p_product_id, p_visitor_hash)` SECURITY DEFINER: inserează doar dacă nu există deja o vizualizare pentru același vizitator/produs în ultimele 24h; ignoră proprietarul.
- `get_product_extended_stats` se extinde cu `views_count` (număr total de rânduri din `product_views`), ca să nu adăugăm un query nou.
- Frontend:
  - `ProductDetail.tsx`: apel `track_product_view` la montare, cu un `visitor_hash` stabil păstrat în `localStorage`.
  - `SocialProofStrip.tsx`: prop nou `viewsCount` + badge cu iconița `Eye`; iconița existentă pentru „urmăresc” devine `Users` ca să nu se confunde.
  - `useProductExtendedStats.ts`: adăugat `views_count` în tip.
