## Cauza
În `src/features/admin/messageReportsApi.ts`, funcția `listMessageReports`:
- Query-ul principal cu join `message:messages!...` se întoarce cu **status 200** și date corecte (am văzut în network: 2 rapoarte `RPT-000001`, `RPT-000002`).
- Codul intră în fallback **doar dacă `error` există**. Dacă query-ul reușește, sare direct la `throw error;` (linie 120) cu `error` undefined → React Query stă blocat pe Skeleton (sau eroare silențioasă).

În plus, rapoartele actuale au `message_id = null` (sunt rapoarte la nivel de conversație, nu de mesaj), deci join-ul returnează `message: null` — trebuie să tratăm și acest caz.

## Soluție

Rescriu `listMessageReports` să:

1. **Folosească rezultatul query-ului principal** când reușește (mapând joined `message` → câmpurile flat ale `MessageReportRow`).
2. Pentru rapoartele cu `message_id = null` (raport pe conversație), să folosească `reason` pentru a extrage `conversation_id` (formatul curent în DB: `"Conversation <uuid>"`) sau să afișeze pur și simplu cu `message_content = null`.
3. Hidratarea autorului/reporter-ului (nume + email din `profiles`) — făcută cu un singur batch fetch, indiferent dacă query-ul principal reușește sau nu (joined query nu aducea profilurile oricum).
4. Păstrez fallback-ul existent doar ca safety net dacă FK-ul lipsește.

### Fișier modificat
- `src/features/admin/messageReportsApi.ts` — rescriere `listMessageReports` cu retur corect pe success + hidratare profiluri.

### Ce NU se atinge
- UI-ul `AdminReports.tsx` (rămâne la fel).
- Schema DB / RLS (datele vin corect, doar codul client le ignora).