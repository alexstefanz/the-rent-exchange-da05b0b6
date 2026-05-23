Aplicăm pe `/cauta` aceleași schimbări ca pe pagina de categorie:
- Înlocuim dropdown-ul „Toate orașele" din bara de filtre din dreapta (`InlineSearchFilters`) — adăugăm prop `hideLocation` pentru `InlineSearchFilters` (deja suportat de componentă).
- Mutăm Județ + Localitate în **stânga**, sub rândul cu taburi (Produse/Utilizatori), vizibile doar pe tabul Produse și doar pe desktop (`hidden lg:flex`). Pe mobil rămân în sheet-ul de filtre (deja gestionate prin props).

**`src/pages/Search.tsx`**
- În `TabsContent value="products"`, înainte de „rezultate găsite", adăugăm un rând `hidden lg:flex items-center gap-2` cu cele două `Select`-uri (Județ → Localitate dependente), folosind state-ul existent `selectedJudet`/`selectedCity` și handler-ele `handleJudetChange`/`handleCityChange`.
- Adăugăm `hideLocation` la `InlineSearchFilters` în bara din dreapta (păstrăm prop-urile selectedJudet/onJudetChange pentru consistență, nu strică).
- `SearchFilters` (sheet mobil) rămâne neschimbat — afișează în continuare ambele dropdown-uri.
