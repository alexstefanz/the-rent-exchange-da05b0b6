---
name: Category Detail Redesign V3
description: Premium discovery experience for /categorie/:slug — hero with stats, subcategory pills, sticky filter chips, mobile bottom-sheet, discovery rails
type: design
---
Page: src/pages/CategoryDetail.tsx
Components: src/components/category/{CategoryHero,SubcategoryPills,CategorySearchBar,StickyFilterBar,MobileFilterSheet,DiscoveryRails,EmptyCategoryState,ProductCardSkeleton}.tsx

- Hero 280/380px with dual gradient, ken-burns slow zoom, count-up stats chips, 4 trust badges
- Horizontal swipe pills with edge fades; active = bg-foreground
- "Caută în {categorie}" with synonym expansion via expandSearchTerms
- Sticky filter bar engages via IntersectionObserver on #category-sentinel; glass effect when stuck. Quick chips: verified users, Sub 50/100 RON, Aproape de mine, top RO cities
- Mobile: floating filter FAB (bottom-24 right-4) + vaul Drawer bottom-sheet with sticky footer "Resetează / Arată N rezultate"
- Discovery rails (Trending / Recente / Aproape de tine) shown only in browse mode (no active filters); Embla carousel
- Grid 2/3/4 cols, fade-in-up stagger, "Încarcă mai multe" client paging (24)
- View switcher Grid/List + Map (disabled "În curând")
- Verified filter removed (KYC module discontinued)
- New tailwind animations: ken-burns, ring-pulse, shimmer-pass, fade-in-up
- New utility .scrollbar-hide in index.css
