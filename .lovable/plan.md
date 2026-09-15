# Repararea conectării cu Google

## Diagnostic confirmat

Testul făcut acum pe site-ul public reproduce eroarea `redirect_uri_mismatch`.

Google primește această adresă de întoarcere:

`https://www.rentli.ro/~oauth/callback`

Aceasta nu este acceptată în configurația actuală a clientului OAuth Google. Eroarea apare înainte ca utilizatorul să poată alege contul.

## Pașii de remediere

1. În Google Cloud Console → Google Auth Platform → Clients → clientul web Rentli, adaugă la **Authorized redirect URIs**, exact și fără modificări:
   - `https://www.rentli.ro/~oauth/callback`
   - `https://rentli.ro/~oauth/callback`
2. Păstrează și adresa de callback existentă pentru backend; nu o înlocui.
3. Salvează configurația și așteaptă propagarea Google, de regulă câteva minute.
4. Retestez conectarea în incognito pe `rentli.ro` și verific dacă apare ecranul Google pentru Rentli, fără eroarea 400.
5. Verific separat fluxul mobil. Aplicația mobilă folosește `rentli://auth/callback`, deci această adresă trebuie păstrată în lista de redirecturi din Backend.

## Modificări în aplicație

Nu este necesară schimbarea codului. Site-ul folosește corect fluxul Google gestionat; blocarea vine exclusiv din lista de adrese autorizate a clientului OAuth din Google Cloud.
