# Dropdown pentru Categorie & Subcategorie în dialogul „Editează produs" (Admin)

## Context
În `src/pages/admin/AdminProducts.tsx`, dialogul de editare folosește `<Input>` text liber pentru `category` și `subcategory`. Vrem `<Select>` populat din DB (`platform_categories` și `platform_subcategories`), cu subcategoriile filtrate după categoria selectată.

## Modificări — un singur fișier

**`src/pages/admin/AdminProducts.tsx`**

1. **Extinde queryul existent `platformCategories`** (linia ~246) ca să selecteze și `id`, apoi adaugă un al doilea `useQuery` `platformSubcategories` care aduce `category_id, name` din `platform_subcategories` (`is_active=true`, ordonat după `sort_order`).

2. **`categoryOptions` rămâne** așa cum este (folosit deja la filtrul de coloană).

3. **`subcategoryOptions` (memo nou)** — filtrează `platformSubcategories` după `category_id`-ul categoriei selectate în `editForm.category` (lookup name → id din lista de categorii). Returnează `[{value, label}]`.

4. **Înlocuiește cele două `<Input>`** (linii 893 & 897) cu `<Select>` (componenta shadcn deja importată):
   - Categorie: opțiuni = `categoryOptions`. La schimbare: `setEditForm(f => ({ ...f, category: v, subcategory: "" }))` (resetează subcategoria).
   - Subcategorie: opțiuni = `subcategoryOptions`. Disabled când nu e categorie aleasă sau nu există subcategorii. Placeholder „Fără subcategorie" / „Selectează subcategoria".

5. **Fără modificări** la salvare (`handleSaveEdit` deja trimite ambele câmpuri ca string).

## În afara scopului
- Nu modific filtrele de coloană din tabel.
- Nu ating alte dialoguri (creare produs etc.).
- Nu schimb schema DB.
