

## Admin Dashboard Complet - Plan de Extindere

### Situatia curenta

Dashboard-ul admin existent are deja:
- **Dashboard** cu statistici generale
- **Rezervari** - vizualizare si schimbare status
- **Financiar** - venituri, comisioane, grafice
- **Analytics** - tendinte lunare, distributie statusuri (cu date mock)
- **Utilizatori** - cautare, schimbare rol (admin/moderator/user)
- **KYC** - aprobare/respingere verificari identitate

### Ce lipseste si trebuie adaugat

Pe baza cerintelor tale si a best practices pentru o platforma de inchiriere, iata modulele noi:

---

### 1. Sistem de Tickete / Reclamatii

**Pagina noua:** `/admin/tickets`

**Tabela noua in baza de date:** `support_tickets`
- `id`, `user_id` (cel care reclama), `subject`, `description`, `category` (disputa, frauda, calitate, altele), `priority` (low, medium, high, urgent), `status` (open, in_progress, resolved, closed), `related_rental_id` (optional), `related_product_id` (optional), `assigned_to` (admin UUID, optional), `admin_notes` (text intern), `resolution` (text), `created_at`, `updated_at`, `resolved_at`

**Functionalitati UI:**
- Lista tickete cu filtre (status, prioritate, categorie)
- Detalii ticket cu timeline (mesaje user + raspunsuri admin)
- Atribuire ticket la admin
- Schimbare status si prioritate
- Adaugare notite interne (vizibile doar adminilor)
- Rezolvare cu mesaj catre user
- Contor tickete deschise pe dashboard-ul principal

---

### 2. Gestionare Anunturi (Produse)

**Pagina noua:** `/admin/products`

**Functionalitati UI:**
- Lista toate produsele (active si inactive) cu cautare si filtre
- Vizualizare detalii produs
- **Editare produs** - adminul poate modifica titlu, descriere, pret, categorie, imagini
- **Stergere produs** - cu dialog de confirmare si motiv
- **Dezactivare/Activare produs** - toggle is_active fara stergere permanenta
- **Marcare produs ca "flagged"** (nou camp in tabela products: `admin_flagged`, `flag_reason`)
- Filtrare dupa categorie, oras, status (activ/inactiv/flagged)

**Modificari baza de date:**
- Adaugare coloane `admin_flagged` (boolean, default false) si `flag_reason` (text, nullable) in tabela `products`
- RLS policy: adminii pot vedea/edita/sterge orice produs

---

### 3. Gestionare Categorii

**Pagina noua:** `/admin/categories`

**Tabela noua:** `platform_categories`
- `id`, `name`, `name_en`, `icon`, `sort_order`, `is_active`, `created_at`, `updated_at`

**Tabela noua:** `platform_subcategories`
- `id`, `category_id`, `name`, `name_en`, `description`, `description_en`, `image_url`, `sort_order`, `is_active`, `created_at`

**Functionalitati UI:**
- Lista categorii cu drag-and-drop reordonare (sau campuri sort_order)
- Adaugare/editare/stergere categorie
- Gestionare subcategorii per categorie
- Toggle activ/inactiv per categorie si subcategorie
- Preview cum arata pe site

**Nota:** Initial categoriile sunt hardcodate in `src/data/categories.ts`. Acest modul va migra categoriile in baza de date, iar frontend-ul va citi din DB in loc de fisierul static.

---

### 4. Banare Utilizatori

**Extindere pagina existenta:** `/admin/users`

**Modificari baza de date:**
- Adaugare coloane in `profiles`: `is_banned` (boolean, default false), `banned_at` (timestamp), `banned_by` (uuid), `ban_reason` (text)
- RLS policy: utilizatorii banati nu pot crea produse sau rezervari

**Functionalitati UI:**
- Buton "Baneaza" in dropdown-ul de actiuni per utilizator
- Dialog de confirmare cu camp pentru motivul banarii
- Buton "Debaneaza" pentru utilizatorii deja banati
- Badge vizual "BANAT" pe utilizatorii afectati
- Istoric banari (optional)

