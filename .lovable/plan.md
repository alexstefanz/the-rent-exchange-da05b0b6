

## Plan: Dropdown locații full-width pe mobil cu font mai mare

### Problema
Pe mobil, dropdown-ul de selecție județ/localitate din hero banner este prea mic — apare ca un popover îngust, greu de folosit. Fontul locațiilor e mic și scroll-ul nu e intuitiv.

### Soluție
Pe mobil, înlocuiesc Radix Select cu un **Drawer** (bottom sheet) care se deschide full-width de jos, cu items mari și scroll nativ touch-friendly. Pe desktop, rămâne Select-ul standard.

### Modificări

**`src/components/HeroSearchForm.tsx`**
- Import `useIsMobile` hook și `Drawer`/`DrawerContent`/`DrawerTrigger` din UI
- Pe mobil: trigger-ul deschide un `Drawer` cu lista de județe ca butoane full-width, `text-base` (16px), padding `py-3` pe fiecare item, scroll nativ cu `-webkit-overflow-scrolling: touch`
- Pe desktop: rămâne `Select` + `SelectContent` neschimbat
- Același tratament pentru dropdown-ul de localități
- Max height drawer content: `max-h-[60vh]` cu `overflow-y-auto` pentru swipe natural

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/components/HeroSearchForm.tsx` | Condiționare mobil/desktop: Drawer vs Select, font mai mare, items full-width |

