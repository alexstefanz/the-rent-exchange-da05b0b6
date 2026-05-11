## Fix: „Generează cu AI" nu funcționează

### Cauză
Edge function-ul `generate-product-description` există în cod (`supabase/functions/generate-product-description/index.ts`) și e corect implementat (folosește `LOVABLE_API_KEY`, care e configurat), dar **nu este deployat** pe Lovable Cloud. Apelul `supabase.functions.invoke("generate-product-description")` întoarce 404 → frontend afișează „Eroare AI".

Verificat:
- `LOVABLE_API_KEY` ✅ prezent în secrets
- `curl` direct către funcție → `404 NOT_FOUND`
- Fără loguri pentru funcție → niciodată invocată cu succes

### Fix
1. **Deploy `generate-product-description`** prin tool-ul de deploy.
2. **Smoke-test** după deploy cu un payload realist (titlu + categorie + condition) ca să confirm că răspunsul vine 200 cu un câmp `description` non-gol.
3. Dacă apare vreo eroare în loguri (model invalid, parsing etc.), aplic micro-fix în `index.ts` și redeploy.

### Ce NU schimb
- Frontend-ul (`PublishWizard.tsx`, `aiDescriptionApi.ts`) — codul e corect.
- Modelul (`google/gemini-3-flash-preview`) — e default-ul recomandat și suportă text simplu.
- Schema, RLS, alte funcții.
