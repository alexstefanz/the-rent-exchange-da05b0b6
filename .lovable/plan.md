# „Chat" nu trimite la autentificare când nu ești logat

## Ce am găsit

Toate celelalte linkuri din „Contul tău" duc la paginile private, care verifică autentificarea corect și redirecționează la `/auth`. Pagina de Chat (`/mesaje`) face verificarea în alt mod: cere redirecționarea chiar în timpul desenării paginii, nu după. Astfel redirecționarea poate fi ignorată, iar vizitatorul nelogat rămâne pe un ecran de mesaje gol.

## Ce voi face

- Chat-ul va folosi aceeași verificare ca restul paginilor private: dacă nu ești autentificat, ești trimis la pagina de autentificare.
- Cât timp se verifică sesiunea, se afișează un indicator de încărcare, nu conținutul gol al chatului.
- După autentificare revii la Chat.

## Detalii tehnice

- `src/pages/Messages.tsx`: mut `navigate("/auth", { replace: true })` din corpul componentei într-un `useEffect` dependent de `[user, authLoading, navigate]`, la fel ca în `RentalsPage.tsx` / `OwnerRentalsPage.tsx`.
- Adaug un `return` timpuriu cu spinner cât timp `authLoading` este adevărat sau utilizatorul lipsește, ca să nu se monteze lista de conversații cu `userId` gol.
- Trimit `state: { from: location }` (sau parametrul deja folosit de `/auth`) pentru revenire după login, dacă pagina de autentificare îl suportă; altfel rămâne redirect simplu.

Nicio schimbare de logică de business; doar ordinea verificării de autentificare.
