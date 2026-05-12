## Goal

Mesajul opțional pe care chiriașul îl scrie în checkout (imaginea 1) NU mai apare ca primul mesaj în conversația din chat. În schimb, apare ca o bulă de chat în cardul cererii de închiriere afișat proprietarului în "Cereri de închiriere" (imaginea 2).

## Modificări

### 1. Bază de date (migrație)

- Adaugă coloana `message_to_owner TEXT` pe `public.rentals` (nullable).
- Actualizează funcția RPC `get_owner_rentals` să returneze și `message_to_owner` (alături de câmpurile existente).

### 2. Backend / API

`src/features/rentals/rentalsApi.ts` — `createRentalRequest`:
- Salvează `params.messageToOwner` direct în coloana nouă `rentals.message_to_owner` la inserare (în `createRental`).
- Elimină blocul care creează conversația și inserează primul mesaj în `messages` din mesajul opțional. Conversația rămâne să fie creată automat doar la nevoie (nu pre-populată cu acest text).

`src/features/rentals/ownerRentalsApi.ts`:
- Adaugă `message_to_owner: string | null` în interface-ul `OwnerRental`.

### 3. UI — bula de chat în card

`src/components/dashboard/RentalsOutTab.tsx`, în maparea `pendingRentals`:
- Sub blocul cu Perioadă/Zile/Câștig și deasupra butoanelor Acceptă/Refuză, dacă `rental.message_to_owner` există, afișează o bulă de chat:
  - container `rounded-2xl rounded-tl-sm bg-background border border-border px-3 py-2`
  - mic header cu `MessageSquare` (lucide) + "Mesaj de la chiriaș" în `text-xs text-muted-foreground`
  - textul mesajului `text-sm text-foreground whitespace-pre-wrap`
  - folosește tokenii din design system (`bg-background`, `border-border`, `text-foreground`, `text-muted-foreground`), conform regulilor proiectului.

### Out of scope

- Nu schimbăm fluxul existent pentru cereri deja create (date istorice rămân în `messages`; pentru cele vechi bula nu va apărea — comportament acceptabil).
- Fără modificări la `OptionalMessageCard` din checkout, fără modificări la edge functions.
- Fără realtime nou — cardul oricum se reîmprospătează la primirea cererii.
