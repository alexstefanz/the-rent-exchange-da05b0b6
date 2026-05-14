## Ce se schimbă

După ce chiriașul plătește, proprietarul primește o notificare în aplicație + un email cu mesajul:

> **„[Nume chiriaș] a făcut plata pentru închirierea produsului „[Produs]". Începeți discuția pe chat. După ce ați stabilit data și ora predării produsului, completați procesele verbale. Este nevoie de câteva poze înainte din partea ambelor părți pentru a ne asigura că produsul se predă și se întoarce la fel."**

Procesele verbale rămân deblocate la fel ca acum — după ce proprietarul apasă **Acceptă cererea** (≡ acceptă termenii). Nu adăugăm un pas separat.

## Modificări tehnice

1. **`supabase/functions/send-rental-notification/index.ts`**
   - Schimb titlul + descrierea notificării `rental_request` pentru owner:
     - `title_ro`: „Plată primită — începe chatul"
     - `title_en`: „Payment received — start the chat"
     - `description_ro`: textul de mai sus (cu numele chiriașului și produsul interpolate)
     - `description_en`: traducere echivalentă
   - Link rămâne către `/inchirieri?rental_id=...` (de unde owner deschide chatul + acceptă cererea).
   - Notificarea pentru chiriaș (`rental_confirmation`) rămâne neschimbată.

2. **`supabase/functions/_shared/transactional-email-templates/rental-request-owner.tsx`**
   - Rescriu copy-ul: subiect → „Plată primită pentru [Produs] — începe chatul"
   - Body: paragraful complet cu mențiunea chat-ului, stabilirii datei/orei și cerinței celor câteva poze înainte din partea ambelor părți pentru PV.
   - Păstrez butonul CTA „Deschide chatul" (link către pagina rentalului) + secțiunea cu detaliile rezervării (produs, perioadă, preț).
   - Sanitizare cu `escapeHtml` pe toate valorile dinamice (există deja).

3. **Deploy** funcțiile `send-rental-notification` (nu necesită — citește template-uri prin `send-transactional-email`) și redeploy `send-transactional-email` ca să preia template-ul actualizat din registry.

## Ce nu se schimbă

- Fluxul Stripe / `verify-stripe-payment` (rămâne identic — el deja apelează `send-rental-notification`).
- Crearea conversației după plată (deja se face automat în `verify-stripe-payment`).
- Logica de deblocare PV (rămâne legată de acceptarea cererii de către owner).
- Notificările / mail-urile pentru chiriaș.
- Schema bazei de date.
