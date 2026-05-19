## Pop-up chiriaș: două stări (acceptat / refuzat)

Proprietarul rămâne neschimbat (Acceptă / Refuză). Pop-up-ul de chiriaș devine "rezultatul cererii" cu două variante.

### Stare 1: Cerere ACCEPTATĂ
- Badge: "CERERE APROBATĂ" (portocaliu, ca acum).
- Conținut: avatar/nume proprietar, card produs, perioadă, sumă.
- Butoane (stivuite mobil, alăturate desktop):
  - Primar: **Vezi produsul** → navighează la pagina produsului (`/produs/<slug>` sau `/p/<slug>`, ruta existentă; folosesc `product_slug`/`product_id` din `RentalPopupItem`).
  - Secundar: **Mai târziu** → închide.
- Eliminăm complet butonul de chat din pop-up (chat-ul rămâne disponibil din pagina de mesaje / rezervări, dar nu mai face parte din acest popup).

### Stare 2: Cerere REFUZATĂ (nouă)
- Badge: "CERERE REFUZATĂ" (gri/roșu subtil, folosind tokens semantice — `bg-muted` + text `muted-foreground`, sau `destructive/10`).
- Mesaj clar: "Din păcate, proprietarul nu a putut accepta cererea ta pentru acest produs. Îți recomandăm să cauți produse similare disponibile."
- Card produs păstrat (cu titlu + perioadă), fără sumă (sau cu sumă tăiată — preferă fără pentru a nu sublinia tranzacția eșuată).
- Butoane:
  - Primar: **Vezi produse similare** → navighează la pagina categoriei produsului refuzat (`/categorie/<slug_categorie>`) sau, dacă nu avem categoria în payload, la `/cautare?q=<titlu>`. Voi folosi categoria dacă o expun din RPC; altfel fallback pe căutare cu titlul.
  - Secundar: **Închide** → marchează ca văzut, dispare.

### Modificări tehnice

**Bază de date (migrare):**
- RPC `get_rental_popups` — extind să returneze și rezervările cu `status = 'cancelled'`, `renter_id = auth.uid()`, `cancelled_by = owner_id` și `renter_seen_confirmation = false` (reutilizez aceeași coloană ca "seen decision"; semantica devine "chiriașul a văzut decizia proprietarului — confirmare sau refuz").
- RPC `get_rental_popup_by_id` — fără schimbare structurală, dar trebuie să accepte și `cancelled`.
- Adaug în payload `category_slug` (de la `products.category` join cu `platform_categories`) și `outcome` (`'confirmed' | 'rejected'`) pentru a ști clar ce să afișeze.
- Realtime în `RentalPopupManager`: la `UPDATE` pe `rentals` cu `renter_id=eq.<uid>`, declanșez popup și când `status` trece din `pending` în `cancelled` AND `cancelled_by === owner_id` (verific în payload `new.cancelled_by === new.owner_id`).

**Frontend:**
- `popupApi.ts`: extind `RentalPopupItem` cu `outcome` și `category_slug`.
- `RentalRequestPopup.tsx`: trei moduri — `owner` (neschimbat), `renter-approved`, `renter-rejected`. Sau păstrez `mode='renter'` și un câmp suplimentar `outcome`. Render condițional pentru badge, mesaj, sumă, butoane.
- `RentalPopupManager.tsx`: înlocuiesc `handleChat` cu `handleViewProduct` (navighează la pagina produsului via `product_slug`) și adaug `handleViewSimilar` (navighează la categoria sau pagina de căutare). Marchează ca văzut în ambele cazuri prin `mark_renter_confirmation_seen` (RPC-ul existent acoperă ambele outcome-uri).
- Actualizez memoria `mem/features/rental-request-popup.md` cu noile fluxuri.

### Ce NU include
- Nu modific fluxul de chat / mesagerie.
- Nu introduc o coloană nouă în DB; reutilizez `renter_seen_confirmation`.
- Nu schimb layoutul pop-up-ului pentru proprietar.