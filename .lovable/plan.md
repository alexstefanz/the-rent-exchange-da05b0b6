

## MiniCRM Integration - POC

### Rezumat
Construim un proof of concept care permite crearea unui contact (lead) in MiniCRM printr-un formular din aplicatie. Comunicarea cu MiniCRM se face exclusiv prin backend (edge function), fara a expune credentiale in frontend.

### Arhitectura

```text
+------------------+       +------------------------+       +------------------+
|  Pagina React    | ----> |  Edge Function         | ----> |  MiniCRM API     |
|  /minicrm-test   |       |  minicrm-proxy         |       |  r3.minicrm.ro   |
|                  | <---- |                        | <---- |                  |
|  Form + Status   |       |  Basic Auth            |       |  JSON Response   |
+------------------+       +------------------------+       +------------------+
```

### Secrets necesare

Inainte de implementare, trebuie setate 3 secrete:
- **MINICRM_SYSTEM_ID** - System ID-ul din contul MiniCRM
- **MINICRM_API_KEY** - API Key-ul din MiniCRM
- **MINICRM_BASE_URL** - URL-ul de baza (ex: `https://r3.minicrm.ro`)

### Ce se construieste

#### 1. Edge Function: `minicrm-proxy`

**Fisier:** `supabase/functions/minicrm-proxy/index.ts`

Endpoint unic care accepta doua actiuni:
- `POST` cu `action: "test-connection"` - face un request simplu catre MiniCRM pentru a verifica daca credentialele sunt corecte (ex: GET pe un endpoint de listare proiecte/contacte)
- `POST` cu `action: "create-contact"` - creaza un contact nou in MiniCRM

Detalii tehnice:
- Autentificare catre MiniCRM: HTTP Basic Auth (`SystemID:ApiKey` encodat Base64)
- CORS headers standard
- Logheaza request/response fara a afisa API key-ul in clar
- Returneaza raspunsul complet de la MiniCRM pentru debug
- Gestioneaza erorile (401/403 = credentiale gresite, 429 = rate limit, 5xx = eroare server)

Conform documentatiei MiniCRM, endpoint-ul pentru creare contact este:
```
PUT https://{base_url}/Api/R3/Contact
```
cu body JSON continand `FirstName`, `LastName`, `Email`, `Phone`, etc.

#### 2. Pagina React: `/minicrm-test`

**Fisier:** `src/pages/MiniCrmTest.tsx`

Contine:
- **Header** cu titlu "MiniCRM Integration Test"
- **Buton "Test Connection"** - apeleaza edge function cu `action: "test-connection"`, afiseaza daca autentificarea e OK sau nu
- **Formular** cu campuri:
  - FirstName (obligatoriu)
  - LastName (obligatoriu)
  - Email (obligatoriu, validat ca format email)
  - Phone (optional)
- **Buton "Trimite in MiniCRM"**
- **Zona de status**: badge Success/Error + raspunsul JSON brut intr-un bloc `<pre>` pentru debug

Validari client-side cu Zod:
- FirstName si LastName: non-empty, max 100 caractere
- Email: format valid
- Phone: optional, max 20 caractere

#### 3. Ruta noua in App.tsx

Adaugare ruta `/minicrm-test` care pointeaza catre componenta `MiniCrmTest`.

#### 4. Configurare edge function

Adaugare in `supabase/config.toml`:
```toml
[functions.minicrm-proxy]
verify_jwt = false
```

#### 5. Documentatie

**Fisier:** `docs/minicrm-integration.md`

Continut:
- Cum se seteaza secrets (MINICRM_SYSTEM_ID, MINICRM_API_KEY, MINICRM_BASE_URL)
- Cum se acceseaza pagina de test
- Cum se verifica logurile edge function-ului
- Scenarii de test (date valide, email invalid, credentiale gresite, eroare server)

### Fisiere create/modificate

| Fisier | Actiune |
|--------|---------|
| `supabase/functions/minicrm-proxy/index.ts` | Creat |
| `src/pages/MiniCrmTest.tsx` | Creat |
| `src/App.tsx` | Modificat (ruta noua) |
| `supabase/config.toml` | Modificat (functie noua) |
| `docs/minicrm-integration.md` | Creat |

### Pasi de implementare

1. Solicit setarea celor 3 secrete (MINICRM_SYSTEM_ID, MINICRM_API_KEY, MINICRM_BASE_URL)
2. Creez edge function-ul `minicrm-proxy`
3. Creez pagina `MiniCrmTest.tsx` cu formular si zona de debug
4. Adaug ruta in `App.tsx`
5. Actualizez `config.toml`
6. Creez documentatia

### Scenarii de test acoperite

| Test | Ce se intampla |
|------|---------------|
| Date valide | Contact creat in MiniCRM, UI arata "Success" + contactId |
| Email invalid | Blocat in UI, eroare de validare afisata |
| Credentiale gresite | UI arata "Unauthorized" cu mesaj clar |
| Eroare server MiniCRM | UI arata eroarea + sugestie de retry |
| Test Connection OK | Badge verde "Connected" |
| Test Connection fail | Badge rosu cu detalii eroare |

### Nota importanta

Voi cere setarea secretelor **inainte** de a scrie codul, deoarece edge function-ul depinde de ele. Daca nu sunt setate, Test Connection va returna eroare clara.