**Impact pe frontend:**
- Verificare `is_banned` la login si la actiuni critice (creare produs, creare rezervare)
- Mesaj clar pentru utilizatorul banat

---

### 5. Verificare Plati

**Extindere pagina existenta:** `/admin/finances`

**Functionalitati noi:**
- Tab/sectiune dedicata "Verificare Plati"
- Lista tranzactii cu status pending - admin poate marca ca "verificat" sau "suspicious"
- Detalii per tranzactie: cine a platit, cand, metoda, suma
- Posibilitate de a marca o plata ca "rambursata" cu motiv
- Export CSV al tranzactiilor (bonus)

---

### 6. Sugestii suplimentare pentru platforma

Iata ce ar mai fi util pe o platforma de inchiriere peer-to-peer:

- **Audit Log** - jurnal cu toate actiunile adminilor (cine a banat, cine a sters, cand)
- **Sistem de notificari admin** - alerte cand apar tickete noi, KYC pending, plati suspecte
- **Content Moderation** - queue cu produse noi care trebuie aprobate inainte de publicare
- **Rapoarte automate** - email saptamanal cu KPI-uri cheie
- **Sistem de dispute** - workflow structurat pentru rezolvarea conflictelor intre chirias si proprietar
- **Rate limiting / fraud detection** - detectie automata conturi suspecte (multe conturi de pe acelasi IP, etc.)
- **Comisioane dinamice** - posibilitatea de a seta comisioane diferite per categorie sau per utilizator

---

### Ordinea implementarii recomandata

1. **Banare utilizatori** (cel mai rapid, extinde pagina existenta)
2. **Gestionare anunturi** (impact direct pe moderare)
3. **Sistem tickete** (suport clienti)
4. **Verificare plati** (extinde financiar existent)
5. **Gestionare categorii** (necesita migrare date)

---

### Detalii tehnice

**Fisiere noi:**
| Fisier | Descriere |
|--------|-----------|
| `src/pages/admin/AdminTickets.tsx` | Pagina tickete |
| `src/pages/admin/AdminProducts.tsx` | Pagina gestionare produse |
| `src/pages/admin/AdminCategories.tsx` | Pagina gestionare categorii |
| `src/features/admin/ticketsApi.ts` | API tickete |
| `src/features/admin/adminProductsApi.ts` | API produse admin |
| `src/features/admin/categoriesApi.ts` | API categorii |
| `src/hooks/queries/useAdminTickets.ts` | Hook tickete |
| `src/hooks/queries/useAdminProducts.ts` | Hook produse admin |
| `src/hooks/queries/useAdminCategories.ts` | Hook categorii |

**Fisiere modificate:**
| Fisier | Modificare |
|--------|-----------|
| `src/App.tsx` | 3 rute noi |
| `src/components/admin/AdminSidebar.tsx` | 3 link-uri noi in meniu |
| `src/pages/admin/AdminUsers.tsx` | Butoane ban/unban |
| `src/pages/admin/AdminFinances.tsx` | Sectiune verificare plati |
| `src/pages/admin/AdminDashboard.tsx` | Contoare tickete si produse flagged |
| `src/features/admin/adminApi.ts` | Functii noi pentru ban/unban, produse |
| `src/hooks/queries/useAdminStats.ts` | Hooks noi |

**Migratii baza de date:**
- Tabela `support_tickets` + RLS policies
- Tabela `platform_categories` + `platform_subcategories` + RLS policies + seed data din categories.ts
- Coloane noi in `profiles`: `is_banned`, `banned_at`, `banned_by`, `ban_reason`
- Coloane noi in `products`: `admin_flagged`, `flag_reason`
- RLS policies noi: adminii pot CRUD pe toate tabelele noi + update pe products/profiles
- Functie RPC `get_admin_products` pentru listare cu filtre

