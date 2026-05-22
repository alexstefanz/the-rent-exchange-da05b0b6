# Fix shift orizontal când se deschide dropdown-ul de filtre

## Problema (din video)

Când dau click pe un dropdown din bara de filtre (`Tools`, `Price range`, `Relevance`) pe pagina de Search/Categorii, întregul conținut al paginii se mută spre stânga câțiva pixeli. Când dropdown-ul se închide, totul revine la normal.

## Cauza

Radix UI (folosit de `Select` și `Popover`) blochează scroll-ul body-ului când deschide un meniu și injectează inline `padding-right: <scrollbarWidth>px` pe `<body>` pentru a evita layout shift cauzat de dispariția scrollbar-ului.

În `src/index.css` avem deja:
```css
html { scrollbar-gutter: stable; }
```
Asta rezervă deja spațiul scrollbar-ului în mod permanent. Combinat cu `padding-right` injectat de Radix, se aplică o compensare dublă → conținutul centrat (`mx-auto`, `max-w-…`) se mută spre stânga cât scrollbar-ul.

## Soluția

Neutralizez `padding-right` / `margin-right` inline-uri pe care Radix le pune pe `<body>` când blochează scroll-ul, deoarece avem deja `scrollbar-gutter: stable` care rezolvă problema layout shift-ului.

### Modificare

`src/index.css` — adaug imediat după regula `html, body { overflow-x: clip; }`:

```css
/* Empêche layout shift cauzat de Radix RemoveScroll —
   scrollbar-gutter: stable rezervă deja spațiul. */
body[data-scroll-locked],
body[data-radix-scroll-area-viewport] {
  padding-right: 0 !important;
  margin-right: 0 !important;
}
```

## Fișier editat

- `src/index.css`

## Verificare

Browser test pe `/cautare` (sau pe categorie): deschid `Price range` și `Relevance`; conținutul „Search Results" și grila de produse nu trebuie să se mai miște lateral.
