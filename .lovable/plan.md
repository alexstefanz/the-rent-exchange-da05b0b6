## Combine Companie + Utile into one stacked column

In `src/components/layout/Footer.tsx`, replace the current side-by-side wrapper:

```tsx
<div className="grid grid-cols-2 gap-16">
  <div>Companie...</div>
  <div>Utile...</div>
</div>
```

with a single column that stacks the two sections vertically:

```tsx
<div className="space-y-8">
  <div>Companie...</div>
  <div>Utile...</div>
</div>
```

Result: Companie block on top, Utile block directly underneath, occupying one footer column. The overall grid stays `lg:grid-cols-4` (Logo | Companie+Utile | Contul tău | Suport clienți). No other changes.