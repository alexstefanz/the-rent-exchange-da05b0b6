
# Notificari cu Detalii Inchiriere + Chat + Fix Email

## Problema 1: Email-urile nu se trimit
Profilurile din tabela `profiles` au campul `email` gol (`null`). Edge function-ul verifica `if (owner?.email && renter?.email)` si nu trimite nimic. Solutia: in edge function, vom folosi `supabase.auth.admin.getUserById()` pentru a obtine email-ul din `auth.users` cand cel din `profiles` e null. De asemenea, vom salva email-ul in profil la signup pentru viitoare utilizari.

## Problema 2: Notificari cu detalii si chat
Cand dai click pe o notificare de tip `rental_request` sau `rental_confirmation`, vrem sa:
- Afisam detalii despre inchiriere (produs, perioada, suma, status)
- Oferim un buton "Discuta" care deschide ChatDialog-ul cu cealalta parte

### Ce se schimba

**1. Edge Function (`send-rental-notification/index.ts`)**
- Adaugam fallback la `auth.admin.getUserById()` pentru email cand `profiles.email` e null
- Salvam email-ul in `profiles` daca lipseste (pentru viitor)

**2. `handle_new_user()` trigger - migrare DB**
- Modificam trigger-ul sa salveze si email-ul din `auth.users` in `profiles` la signup

**3. NotificationsTab (`src/components/profile/NotificationsTab.tsx`)**
- La click pe o notificare de tip rental, expandam un panel cu:
  - Detalii inchiriere (produs, date, pret, status)
  - Buton "Discuta cu chiriasul/proprietarul" care deschide ChatDialog
- Folosim `notification.link` pentru a determina contextul (rental)
- Fetch-uim datele rental-ului din DB cand se expandeaza notificarea

**4. NotificationBell (`src/components/layout/NotificationBell.tsx`)**
- La click pe notificare, adaugam descrierea in dropdown
- Notificarile cu link navigheaza la sectiunea corespunzatoare (ex: `/profile?tab=lendings`)

**5. Nou: `src/features/rentals/rentalDetailsApi.ts`**
- Functie `getRentalDetails(rentalId)` care returneaza detaliile complete ale unei inchirieri (produs, chirias, proprietar)

## Detalii Tehnice

### Migrare DB
```sql
-- Update handle_new_user to also save email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill existing users' emails
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
```

### Edge Function Fix
In loc de:
```text
owner.email -> poate fi null
```
Vom face:
```text
1. Citim email din profiles
2. Daca e null, citim din auth.admin.getUserById()
3. Trimitem email
```

### NotificationsTab - Expandable Rental Details
Fiecare notificare de tip `rental_request` / `rental_confirmation` va avea un state expandabil care arata:
- Numele produsului
- Perioada (start_date - end_date)
- Suma totala
- Status curent
- Buton "Discuta" care deschide ChatDialog

### Fisiere modificate
| Fisier | Ce se schimba |
|--------|---------------|
| `supabase/functions/send-rental-notification/index.ts` | Fallback email din auth.users |
| `src/components/profile/NotificationsTab.tsx` | Expandable rental details + chat button |
| `src/components/layout/NotificationBell.tsx` | Descriere in dropdown, navigare la link |

### Fisiere noi
| Fisier | Scop |
|--------|------|
| `src/features/rentals/rentalDetailsApi.ts` | Fetch rental details pentru notificari |
