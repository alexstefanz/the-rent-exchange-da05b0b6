# Ascunde datele de contact până la plată

## Problemă

În panoul lateral (`InfoPanel.tsx`), tab-ul **Contact** afișează telefonul și emailul proprietarului ori de câte ori `getOwnerContactInfo` returnează date — nu verifică dacă rezervarea este plătită. Rezultat: cumpărătorul vede numărul/emailul înainte de a plăti.

## Modificare

`InfoPanel` primește o stare de plată din `Messages.tsx` și ascunde contactul până la confirmarea plății.

### Fișiere

1. **`src/components/messaging/InfoPanel.tsx`**
   - Adaugă prop `rentalsId?: string | null`.
   - Query `rentals` (sau folosește `getRentalContext`) pentru a obține `paid_at` și `payment_status`.
   - `const isPaid = !!rental?.paid_at || rental?.payment_status === "paid";`
   - În tab-ul Contact: dacă `!isPaid` → afișează exclusiv mesajul existent „Datele de contact vor fi vizibile după plată / Contact info will be visible after payment." (fără telefon/email).
   - Dacă `isPaid` → afișează contactul ca acum.
   - Bonus: evită apelul `getOwnerContactInfo` când `!isPaid` (nu mai expune datele inutil).

2. **`src/pages/Messages.tsx`**
   - Adaugă `rentalsId={selectedConversation.rentals_id || null}` la ambele instanțe `<InfoPanel ... />` (mobil + desktop).

Nicio modificare backend.
