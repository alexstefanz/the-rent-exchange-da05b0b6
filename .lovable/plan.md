# Reparație stripe-return mobil: pagina afișează cod HTML brut după plată

## Problema
După plată din aplicația mobilă, utilizatorul vede codul sursă HTML al paginii de retur în loc să fie redirecționat automat în aplicație. Diacriticele apar corupte. Cauza este că versiunea deployată a funcției `stripe-return` returnează probabil `Content-Type: text/plain` în loc de `text/html; charset=utf-8`.

## Verificări prealabile efectuate
- Fișierul local `supabase/functions/stripe-return/index.ts` are deja headerul corect: `Content-Type: text/html; charset=utf-8`.
- Diacriticele din fișierul local sunt codate corect în UTF-8 (`ă`, `î`, `ș`, `…`).
- Prin urmare, codul sursă este OK; problema este la deployul live.

## Ce se va face
1. Redeploy al funcției Edge Function `stripe-return` pentru a publica versiunea actuală.
2. Verificare imediată prin `curl`:
   - Headerul `Content-Type` să fie `text/html; charset=utf-8`.
   - Corpul răspunsului să conțină textul românesc corect (`Te redirecționăm în aplicație…`), nu codul brut.
3. Dacă `curl` confirmă funcționarea, se închide ticketul.

## Dacă problema persistă după redeploy
Se investighează dacă există un proxy/cach (Supabase CDN, browser in-app) care forțează alt `Content-Type`. Se poate adăuga și un header explicit de cache control (`Cache-Control: no-store`) pentru a evita servirea unei versiuni vechi.
