## Problem

Un anunț cu status **Respins** se comportă în prezent ca un anunț public:
- Click pe card → se deschide pagina publică `/produs/...` cu calendar de rezervare și buton „Întreabă proprietarul"
- Din meniul cardului din `/anunțuri` se poate apăsa „Disponibilitate" și modifica zile blocate / disponibilitate imediat

Un anunț respins nu ar trebui să fie vizibil public și nu ar trebui să permită setări de disponibilitate până la republicare/aprobare.

## Schimbări

### 1. `src/components/listings/ListingCard.tsx`
- Pentru `status === "rejected"`:
  - Ascunde butonul „Disponibilitate" (icon Calendar) din toolbar
  - Elimină itemul „Disponibilitate" din DropdownMenu
  - „Vezi anunț" și click pe imagine/titlu → în loc de link la pagina publică, navighează direct la `/owner/edit-product/{id}` (sau dezactivat cu tooltip „Anunț respins — editează pentru republicare")
  - Păstrează doar acțiunile: Editează, Distribuie (opțional dezactivat), Reactivează (nu se aplică), Șterge

### 2. `src/pages/ListingsPage.tsx`
- În `handlers`, ignoră deschiderea dialogului `ListingAvailabilityDialog` dacă produsul e `rejected` (safety net): nu mai pasăm `onCalendar` pentru produse respinse

### 3. `src/pages/ProductDetail.tsx`
- După încărcarea produsului, calculează `isOwner = user?.id === product.owner_id` și `isPubliclyVisible = product.approval_status === "approved" && product.is_active`
- Dacă `!isPubliclyVisible && !isOwner` → randează pagina 404 (NotFound) sau redirect către home
- Dacă `!isPubliclyVisible && isOwner` → afișează un banner sticky în partea de sus a paginii:
  - `pending`: „Anunț în așteptarea aprobării — nu este vizibil public"
  - `rejected`: „Anunț respins — nu este vizibil public. Editează pentru republicare." + buton „Editează"
- Ascunde widgetul de rezervare (calendar + preț + buton „Întreabă proprietarul"/„Rezervă") când produsul nu e public; păstrează doar previzualizarea conținutului (galerie, descriere, locație) pentru proprietar

### Out of scope
- Fără schimbări de DB / RLS (RLS-ul permite deja owner-ului să-și vadă produsul, iar publicul nu îl vede prin filtrele existente — singura problemă e UI-ul care îl tratează ca public)
- Fără schimbări la fluxul admin de aprobare/respingere
