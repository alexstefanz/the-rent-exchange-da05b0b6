## Obiectiv

În chat, pentru o cerere de închiriere care **nu a fost încă plătită**, lângă titlul produsului trebuie să apară un buton **„Vezi produs"** care duce la pagina publică a produsului. Timeline-ul actual (stepper + TransactionCard) rămâne ascuns până când rezervarea este plătită — apoi reapare exact ca acum.

## Modificări

### 1. `src/features/messaging/messagingApi.ts`
- În `RentalContextRow` adaug câmpul `product_slug: string | null`.
- În `getRentalContext`, extind select-ul produsului la `product:products(title, images, slug)` și populez `product_slug` în obiectul returnat.

### 2. `src/components/messaging/ChatPanel.tsx`
- Derivez `isPaid = !!rentalCtx?.paid_at || rentalCtx?.payment_status === 'paid'`.
- Construiesc `productUrl` cu helperul existent `getProductUrlFromTitle(rentalCtx.product_title, rentalCtx.product_id)` dacă `product_slug` lipsește, altfel `/produs/<slug>`.
- Blocul `rentalCtx && (...)` se ramifică:
  - **Dacă `!isPaid`**: randez o bară simplă (fără toggle, fără stepper, fără TransactionCard) — imagine + titlu produs + cod `RNT-…` în stânga, iar în dreapta un buton `<Button asChild variant="outline" size="sm">` cu `<Link to={productUrl}>Vezi produs / View product</Link>` (bilingual prin `t()`).
  - **Dacă `isPaid`**: păstrez exact comportamentul curent (toggle + `RentalStageStepper` + `TransactionCard`).
- Fără alte schimbări de logică, RPC, sau realtime.

## Acoperire

- Funcționează identic pentru proprietar și chiriaș (ambele văd link spre produs până la plată).
- După plată, UI-ul revine la timeline-ul deja existent, fără regresii.
- Pe mobil bara rămâne pe lățime, butonul „Vezi produs" se păstrează la dreapta.
