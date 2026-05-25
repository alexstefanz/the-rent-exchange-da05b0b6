## Problem

Pe mobil, meniul offcanvas (`MobileDrawer`) și restul containerelor fixe folosesc același z-index `z-50`, deci bara de jos (`MobileBottomNav`) și navbar-ul rămân vizibile peste drawer. În screenshot se vede cum bara de navigare jos (Caută/Favorite/Adaugă/Chat/Cont) și sticky checkout-ul apar peste drawer.

Z-index actuali:
- `MobileDrawer` overlay: `z-40`, panel: `z-50`
- `MobileBottomNav`: `z-50`
- `Navbar`: `z-50`
- `StickyCheckoutBar`: `z-40`
- `StickyProductHeader` (doar desktop): `z-40`

## Soluție

Ridic doar drawer-ul deasupra tuturor barelor fixe, fără să schimb stack-ul celorlalte:

1. `src/components/layout/mobile-drawer/MobileDrawer.tsx`
   - Overlay: `z-40` → `z-[60]`
   - Panel: `z-50` → `z-[70]`

Restul (`MobileBottomNav` z-50, `Navbar` z-50, `StickyCheckoutBar` z-40) rămâne neschimbat, deci când drawer-ul e închis comportamentul stratificării actuale e identic. Când e deschis, overlay-ul acoperă navbar + bottom nav + sticky bar, iar panelul stă deasupra overlay-ului.

Niciun alt fișier nu trebuie atins.
