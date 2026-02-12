
# Navigare directa la request din notificare

## Problema
Notificarile au link-uri de forma `/profile?tab=lendings` sau `/profile?tab=rentals`, dar pagina Profile foloseste navigare prin hash (`#anunturi`, `#cereri`, etc.). Rezultat: click pe notificare duce pe pagina de profil dar nu se deschide tab-ul corect.

## Solutia

### 1. Actualizare link-uri in edge functions
Modific link-urile din notificari pentru a folosi formatul hash corect:

| Vechi | Nou | Context |
|-------|-----|---------|
| `/profile?tab=lendings` | `/profile#anunturi` | Owner primeste cerere |
| `/profile?tab=rentals` | `/profile#cereri` | Renter trimite cerere / primeste raspuns |

**Fisiere:**
- `supabase/functions/send-rental-notification/index.ts` - 2 locuri de modificat
- `supabase/functions/respond-rental-request/index.ts` - 3 locuri de modificat

### 2. Mapping pentru notificari vechi in NotificationBell
Adaug o functie de conversie in `NotificationBell.tsx` care transforma link-urile vechi (`?tab=`) in format hash, pentru notificarile deja existente in baza de date:

```text
/profile?tab=lendings  ->  /profile#anunturi
/profile?tab=rentals   ->  /profile#cereri
```

### 3. Acelasi mapping in NotificationsTab
Aplic aceeasi conversie si in `NotificationsTab.tsx` pentru link-urile din tab-ul de notificari complet.

## Fisiere modificate

| Fisier | Schimbare |
|--------|-----------|
| `supabase/functions/send-rental-notification/index.ts` | Link-uri noi: `#anunturi`, `#cereri` |
| `supabase/functions/respond-rental-request/index.ts` | Link-uri noi: `#cereri` |
| `src/components/layout/NotificationBell.tsx` | Functie de mapping link vechi -> hash |
| `src/components/profile/NotificationsTab.tsx` | Aceeasi functie de mapping |
