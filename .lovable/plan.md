
Obiectiv: deblocăm încărcarea produselor pe homepage (preview + live), unde rămâne spinner-ul infinit.

1) Ce am verificat
- Am reprodus problema în preview: secțiunea de produse rămâne pe loading indefinit.
- În browser logs nu apar erori critice legate de produse.
- În browser network nu apare niciun request XHR/fetch pentru produse (deci query-ul nu ajunge efectiv la backend).
- În backend există produse active (6) și regulile de acces permit citirea produselor active public.
- Endpoint-ul backend pentru produse răspunde corect când e apelat direct.

2) Cauza probabilă (și foarte plauzibilă)
- Blocaj în fluxul de autentificare din `AuthContext`:
  - în `onAuthStateChange` se face `await` pe un apel backend (`checkDeactivated` → query pe `profiles`).
  - acest pattern poate produce deadlock în clientul de auth: callback-ul ține lock-ul, iar apelul intern așteaptă lock-ul -> query-urile ulterioare (inclusiv produse) rămân pending.
- Simptomul corespunde perfect: spinner infinit + lipsă request-uri fetch pentru listarea produselor.

3) Plan de implementare (fix)
- Fișier: `src/contexts/AuthContext.tsx`
  - Refactor callback-ul `onAuthStateChange` să fie strict sincron pentru update de state (`setSession`, `setUser`, `setLoading`) fără `await` la query-uri backend.
  - Mutăm verificarea `checkDeactivated` într-un efect separat după stabilirea user-ului (ex. `useEffect` pe `user?.id`) sau o programăm async în afara callback-ului (microtask/timeout), astfel încât callback-ul să se termine imediat.
  - Păstrăm signOut dacă user-ul e dezactivat, dar executat în flux separat, nu în callback-ul blocant.
- Fișier: `src/components/home/FeaturedListings.tsx` (hardening UX)
  - Adăugăm tratament pentru `error` (mesaj + retry) ca să nu rămână UI-ul într-o stare opacă.
  - Opțional: fallback clar dacă query-ul depășește un timeout vizual (ex. „Nu am putut încărca produsele”).

4) Verificări după fix
- Homepage în preview: apar request-urile fetch pentru produse și cardurile se randază.
- Homepage live: aceeași verificare.
- Verificăm că login/logout funcționează normal și că blocarea contului dezactivat rămâne activă.
- Verificăm și pagina de produs / căutare (care folosesc query-uri similare) pentru a confirma că nu mai există pending infinit.

5) Detalii tehnice (pe scurt)
- Problema nu este în date sau permisiuni backend (acestea sunt valide).
- Problema este în orchestrarea auth client-side: apel async în callback-ul de schimbare sesiune.
- Fixul este structural (flow auth), nu de schema DB.
