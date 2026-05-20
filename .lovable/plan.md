## Cauză

Pe `/recenzii`, tabul **Primite** încarcă toate rândurile din `product_reviews` care au `product_id` printre produsele tale, **fără să excludă recenziile pe care le-ai scris tu însăți**.

Când o închiriere se finalizează, atât proprietarul cât și chiriașul lasă câte o recenzie — ambele stocate în `product_reviews`. Pentru proprietar, propria recenzie (despre chiriaș) apare în plus la "Primite", părând duplicat.

## Fix

În `src/components/profile/ReviewsTab.tsx`, în queryQuery `["product-reviews-received", user?.id]`, adaugă filtrul `.neq("reviewer_id", user!.id)` la `supabase.from("product_reviews")...` — astfel propria recenzie nu mai apare la "Primite" (rămâne corect la "Date" prin query-ul `productGiven` care filtrează `reviewer_id = user.id`).

Nicio modificare de DB sau RLS. O singură linie schimbată.