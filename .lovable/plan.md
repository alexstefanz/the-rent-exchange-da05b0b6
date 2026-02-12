
# Functionalizare Profil: Foto, Notificari, Review-uri si Linkuri Dropdown

## Ce se va implementa

### 1. Upload foto profil (functional)
Butonul Camera de pe ProfileTab afiseaza acum "Coming soon". Il vom face functional:
- Creare bucket `avatars` in Supabase Storage (public) cu RLS policies
- La click pe Camera, se deschide un file input pentru selectia imaginii
- Imaginea se uploadeaza in bucket-ul `avatars` sub `{userId}/avatar.{ext}`
- Se actualizeaza `avatar_url` in tabela `profiles` via `updateProfile()`
- Avatarul se actualizeaza in timp real pe pagina

### 2. Notificari reale (inlocuire placeholder-e)
Momentan `NotificationsTab` si `NotificationBell` folosesc date mock hardcoded.
- Creare tabela `notifications` in baza de date cu coloane: `id`, `user_id`, `type`, `title_ro`, `title_en`, `description_ro`, `description_en`, `is_read`, `created_at`, `link`
- RLS: utilizatorii vad/actualizeaza doar propriile notificari
- Creare API `src/features/profile/notificationsApi.ts` cu functii: `getNotifications()`, `markAsRead()`, `markAllAsRead()`, `getUnreadCount()`
- Actualizare `NotificationsTab` sa foloseasca date reale din DB
- Actualizare `NotificationBell` sa afiseze count real si notificari reale
- Activare realtime pe tabela `notifications` pentru actualizari live

### 3. Review-uri functionale (stergere placeholder-e)
API-ul de review-uri (`reviewsApi.ts`) exista deja si e functional. Problema e ca:
- `RentalsTab` afiseaza date mock hardcoded (mockRentals)
- `LendingsTab` probabil la fel

Voi actualiza:
- `RentalsTab` sa fetcheze din tabela `rentals` real
- `LendingsTab` sa fetcheze din tabela `products` real (anunturile proprietarului)
- Stergerea tuturor datelor mock/placeholder din aceste componente

### 4. Linkuri functionale in dropdown (Rezervari si Favorite)
In `Navbar.tsx`, linkurile `/rezervari` si `/favorite` nu au rute definite in `App.tsx`.
- `/favorite` -> Redirect la `/profile#favorite`
- `/rezervari` -> Redirect la `/profile#inchirieri`
- Actualizare linkuri in `Navbar.tsx` sa pointeze direct catre hash-urile corecte din profil

---

## Detalii Tehnice

### Baza de date

**Bucket nou `avatars`:**
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');
```

**Tabela `notifications`:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  title_ro TEXT NOT NULL,
  title_en TEXT,
  description_ro TEXT,
  description_en TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- Politici RLS pentru SELECT, UPDATE (mark as read)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### Fisiere noi
| Fisier | Scop |
|--------|------|
| `src/features/profile/notificationsApi.ts` | CRUD notificari |
| `src/features/profile/avatarApi.ts` | Upload/delete avatar |

### Fisiere modificate
| Fisier | Ce se schimba |
|--------|---------------|
| `src/components/profile/ProfileTab.tsx` | Upload foto real (inlocuire "Coming soon") |
| `src/components/profile/NotificationsTab.tsx` | Date reale din DB, stergere mock |
| `src/components/layout/NotificationBell.tsx` | Date reale din DB, stergere mock |
| `src/components/dashboard/RentalsTab.tsx` | Fetch din `rentals` real, stergere mockRentals |
| `src/components/dashboard/LendingsTab.tsx` | Fetch din `products` real, stergere mock |
| `src/components/layout/Navbar.tsx` | Linkuri `/favorite` -> `/profile#favorite`, `/rezervari` -> `/profile#inchirieri` |
| `src/App.tsx` | Adaugare rute redirect pentru `/favorite` si `/rezervari` |
