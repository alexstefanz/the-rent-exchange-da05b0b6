

## Plan: Securizare bucket `support-attachments`

### Problemă
Bucket-ul `support-attachments` este **public** și politicile permit:
- Oricine (chiar neautentificat) poate citi orice fișier
- Orice user autentificat poate încărca în orice folder
- URL-urile publice ale imaginilor de suport sunt embedded în mesajele tichetelor → expunere de date sensibile (ID-uri, facturi, screenshoturi)

### Soluție

#### 1. Migrare SQL — fac bucket-ul privat și restrâng politicile

```sql
-- Trec bucket-ul pe privat
UPDATE storage.buckets SET public = false WHERE id = 'support-attachments';

-- Șterg politicile permisive existente
DROP POLICY "Anyone can view support attachments" ON storage.objects;
DROP POLICY "Authenticated users can upload support attachments" ON storage.objects;

-- SELECT: doar owner-ul folder-ului (path-ul începe cu user_id) sau admin
CREATE POLICY "Users view own support attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'support-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- INSERT: doar în propriul folder
CREATE POLICY "Users upload to own folder support attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'support-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE: owner sau admin
CREATE POLICY "Users delete own support attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'support-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);
```

Path-ul actual de upload (`${userId}/${timestamp}-${rand}.jpg`) deja corespunde cu această schemă → nu e nevoie de migrare de fișiere existente.

#### 2. Frontend — `SupportChatWidget.tsx`

- **Upload**: înlocuiesc `getPublicUrl()` cu păstrarea **căii** fișierului (ex. `support-attachments://userId/file.jpg` sau doar path-ul) în loc de URL public
- **Render**: pentru mesajele care conțin path de imagine, generez la afișare `createSignedUrl(path, 3600)` și afișez imaginea cu URL-ul semnat (cache 1h)
- **Detecție**: ajustez `isImageUrl` să recunoască noul format de path
- Adaug componentă mică `<SupportImage path={...} />` care:
  - Apelează `supabase.storage.from('support-attachments').createSignedUrl(path, 3600)` o singură dată
  - Cache-uiește URL-ul în `useQuery` cu `staleTime: 50min`
  - Afișează skeleton cât se încarcă

#### 3. Backwards compatibility

Mesajele existente conțin URL-uri publice cu format `https://.../storage/v1/object/public/support-attachments/...`. După ce bucket-ul devine privat, aceste URL-uri vor returna 400. Soluție:
- Componenta `SupportImage` detectează URL-uri vechi (`/object/public/support-attachments/`) și extrage path-ul, apoi generează signed URL pe baza lui
- Astfel istoricul rămâne accesibil pentru owner + admin

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| Migrație SQL nouă | Bucket privat + 3 politici noi (SELECT/INSERT/DELETE scoped pe folder + admin) |
| `src/components/support/SupportChatWidget.tsx` | `uploadSupportImage` returnează path în loc de public URL; nouă componentă `SupportImage` care generează signed URLs; `isImageUrl` și `renderMessageContent` actualizate să accepte ambele formate (legacy public URL + path) |

### Aspecte UX
- Imaginile încărcate anterior rămân vizibile pentru owner + admin (signed URL pe baza path-ului extras)
- Niciun utilizator nu poate vedea atașamentele altui utilizator
- Adminii păstrează vizibilitate completă pentru investigații
- Signed URL-urile au expirare 1h — re-generate automat la următoarea afișare

### Limitări recunoscute
- Mesajele vechi care au URL-uri direct embedded vor încerca signed URL pe path-ul extras; dacă cineva a partajat vreun link public în afara aplicației, acesta nu va mai funcționa (ceea ce e exact comportamentul dorit)
- Nu adaug verificare suplimentară că `userId` din path e participant la un anume tichet — pentru că fișierele sunt scoped per-user (toate atașamentele lui sunt ale lui), iar mesajele unde apar sunt deja protejate de RLS pe `ops_ticket_messages`

