## Reparare sticky pe coloana de booking

### Cauza
În `src/index.css` avem:
```css
html, body { overflow-x: hidden; }
```
`overflow-x: hidden` pe `html` transformă `html` în scroll-container, ceea ce dezactivează `position: sticky` pe descendenți (sau, în cazul de față, îi blochează contextul de stickiness). De aceea coloana cu calendarul cade jos în loc să rămână ancorată.

Markup-ul în `ProductDetail.tsx` este deja corect:
```tsx
<div className="grid ... lg:items-start">
  ...
  <div className="order-1 lg:order-2 lg:self-stretch">
    <div className="lg:sticky lg:top-24">
      <PremiumBookingCard ... />
    </div>
  </div>
</div>
```
Nu schimb structura.

### Modificare
Înlocuiesc `overflow-x: hidden` cu `overflow-x: clip` în `src/index.css`. `clip` previne scroll-ul orizontal fără a crea un scroll-container, deci `sticky` redevine funcțional. Toate browserele moderne (Chrome 90+, Safari 16+, Firefox 81+) suportă `clip`.

```css
html, body { overflow-x: clip; }
```

### De ce funcționează
- `overflow-x: clip` pe `<html>` nu generează un nou containing block pentru sticky și nu interferează cu calculul `top: 6rem` față de viewport.
- Coloana booking are deja `lg:self-stretch`, deci e suficient de înaltă să permită scroll-ul cardului sticky până la finalul coloanei.

### Ce NU include
- Nu modific `ProductDetail.tsx`, `PremiumBookingCard`, sau alte componente.
- Nu schimb breakpoint-ul `top-24` și nu adaug margine suplimentară.