

## Banner cu fundal pe paginile de categorii

### Ce se schimbă

Fiecare pagină de categorie (`CategoryDetail.tsx`) va avea un banner hero cu:
- Imagine de fundal specifică categoriei (folosesc prima imagine de subcategorie, deja disponibilă în date)
- Overlay negru 50% pentru lizibilitate
- Conținut centrat: link "Înapoi la Categorii", titlu categorie, subtitlu cu nr. subcategorii/anunțuri
- Înălțime ~300px, `object-cover` pe imagine

### Implementare

**Fișier:** `src/pages/CategoryDetail.tsx`

1. Mut secțiunea header (back link + titlu + subtitlu) într-un banner full-width cu imagine de fundal
2. Imaginea de fundal = `category.subcategories[0]?.image` (exact ca în `CategoryCard.tsx`)
3. Overlay: `bg-black/50` absolute
4. Text alb, centrat vertical și orizontal
5. Back link stilizat cu text alb
6. Sub banner, rămâne conținutul existent (dropdown subcategorii + grid produse)

Structura banner:
```text
┌──────────────────────────────────────┐
│  [imagine fundal categorie]          │
│  ████████ overlay 50% ██████████████ │
│                                      │
│        ‹ Înapoi la Categorii         │
│        CAMPING & DRUMEȚII            │
│     9 subcategorii • 12 anunțuri     │
│                                      │
└──────────────────────────────────────┘
│  [Subcategorii dropdown] [Produse]   │
```

Un singur fișier modificat.

