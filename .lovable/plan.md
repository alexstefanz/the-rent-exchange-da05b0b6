

## Plan: Seed subcategoriile din datele hardcodate în baza de date

### Problema
Tabelul `platform_subcategories` din baza de date este **gol**. Categoriile principale (`platform_categories`) există, dar subcategoriile nu au fost niciodată adăugate. De aceea, când expandezi o categorie, apare "Nicio subcategorie" / "0 sub".

Aplicația are subcategorii hardcodate în `src/data/categories.ts` (zeci de subcategorii pentru fiecare categorie), dar acestea nu au fost migrate în tabelul din baza de date.

### Soluție

#### 1. Migrare SQL — seed subcategorii
Creez o migrare care inserează toate subcategoriile din datele hardcodate, legându-le de categoriile existente din `platform_categories` prin potrivirea numelui categoriei.

Aceasta va popula tabelul `platform_subcategories` cu toate subcategoriile (nume RO, nume EN, descriere, URL imagine, ordine sortare) pentru fiecare categorie existentă.

#### 2. Nicio modificare de cod necesară
Widget-ul de pe dashboard și pagina `/admin/categories` deja interoghează `platform_subcategories` și afișează rezultatele corect — lipsa datelor era singura problemă.

### Fișiere modificate
- **Migrare SQL nouă** — `INSERT INTO platform_subcategories` cu datele din `categories.ts`

### Detalii tehnice
- Migrarea va face `INSERT` cu `SELECT id FROM platform_categories WHERE name ILIKE ...` pentru a lega fiecare subcategorie de categoria corectă
- Se vor insera ~50-60 subcategorii în total
- Toate vor fi `is_active = true` implicit

