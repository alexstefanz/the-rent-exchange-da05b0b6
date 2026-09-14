# Google Maps pe domeniul propriu rentli.ro

## Obiectiv
Inlocuim cheia de Maps gestionata de Lovable (restrictionata la `*.lovable.app`) cu o cheie proprie din Google Cloud, astfel incat hartile sa se incarce corect pe `rentli.ro` / `www.rentli.ro`.

## Context
- Cheia de OAuth (login cu Google) este separata de cheia de Google Maps. Client ID / Secret pentru login sunt deja salvati in seif.
- Hartile au nevoie de propria cheie API (browser) si de o cheie server pentru geocodare.

## Pasi

1. **Pregatire Google Cloud**
   - Activezi **Maps JavaScript API** si **Geocoding API** in proiectul Rentli.
   - Generezi o cheie API pentru browser cu restrictii HTTP referrer: `https://rentli.ro/*`, `https://www.rentli.ro/*`, `https://*.lovable.app/*`.
   - Generezi o cheie API pentru server fara restrictie de referrer (sau cu restrictie IP), pentru apeluri din edge functions.

2. **Conectare in Lovable**
   - Deschid formularul securizat `standard_connectors--connect` pentru Google Maps (conexiune noua, cu credentiale proprii).
   - Introduci cele doua chei in campurile respective.

3. **Verificare cod**
   - Confirm ca frontendul foloseste variabila `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`.
   - Confirm ca edge functions folosesc `GOOGLE_MAPS_API_KEY` / gateway.

4. **Test**
   - Deschid pagina de categorie si pagina de produs.
   - Verific in browser console ca nu mai apare `RefererNotAllowedMapError`.
   - Testez geocodarea la adaugarea unui anunt (daca este activa).

## Rezultat asteptat
Hartile se incarca pe domeniul custom, atat in preview Lovable, cat si pe rentli.ro, fara eroarea de cheie neautorizata.
