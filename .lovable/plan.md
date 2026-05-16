## Obiectiv

Pe pagina de detaliu a unei închirieri (`/inchiriere/:publicId`), proprietarul să poată **accepta** sau **refuza** o cerere `pending` direct din pagină — nu doar din lista `/inchirieri`. Astfel întreg fluxul (cerere → confirmare → plată → predare → returnare) trăiește într-un singur loc.

## Ce adaug în `src/pages/RentalDetailPage.tsx`

O secțiune nouă vizibilă **doar pentru proprietar când `rental.status === "pending"`**, plasată imediat sub timeline (înainte de cardul de Chat / PV-uri), urmând stilul cardului existent „Plătește acum":

- Titlu: „Cerere noua de inchiriere" / „New rental request"
- Subtitlu: explică pe scurt că prin acceptare chiriașul primește notificare să plătească, iar refuzul poate include un motiv.
- Două butoane:
  - **Acceptă cererea** (primar) → `respondToRental(rental.id, "accept")`
  - **Refuză** (outline, roșu) → deschide un mic `Dialog` cu `Textarea` pentru motiv opțional → `respondToRental(rental.id, "reject", reason)`
- Stările de loading dezactivează ambele butoane, plus toast de succes/eroare ca în `RentalsOutTab`.
- Pe succes: `refetch()` la query-ul `rental-detail` (realtime-ul existent va prelua și el).

Dacă mesajul chiriașului la checkout există (`rental.message_to_owner`), îl afișez ca quote sub subtitlu, pentru context la decizie.

## Out of scope

- Nu schimb logica din `RentalsOutTab` (rămâne identică, dublu acces).
- Nu modific edge functions, RLS sau API-ul `respondToRental`.
- Fără modificări vizuale la timeline sau la celelalte secțiuni.
