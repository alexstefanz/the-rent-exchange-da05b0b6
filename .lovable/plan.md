# Buton „Închirieri încheiate” în meniul contului

## Ce se adaugă

În dropdown-ul „Contul meu”, imediat deasupra butonului „Suport & Tickete”, apare un buton nou în același stil ca cel din imagine:

- Iconiță portocalie de bifă dublă
- Text: „Închirieri încheiate” / „Completed rentals”
- Săgeată în dreapta
- Un număr în dreapta cu totalul închirierilor finalizate (apare doar dacă e mai mare decât 0)

La apăsare duce la pagina existentă cu istoricul închirierilor finalizate ca proprietar.

## Detalii tehnice

- Fișier: `src/components/layout/AccountHubMenu.tsx`, în `AccountHubBody`, chiar înaintea butonului „Suport & Tickete”.
- Navigare: `/inchirieri?status=completed` (pagina `OwnerRentalsPage` tratează deja acest parametru).
- Numărul: `trust?.completedRentals` din `useAccountDashboard` (deja disponibil în componentă).
- Iconiță: `CheckCheck` din lucide-react, colorată cu tokenul `text-primary`.
- Stilul butonului îl copiază pe cel al rândului „Suport & Tickete” (h-12, card, border, shadow-sm), fără culori hardcodate.
