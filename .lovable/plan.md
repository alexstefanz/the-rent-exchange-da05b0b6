

## Plan: Migrare funcția de test la sistemul Lovable Email

### Problema actuală
- `test-email-notifications` trimite prin Resend API direct (vechi)
- `send-transactional-email` funcționează doar cu JWT (necesită login)
- Singurul template React Email înregistrat este `welcome` — celelalte 11 tipuri de notificări nu există încă

### Pași de implementare

**Pasul 1: Creare template-uri React Email pentru toate notificările**

Creare 8 template-uri noi în `supabase/functions/_shared/transactional-email-templates/`:
- `rental-request-owner.tsx` — cerere nouă (pentru owner)
- `rental-request-renter.tsx` — confirmare cerere trimisă (pentru renter)
- `rental-accepted.tsx` — cerere acceptată
- `rental-rejected.tsx` — cerere refuzată
- `cancellation-owner.tsx` — anulare (owner)
- `cancellation-renter.tsx` — anulare (renter)
- `new-message.tsx` — mesaj nou
- `review-received.tsx` — recenzie primită
- `product-published.tsx` — produs publicat
- `password-changed.tsx` — parolă schimbată
- `account-deactivation.tsx` — dezactivare cont

Toate cu branding Rentli (header portocaliu #F59E0B, font Plus Jakarta Sans, background #FAF9F7, conținut în română).

**Pasul 2: Actualizare registry.ts**

Înregistrare toate template-urile noi în `TEMPLATES` map.

**Pasul 3: Rescriere `test-email-notifications`**

Modificare funcția de test să invoce `send-transactional-email` intern (cu service role key, ocolind JWT) în loc de Resend API direct. Astfel testul va valida întregul pipeline: template → enqueue → process-email-queue → trimitere de pe `noreply@rentli.ro`.

**Pasul 4: Deploy și test**

Deploy toate funcțiile modificate și trimitere email de test pentru validare.

### Rezultat
- Toate emailurile de test se trimit prin noul sistem Lovable (de pe `noreply@rentli.ro`)
- Pipeline-ul complet este validat: render template → enqueue pgmq → cron dispatch → delivery
- Pagina `/admin/test-emails` funcționează cu noul sistem

