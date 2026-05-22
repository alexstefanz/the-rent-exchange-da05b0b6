# Fix shift orizontal când se deschid dropdown-urile (categorii / căutare)

## Problemă confirmată
Am reprodus în browser pe `/cauta`: când dropdown-ul „Toate categoriile" se deschide, întregul conținut centrat se mută ~17px la stânga, apoi revine la închidere. La fel se întâmplă pe paginile de categorii.

## Cauză
Radix UI (Select/Popover/Dialog) folosește `react-remove-scroll`, care la deschidere:
1. setează atributul `data-scroll-locked` pe `<body>`
2. injectează la runtime un `<style>` în `<head>` care adaugă `padding-right: <scrollbarSize>px !important` pe body, ca să compenseze scrollbarul ascuns.

Pentru că `html { scrollbar-gutter: stable }` rezervă deja spațiul de scrollbar, acest `padding-right` injectat de Radix devine o compensare dublă → shift vizibil. Fix-ul anterior (`body[data-scroll-locked] { padding-right: 0 !important }`) are aceeași specificitate ca regula Radix și pierde pentru că `<style>`-ul injectat de Radix vine după `index.css` în DOM (ordinea cascadei).

## Soluție
În `src/index.css`, înlocuiesc regula existentă cu două reguli de specificitate mai mare, care bat regula Radix indiferent de ordine:

```css
html body[data-scroll-locked],
html body[data-scroll-locked][data-scroll-locked] {
  padding-right: 0 !important;
  margin-right: 0 !important;
}
/* Fallback pt. componente Radix care setează `style="padding-right"` inline pe body */
html body[style*="padding-right"] {
  padding-right: 0 !important;
}
```

## Fișier editat
- `src/index.css`

## Verificare
Re-deschid `/cauta` în browser, click pe „Toate categoriile" → confirm cu screenshot că poziția logo-ului și a butonului „Adaugă anunț nou" rămâne identică între starea închisă și deschisă.
