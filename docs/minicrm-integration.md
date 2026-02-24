# MiniCRM Integration — POC

## Secrets necesare

Setează 3 secrete în Lovable Cloud:

| Secret | Descriere |
|--------|-----------|
| `MINICRM_SYSTEM_ID` | System ID din contul MiniCRM |
| `MINICRM_API_KEY` | API Key din MiniCRM |
| `MINICRM_BASE_URL` | URL de bază (ex: `https://r3.minicrm.ro`) |

## Cum accesezi pagina de test

Navighează la `/minicrm-test` în aplicație.

## Funcționalități

### Test Connection
Butonul **Test Connection** face un GET pe `/Api/R3/Category` pentru a verifica credențialele.
- Badge verde = autentificare OK
- Badge roșu = eroare (vezi JSON-ul de debug)

### Creare Contact
Formularul trimite datele către edge function-ul `minicrm-proxy`, care face `PUT /Api/R3/Contact` cu:
- `FirstName`, `LastName`, `Email` (obligatorii)
- `Phone` (opțional)

## Verificare loguri

Logurile edge function-ului sunt vizibile în Lovable Cloud → Backend → Functions → `minicrm-proxy`.

## Scenarii de test

| Scenariu | Rezultat așteptat |
|----------|-------------------|
| Date valide | Contact creat, badge Success + contactId |
| Email invalid | Blocat în UI cu mesaj de validare |
| Credențiale greșite | UI arată "Unauthorized" |
| Eroare server MiniCRM | UI arată eroarea + sugestie retry |
| Secrets neconfigurate | Mesaj clar despre secrets lipsă |
