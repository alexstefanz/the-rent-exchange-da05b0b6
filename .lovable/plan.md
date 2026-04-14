

## Plan: Jurnal de activitate pentru utilizatori

### Ce există deja
Tabela `user_activity_logs` colectează automat acțiuni prin triggere DB:
- Produse: creare, dezactivare, reactivare, ștergere, schimbare preț
- Rezervări: creare, confirmare, anulare, finalizare, respingere
- Profil: actualizare telefon, schimbare status KYC
- KYC: creare cerere, schimbare status

Acum e accesibilă doar admin-ilor (RLS). Trebuie deschisă și pentru utilizatorul propriu.

### Modificări

#### 1. Migrare SQL — politică RLS nouă
```sql
CREATE POLICY "Users can view own activity logs"
ON public.user_activity_logs
FOR SELECT TO authenticated
USING (user_id = auth.uid());
```

#### 2. Pagină nouă `src/pages/ActivityLogPage.tsx`
- Layout consistent cu celelalte pagini de profil (Navbar + Footer)
- Lista cronologică de activități cu iconițe, badge-uri colorate per tip de acțiune
- Filtrare opțională per tip (produse, rezervări, profil)
- Paginare/infinite scroll (limitat la 100 inițial)
- Suport RO/EN

#### 3. API client `src/features/profile/activityLogApi.ts`
- `fetchMyActivityLogs(limit, offset)` — query direct pe `user_activity_logs` cu `user_id = auth.uid()` (gestionat de RLS)

#### 4. Hook `src/hooks/queries/useMyActivityLogs.ts`

#### 5. Integrare în navigație
- Adaug buton "📋 Istoric activitate" / "Activity Log" în `Profile.tsx` (NAV_ITEMS)
- Rută nouă `/activitate` în `App.tsx`

### Fișiere

| Fișier | Acțiune |
|---|---|
| Migrare SQL | RLS policy nouă |
| `src/features/profile/activityLogApi.ts` | NOU |
| `src/hooks/queries/useMyActivityLogs.ts` | NOU |
| `src/pages/ActivityLogPage.tsx` | NOU |
| `src/pages/Profile.tsx` | Adaug buton navigare |
| `src/App.tsx` | Adaug rută `/activitate` |

