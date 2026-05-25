## Ascund bara de navigare mobilă când tastatura e deschisă

### Problemă
Pe mobil, bara flotantă de jos (Caută / Favorite / Adaugă / Chat / Cont) rămâne vizibilă deasupra tastaturii când scrii într-un chat sau în search. Ocupă spațiu inutil și acoperă conținutul.

### Soluție
Detectez deschiderea tastaturii pe iOS/Android prin `window.visualViewport` (când înălțimea scade semnificativ față de `window.innerHeight`) și ascund bara cât timp tastatura e activă. Nicio modificare la business logic, doar prezentare.

### Modificări

**1. `src/hooks/useKeyboardOpen.ts` (nou)**
Hook care returnează `true` când diferența `window.innerHeight − visualViewport.height` depășește ~150px (prag tipic pentru tastatură). Ascultă `resize` pe `visualViewport`. Fallback `false` dacă API-ul nu există (desktop).

**2. `src/components/layout/MobileBottomNav.tsx`**
- Folosesc `useKeyboardOpen()`.
- Când e `true`, adaug clasele `opacity-0 pointer-events-none translate-y-4` pe `<nav>` (tranziție fluidă), astfel bara dispare complet vizual și nu mai blochează inputul.
- Când tastatura se închide, bara revine normal.

### Note
- Soluția funcționează pentru orice input/textarea (chat, search, formulare) pentru că folosește semnal global de viewport, nu eveniment de focus.
- Pe desktop bara oricum nu se afișează (`lg:hidden`), deci zero impact.
- Zero modificări la chat, search, sau alte componente.
