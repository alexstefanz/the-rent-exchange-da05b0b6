

# Fix "Vezi cererea" - navigare directa la cerere + chat

## Problema
Butonul "Vezi cererea" din ecranul de confirmare duce la `/profile?tab=rentals`, dar Profile-ul foloseste hash-uri (`#cereri`). In plus, nu duce la cererea specifica si nu permite initierea discutiei.

## Solutie

### 1. Transmite rental ID-ul la BookingConfirmation
- In `Checkout.tsx`, `createRental` returneaza deja obiectul rental cu `id`
- Salvez `rental.id` si `product.ownerId` in state si le pasez la `BookingConfirmation`

### 2. Actualizeaza BookingConfirmation cu link-uri corecte
- Butonul "Vezi cererea" va duce la `/profile#cereri` (hash corect, nu query param)
- Adaug un buton nou "Discuta cu proprietarul" care duce la `/mesaje` (conversatia se creeaza deja in `createRental` daca exista mesaj)
- Daca nu exista conversatie (nu s-a trimis mesaj), butonul va crea una folosind `getOrCreateConversation`

### 3. Schimbari in BookingConfirmation
- Adaug props: `rentalId`, `productId`, `ownerId`
- Butonul "Vezi cererea" -> navigheaza la `/profile#cereri`
- Butonul principal devine "Discuta cu proprietarul" -> creaza/deschide conversatie si navigheaza la `/mesaje`

## Fisiere modificate

| Fisier | Schimbare |
|--------|-----------|
| `src/pages/Checkout.tsx` | Salveaza rental ID dupa creare, paseaza props noi la BookingConfirmation |
| `src/components/booking/BookingConfirmation.tsx` | Adauga props rentalId/productId/ownerId, fix link cereri, buton chat cu proprietarul |

