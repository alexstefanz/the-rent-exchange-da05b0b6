# Login cu Google — verificare și reparare

## Ce am testat acum

Am deschis pagina de autentificare pe site-ul live și am apăsat „Continuă cu Google".

Rezultat: Google respinge conectarea cu mesajul **Error 400: redirect_uri_mismatch**.

Asta înseamnă că adresa de întoarcere folosită la autentificare nu este trecută în lista de adrese permise din contul tău Google Cloud. Nu este o problemă de cod — codul de login este neschimbat și corect.

## Ce trebuie făcut (în Google Cloud Console)

1. Deschide **APIs & Services → Credentials → OAuth 2.0 Client IDs** și intră în clientul de tip **Web application** (cel cu ID-ul care începe cu `582322940802-…`).
2. La **Authorized redirect URIs**, adaugă exact:
   - `https://tsffyecastudajmgrckt.supabase.co/auth/v1/callback`
3. La **Authorized JavaScript origins**, verifică să existe:
   - `https://rentli.ro`
   - `https://www.rentli.ro`
4. Salvează. Google poate avea nevoie de câteva minute până la o oră ca modificarea să se aplice.

Dacă în ecranul de Auth Settings din backend apare o altă adresă de callback decât cea de mai sus, folosește exact adresa afișată acolo.

## După ce salvezi

Retestez login-ul cu Google pe rentli.ro și îți confirm dacă intră corect în cont. Verific și cum arată ecranul Google (numele afișat).

## Note

- Nu se modifică niciun fișier din aplicație pentru această problemă.
- Aplicația mobilă folosește aceleași credențiale, deci se repară odată cu web-ul.
