# Eliminare „Generează cu AI" din formularul de publicare

## Frontend (`src/components/publish/PublishWizard.tsx`)
- Scot butonul „Generează cu AI" și header-ul flex de pe label-ul „Descriere" (liniile 816–831) — rămâne doar `<Label>` simplu.
- Șterg `handleGenerate` și state-ul `genLoading` (liniile 702, 707–729).
- Scot importurile nefolosite: `Sparkles` (linia 6), `generateProductDescription` (linia 53), și `Loader2` dacă nu mai e folosit altundeva în fișier.

## Cleanup
- Șterg fișierul `src/features/publish/aiDescriptionApi.ts` (nu mai are alți consumatori).
- Șterg edge function-ul `supabase/functions/generate-product-description/` (nu mai are alți consumatori).

Restul featurilor AI din proiect (suport chat, auto-traducere produse, asistent admin) rămân neatinse — cererea vizează doar butonul de generare text din wizardul de publicare.
