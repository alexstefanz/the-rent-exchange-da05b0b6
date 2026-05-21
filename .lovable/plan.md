## Plan: 2 buline pe slider-ul „Interval preț"

### Problema
Slider-ul din `/cauta` (popover desktop + sheet mobile) și `/categorii/:slug` primește deja `value={[min, max]}` corect, dar componenta `src/components/ui/slider.tsx` declară un singur `<SliderPrimitive.Thumb />`. Radix randează atâtea buline câte `<Thumb />` găsește — deci a doua valoare există în state, dar nu are bulină vizibilă.

### Fix (un singur fișier: `src/components/ui/slider.tsx`)
Randez dinamic un `Thumb` pentru fiecare valoare din `value` (controlled) sau `defaultValue` (uncontrolled), cu fallback la 1 bulină:

```tsx
const thumbValues =
  (props.value as number[] | undefined) ??
  (props.defaultValue as number[] | undefined) ??
  [0];
...
{thumbValues.map((_, i) => (
  <SliderPrimitive.Thumb key={i} className="block h-5 w-5 rounded-full border-2 border-primary bg-background ..." />
))}
```

Restul styling-ului (h-5 w-5, border-primary, portocaliu, range orange) rămâne identic. Radix se ocupă singur ca bulina din stânga să nu treacă peste cea din dreapta.

### Efect
- `/cauta` → popover **Interval preț** și sheet-ul mobil afișează acum 2 buline reglabile (ex. 0 RON și 1000 RON).
- `/categorii/:slug` și orice viitor `<Slider value={[a, b, ...]} />` funcționează corect (n buline).

### Ce nu modific
- Logica filtrelor, layout-ul popover-ului, valorile max=1000 / step=10.
- Restul componentelor care folosesc `<Slider value={[x]} />` cu o singură valoare (continuă să afișeze 1 bulină).