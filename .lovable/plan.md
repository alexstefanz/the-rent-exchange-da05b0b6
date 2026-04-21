

## Plan: Fix link "Vezi cererea" din emailul ownerului

### Problemă confirmată

În `supabase/functions/_shared/transactional-email-templates/rental-request-owner.tsx`, butonul "Vezi cererea" trimite către:
```
https://rentli.ro/rentals
```
Această rută **nu există** în aplicație — de aceea ownerul ajunge pe pagina 404.

Rutele reale (din `src/App.tsx`):
- `/anunturi` → `ListingsPage` (unde proprietarul vede cererile primite — `LendingsTab`)
- `/rezervari` → `RentalsPage` (rezervările făcute de tine ca renter)
- `/cereri` → `RequestsPage` (cereri trimise de tine ca renter)

Pentru owner, link-ul corect este **`/anunturi`**, opțional cu `?rental_id=<id>` ca să poată evidenția cererea respectivă (link-ul intern din notificarea push folosește deja acest format).

### Modificări

#### 1. `supabase/functions/_shared/transactional-email-templates/rental-request-owner.tsx`
- Schimb URL-ul butonului din `https://rentli.ro/rentals` → `https://rentli.ro/anunturi?rental_id={rentalId}`.
- Adaug `rentalId` în interface-ul `Props` (opțional, cu fallback la `/anunturi` simplu dacă lipsește).
- Actualizez `previewData` cu un `rentalId` mock pentru previzualizare.

#### 2. `supabase/functions/_shared/transactional-email-templates/rental-request-renter.tsx`
- Adaug și aici un buton `Vezi statusul` → `https://rentli.ro/cereri?rental_id={rentalId}` (în prezent template-ul nu are buton — userul nu are unde da click). Asigur consistența cu emailul ownerului.
- Adaug `rentalId` în props.

#### 3. `supabase/functions/send-rental-notification/index.ts`
- Pasez `rentalId: rental.id` în `templateData` pentru ambele invocări `send-transactional-email` (owner + renter).

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `supabase/functions/_shared/transactional-email-templates/rental-request-owner.tsx` | URL buton → `/anunturi?rental_id={rentalId}` |
| `supabase/functions/_shared/transactional-email-templates/rental-request-renter.tsx` | Adaug buton CTA → `/cereri?rental_id={rentalId}` |
| `supabase/functions/send-rental-notification/index.ts` | Pasez `rentalId` în `templateData` |

### Rezultat așteptat

- Click pe "Vezi cererea" în emailul ownerului → ajunge corect pe `/anunturi` cu cererea evidențiată, **nu mai dă 404**.
- Renterul primește un buton clar "Vezi statusul" care duce pe `/cereri` cu rezervarea lui.
- Ambele template-uri rămân branded (portocaliu Rentli), păstrând stilul existent.

### Limitări recunoscute

- Email-urile vechi deja trimise rămân cu link-ul greșit (nu pot fi modificate retroactiv). După deploy, toate email-urile noi vor avea link-ul corect.
- Evidențierea automată a cererii pe `/anunturi` în baza `rental_id` din query string există deja prin notificarea push — comportamentul va fi identic și din email.

