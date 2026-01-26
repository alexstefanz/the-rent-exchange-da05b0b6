
# Plan Implementare Sistem ERP - MVP pentru Administratori

## Prezentare Generală

Vom construi un panou de administrare complet pentru platforma de închirieri, accesibil doar administratorilor. Sistemul va include 4 module principale: Rezervări, Financiar, Analytics și Gestionare Utilizatori.

```text
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                              │
├─────────────────────────────────────────────────────────────────┤
│  📋 Rezervări  │  💰 Financiar  │  📊 Analytics  │  👥 Utilizatori│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Total    │  │ Venituri │  │ Useri    │  │ Produse  │        │
│  │ Rezervări│  │ Lună     │  │ Activi   │  │ Active   │        │
│  │   127    │  │ 45,230   │  │   892    │  │   456    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Grafice & Tabele specifice fiecărui modul                  ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Faza 1: Baza de Date - Tabele Noi

### 1.1 Sistem de Roluri (Securitate)

```sql
-- Enum pentru roluri
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Tabel roluri utilizatori (separat de profiles pentru securitate)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Funcție verificare rol (SECURITY DEFINER pentru a evita recursivitate RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### 1.2 Tabel Rezervări/Închirieri

```sql
CREATE TABLE public.rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    renter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Date rezervare
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rental_days INTEGER NOT NULL,
    
    -- Pricing
    daily_price NUMERIC NOT NULL,
    platform_fee_percent NUMERIC NOT NULL DEFAULT 20,
    subtotal NUMERIC NOT NULL,
    platform_fee NUMERIC NOT NULL,
    owner_payout NUMERIC NOT NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending',
    -- pending, confirmed, active, completed, cancelled, overdue
    
    -- Plăți
    payment_status TEXT NOT NULL DEFAULT 'pending',
    -- pending, paid, refunded, failed
    payment_method TEXT,
    paid_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT
);
```

### 1.3 Tabel Tranzacții Financiare

```sql
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_id UUID REFERENCES rentals(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    type TEXT NOT NULL,
    -- rental_payment, platform_fee, owner_payout, refund, late_fee
    
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'RON',
    status TEXT NOT NULL DEFAULT 'pending',
    -- pending, completed, failed
    
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ
);
```

### 1.4 Tabel KYC (Verificare Identitate)

```sql
CREATE TABLE public.kyc_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    status TEXT NOT NULL DEFAULT 'not_started',
    -- not_started, pending, approved, rejected
    
    document_type TEXT,
    -- id_card, passport, driving_license
    
    document_url TEXT,
    selfie_url TEXT,
    
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Faza 2: Politici RLS (Securitate)

```sql
-- User Roles - doar admini pot vedea/modifica
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage roles"
ON user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Rentals - proprietarii și chiriașii văd propriile, admini văd toate
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own rentals"
ON rentals FOR SELECT
USING (
    renter_id = auth.uid() OR 
    owner_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage all rentals"
ON rentals FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Similar pentru transactions și kyc_verifications
```

---

## Faza 3: Structură Frontend

### 3.1 Rute Noi în App.tsx

```text
/admin                 → Dashboard principal
/admin/reservations    → Gestiune rezervări
/admin/finances        → Rapoarte financiare
/admin/analytics       → Statistici platformă
/admin/users           → Gestiune utilizatori
/admin/kyc             → Verificări KYC
```

### 3.2 Componente Noi

```text
src/
├── pages/
│   └── admin/
│       ├── AdminDashboard.tsx      # Pagină principală
│       ├── AdminReservations.tsx   # Modul rezervări
│       ├── AdminFinances.tsx       # Modul financiar
│       ├── AdminAnalytics.tsx      # Modul analytics
│       ├── AdminUsers.tsx          # Modul utilizatori
│       └── AdminKYC.tsx            # Modul KYC
│
├── components/
│   └── admin/
│       ├── AdminSidebar.tsx        # Meniu lateral
│       ├── AdminLayout.tsx         # Layout cu sidebar
│       ├── AdminGuard.tsx          # Protecție rută admin
│       ├── StatsCard.tsx           # Card statistici
│       ├── ReservationsTable.tsx   # Tabel rezervări
│       ├── TransactionsTable.tsx   # Tabel tranzacții
│       └── UsersTable.tsx          # Tabel utilizatori
│
├── features/
│   └── admin/
│       ├── adminApi.ts             # API calls pentru admin
│       ├── rentalsApi.ts           # CRUD rezervări
│       └── kycApi.ts               # Verificări KYC
│
└── hooks/
    └── queries/
        ├── useAdminStats.ts        # Hook statistici
        ├── useRentals.ts           # Hook rezervări
        └── useAdminUsers.ts        # Hook utilizatori
```

---

## Faza 4: Module Detaliate

### 4.1 Dashboard Principal

Afișează:
- Total rezervări (zi/săptămână/lună)
- Venituri platformă
- Utilizatori noi
- Produse active
- Grafic venituri (recharts)
- Ultimele 5 rezervări
- Alerte (KYC pending, dispute-uri)

### 4.2 Modul Rezervări

| Funcționalitate | Descriere |
|-----------------|-----------|
| Listare | Tabel cu toate rezervările, filtru pe status |
| Detalii | Click pe rezervare → modal cu toate detaliile |
| Schimbare status | Admin poate confirma/anula/marca completat |
| Penalizări | Adăugare late fee pentru întârzieri |
| Export | Export CSV rezervări |

### 4.3 Modul Financiar

| Funcționalitate | Descriere |
|-----------------|-----------|
| Raport venituri | Grafic venituri platformă vs plăți proprietari |
| Tranzacții | Istoric complet tranzacții |
| Plăți pending | Lista plăților de efectuat către proprietari |
| Comisioane | Raport comisioane colectate |

### 4.4 Modul Analytics

| Metrică | Descriere |
|---------|-----------|
| Utilizatori activi | Grafic utilizatori activi zilnic/lunar |
| Produse populare | Top 10 produse închiriate |
| Categorii | Distribuție rezervări pe categorii |
| Locații | Hartă rezervări pe orașe |
| Conversie | Rata vizite → rezervări |

### 4.5 Modul Utilizatori & KYC

| Funcționalitate | Descriere |
|-----------------|-----------|
| Listare utilizatori | Tabel cu toți utilizatorii, search, filtre |
| Profil detaliat | Click → modal cu toate datele, produse, rezervări |
| Verificare KYC | Lista cereri KYC pending de aprobat |
| Suspend utilizator | Posibilitate de suspendare cont |
| Atribuire rol | Promovare la moderator/admin |

---

## Ordinea Implementării (MVP)

Pentru abordarea MVP cerută, implementăm în această ordine:

| Pas | Descriere | Timp estimat |
|-----|-----------|--------------|
| 1 | Tabele bază de date (roles, rentals, transactions, kyc) | Prima iterație |
| 2 | AdminGuard + AdminLayout + rute protejate | Prima iterație |
| 3 | Dashboard cu statistici de bază | Prima iterație |
| 4 | Modul Rezervări (listare + schimbare status) | A doua iterație |
| 5 | Modul Financiar (tranzacții + rapoarte) | A doua iterație |
| 6 | Modul Utilizatori (listare + KYC) | A treia iterație |
| 7 | Modul Analytics (grafice detaliate) | A treia iterație |

---

## Detalii Tehnice

### Protecție Rute Admin

```typescript
// AdminGuard.tsx
const AdminGuard = ({ children }) => {
  const { user } = useAuth();
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: () => supabase.rpc('has_role', { 
      _user_id: user?.id, 
      _role: 'admin' 
    })
  });

  if (isLoading) return <LoadingSpinner />;
  if (!isAdmin) return <Navigate to="/" />;
  
  return children;
};
```

### API Statistici Admin

```typescript
// Funcție database pentru statistici
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE(
    total_users BIGINT,
    total_products BIGINT,
    total_rentals BIGINT,
    revenue_this_month NUMERIC,
    pending_kyc BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    (SELECT COUNT(*) FROM profiles),
    (SELECT COUNT(*) FROM products WHERE is_active = true),
    (SELECT COUNT(*) FROM rentals),
    (SELECT COALESCE(SUM(platform_fee), 0) FROM rentals 
     WHERE created_at >= date_trunc('month', now())),
    (SELECT COUNT(*) FROM kyc_verifications WHERE status = 'pending')
$$;
```

---

## Fișiere de Modificat/Creat

| Fișier | Acțiune |
|--------|---------|
| `supabase/migrations/xxx_erp_tables.sql` | Creare tabele noi |
| `src/App.tsx` | Adăugare rute admin |
| `src/pages/admin/*.tsx` | Pagini noi (6 fișiere) |
| `src/components/admin/*.tsx` | Componente noi (7+ fișiere) |
| `src/features/admin/*.ts` | API functions (3 fișiere) |
| `src/hooks/queries/useAdmin*.ts` | Hooks React Query (3 fișiere) |

---

## Note Importante

1. **Securitate**: Rolurile sunt stocate într-un tabel separat (nu în profiles) pentru a preveni atacuri de escaladare privilegii

2. **Primul admin**: După creare tabele, trebuie adăugat manual primul admin:
   ```sql
   INSERT INTO user_roles (user_id, role) 
   VALUES ('UUID-ul-tau', 'admin');
   ```

3. **Integrare Stripe**: Modulul financiar poate fi extins ulterior cu Stripe pentru procesare plăți reale

4. **KYC extern**: Pentru verificare KYC profesională, se poate integra un serviciu extern (Onfido, Jumio) prin edge functions
