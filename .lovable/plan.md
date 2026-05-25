## Problem

În `NotificationSettingsSheet` (mobil), titlul „Setări notificări” și butonul X sunt pe nivele verticale diferite:
- `SheetHeader` are `pt-5` (20px) iar `SheetTitle` e pe primul rând, urmat de `SheetDescription`
- Butonul X (din `SheetContent`) e `absolute top-4 right-4` (16px)

Rezultat: X-ul e ușor mai sus decât titlul și se suprapune cu zona din dreapta, fără spațiere clară.

## Soluție

În `src/components/notifications/NotificationSettingsSheet.tsx`:

1. Modific `SheetHeader` să fie un layout simplu cu padding consistent: `px-5 pt-4 pb-3 pr-14` (rezervă spațiu pentru X în dreapta sus).
2. Pun `SheetTitle` într-un rând dedicat aliniat vertical pe linia X-ului: înălțime fixă `h-8` cu `flex items-center`, `leading-none`, ca să coincidă cu centrul butonului X (`top-4` + `h-8` → centrat la ~32px).
3. `SheetDescription` rămâne sub titlu, separat de un `mt-2`, în afara rândului titlului — astfel titlul și X sunt pe exact aceeași linie cu distanță vizibilă între ele.

Niciun alt fișier afectat.
