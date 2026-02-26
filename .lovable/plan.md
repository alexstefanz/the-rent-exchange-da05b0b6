

## Plan: Odoo CRM Integration Test (POC)

Pattern-ul este identic cu MiniCRM: un edge function proxy + o pagină de test. Odoo folosește JSON-RPC 2.0 pentru API extern.

### Odoo External API (JSON-RPC 2.0)

Odoo expune un API JSON-RPC cu 3 endpoint-uri principale:
- **`/web/session/authenticate`** — autentificare cu `db`, `login`, `password`; returnează `session_id` cookie
- **`/web/dataset/call_kw`** — apeluri de metode pe modele (ex: `crm.lead` / `search_read`, `create`)
- **`/jsonrpc`** — endpoint generic JSON-RPC 2.0

Pentru CRM leads se folosește modelul `crm.lead` cu metode: `search_read` (citire), `create` (creare lead).

### Secrets necesare (3)

| Secret | Exemplu |
|--------|---------|
| `ODOO_URL` | `https://mycompany.odoo.com` |
| `ODOO_DB` | `mycompany` |
| `ODOO_LOGIN` | `admin@mycompany.com` |
| `ODOO_PASSWORD` | `api-key-or-password` |

### Changes

#### 1. New file: `supabase/functions/odoo-proxy/index.ts`

Edge function cu 3 acțiuni:
- **`test-connection`** — autentificare la `/web/session/authenticate`, returnează `uid` dacă succesul
- **`list-leads`** — `search_read` pe `crm.lead` cu câmpuri: `name`, `contact_name`, `email_from`, `phone`, `stage_id`, `expected_revenue`; limit 20
- **`create-lead`** — `create` pe `crm.lead` cu `name`, `contact_name`, `email_from`, `phone`

Flow intern:
1. Authenticate → get session cookie
2. Use session cookie for subsequent `/web/dataset/call_kw` calls
3. Return results to frontend

#### 2. New file: `src/pages/OdooTest.tsx`

Pagină de test cu 3 secțiuni (identic ca pattern MiniCRM):

1. **Test Connection** — buton care apelează `test-connection`, afișează badge Connected/Error + raw JSON
2. **Lista Leads** — buton care apelează `list-leads`, afișează un tabel cu leads existente din Odoo CRM
3. **Creare Lead** — formular cu câmpuri: Nume lead, Contact, Email, Telefon, Revenue estimat; trimite `create-lead`

#### 3. Edit: `src/App.tsx`

- Import `OdooTest` page
- Adaugă ruta `/odoo-test`

#### 4. Config: `supabase/config.toml`

- Nu se editează manual (auto-managed), dar funcția va avea `verify_jwt = false` setat corespunzător

### Files summary

| File | Action |
|------|--------|
| `supabase/functions/odoo-proxy/index.ts` | **Create** — edge function proxy Odoo JSON-RPC |
| `src/pages/OdooTest.tsx` | **Create** — pagină test cu connection + list leads + create lead |
| `src/App.tsx` | **Edit** — adaugă ruta `/odoo-test` |

### Prerequisite

Inainte de implementare, va trebui sa configurezi 4 secrets: `ODOO_URL`, `ODOO_DB`, `ODOO_LOGIN`, `ODOO_PASSWORD`. Te voi ghida pas cu pas.

