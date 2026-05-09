## Problem
Pe pagina produsului, descrierea este randată într-un singur `<p>` fără păstrarea rândurilor noi (`\n`). Astfel orice text introdus pe mai multe rânduri apare ca un bloc continuu.

## Soluție
În `src/pages/ProductDetail.tsx` (linia 267), schimb `<p>` astfel încât să respecte rândurile și spațiile:

```tsx
<p className="text-muted-foreground whitespace-pre-wrap break-words">
  {displayDescription || copy.product.noDescription}
</p>
```

- `whitespace-pre-wrap` păstrează `\n` și spațiile multiple
- `break-words` asigură că URL-uri/cuvinte lungi nu sparg layoutul

## Scope
- Doar UI, un singur fișier: `src/pages/ProductDetail.tsx`
- Fără modificări în backend, validare sau alte componente