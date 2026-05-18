## Eliminare toast „Fotografii incarcate"

Cand utilizatorul incarca fotografii in procesul-verbal (handover/return), apare un toast in centru-jos cu textul „Fotografii incarcate". Confirmarea vizuala este deja oferita de aparitia thumbnail-urilor in galerie, deci toast-ul este redundant.

### Modificare

- `src/components/rentals/PvPhotoUploadCard.tsx` (linia 68): elimin apelul `toast.success("Fotografii incarcate");`. Daca importul `toast` din `sonner` nu mai e folosit nicaieri in fisier, il sterg si pe el.

Erorile la upload (`toast.error(...)`) raman neschimbate, ca sa fie semnalate utilizatorului.