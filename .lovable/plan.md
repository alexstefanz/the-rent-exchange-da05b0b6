## Aducem înapoi banner-ul de categorie

Pe `/categorie/:slug` adăugăm înapoi `CategoryHero` (componenta există încă, neștearsă) — banner cu imagine, nume categorie, stats (total, noi săptămâna asta, oraș top), peste layoutul actual stil Search.

### Modificări

**`src/pages/CategoryDetail.tsx`**
- Re-importăm `CategoryHero`.
- Calculăm `topCity` și `newThisWeek` din `products` (peste setul nefiltrat).
- Imagine banner: aceeași logică ca înainte — prima subcategorie cu `image` Unsplash, upscaled la `w=1920&q=85`.
- Render `<CategoryHero>` între `<Navbar />` și `<main>`. Restul paginii rămâne identic (search bar, tabs, filtre inline, grid).

Fără alte schimbări (fără pills, sticky bar, rails).
