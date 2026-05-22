# Buton telefon doar după plată confirmată

## Problemă

În prezent în `ChatHeader`, butonul de telefon apare ori de câte ori avem numărul proprietarului, indiferent dacă rezervarea a fost plătită sau nu. Butonul "Vezi produsul" apare doar ca fallback când nu există telefon. Rezultat: butonul produsului nu se vede aproape niciodată înainte de plată.

## Modificare

Logica devine condiționată de starea de plată a închirierii:

- **Înainte de plată** (sau fără context de închiriere): se afișează butonul **„Vezi produsul"** (icon `Package`) care duce la pagina produsului.
- **După confirmarea plății** (`rental.paid_at` setat sau `payment_status === "paid"`): se afișează butonul **telefon** (`tel:` link) către numărul proprietarului.

## Fișiere afectate

- `src/components/messaging/ChatHeader.tsx` — adaugă prop `showPhone: boolean`. Telefonul se randează doar când `showPhone && phone`; altfel se randează butonul `productUrl`.
- `src/components/messaging/ChatPanel.tsx` — calculează `const isPaid = !!rentalCtx?.paid_at || rentalCtx?.payment_status === "paid";` și trimite `showPhone={isPaid}` către `ChatHeader`. `productUrl` rămâne calculat ca acum.

Nicio altă schimbare de comportament sau backend.
