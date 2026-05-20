## Problem

Cererile `pending` cu `start_date` deja trecut pot fi încă acceptate, ceea ce creează rezervări pentru date din trecut.

## Soluție (doar frontend, scop minim)

În `src/components/dashboard/RentalsOutTab.tsx`, în cardul cererilor de închiriere:

1. Calculează `isExpired = isPending && new Date(rental.start_date) < startOfToday()`.
2. Înlocuiește badge-ul "Cerere nouă" cu badge **"Expirată"** (`bg-muted text-muted-foreground`) când `isExpired`.
3. Pentru cererile expirate:
   - Ascunde butonul **Acceptă** (sau îl dezactivează cu tooltip "Perioada a expirat").
   - Lasă vizibil butonul **Refuză** ca singura acțiune.
4. Adaugă un mesaj subtil sub butoane: "Data de început a trecut. Cererea nu mai poate fi acceptată."
5. La sortare/grupare: cererile expirate rămân în secțiunea "Cereri de închiriere" până sunt refuzate manual (vizibilitate pentru proprietar).

## Files

- `src/components/dashboard/RentalsOutTab.tsx` (~15 linii)

## Out of scope

- Auto-expirare în DB / cron job — poate fi o îmbunătățire ulterioară dacă vrei să dispară automat.