## Problem
Pe `/cauta`, dropdown-ul "All categories" afișează numele categoriilor doar în română (Unelte, Evenimente, etc.) chiar și când limba este EN. Cauza: în `src/components/search/SearchFilters.tsx` se folosește `category.name` atât ca `value` cât și ca label, ignorând `category.nameEn`.

## Soluție
În `src/components/search/SearchFilters.tsx`:
- Import `useLanguage` din `@/contexts/LanguageContext`.
- În ambele componente (`SearchFiltersContent` și `InlineSearchFilters`), citește `language`.
- Păstrează `value={category.name}` (Romanian) — este folosit ca filtru în query către backend, deci nu se schimbă.
- Schimbă label-ul: `{language === "en" && category.nameEn ? category.nameEn : category.name}`.

Nu se modifică logica de filtrare sau alt cod.