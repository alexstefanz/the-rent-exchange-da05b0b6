

## Plan: Gating KYC pentru publicare anunțuri și rezervări

### Context — ce găsesc acum
- Există infrastructura KYC completă (`kyc_cases`, `kyc_documents`, `profiles.kyc_status`, pagina `/kyc` și flux admin de aprobare)
- **Lipsă critică**: niciun guard nu blochează acțiunile sensibile. Orice utilizator cu `kyc_status='NOT_VERIFIED'` poate:
  - Publica anunțuri din `/anunt-nou` (NewProduct) ✗
  - Iniția rezervări din checkout + plată Stripe ✗
- Pagina `/kyc` permite upload, dar nimic nu o face obligatorie

### Politica propusă (2 niveluri)

| Acțiune | Status KYC necesar |
|---|---|
| Navigare, browse, favorite, mesaje | oricare |
| **Publicare anunț** (proprietar) | `VERIFIED` |
| **Inițiere rezervare** (chiriaș) | `VERIFIED` |
| Continuare flux în curs (`SUBMITTED`/`NEEDS_MANUAL_REVIEW`) | blocat cu mesaj "În curs de verificare" |
| `REJECTED` | blocat cu CTA "Reîncarcă documente" |

Statusurile existente: `NOT_VERIFIED`, `IN_PROGRESS`, `SUBMITTED`, `NEEDS_MANUAL_REVIEW`, `VERIFIED`, `REJECTED`.

### Componente noi

#### 1. Hook `useKycGate`
`src/hooks/queries/useKycGate.ts`
- Returnează `{ status, isVerified, isPending, isRejected, loading, requireKyc(action) }`
- Bazat pe `profiles.kyc_status` din `useCurrentUserProfile`

#### 2. Componenta `KycGateBanner`
`src/components/kyc/KycGateBanner.tsx`
- Card alert cu 3 variante vizuale (warning, info, error) în funcție de status
- Texte bilingve RO/EN + CTA primary "Verifică-mi identitatea" → `/kyc`
- Context-aware: titlu diferit pentru "publicare" vs "rezervare"

### Modificări frontend (gating client-side — UX)

#### `src/pages/NewProduct.tsx`
- La mount, dacă `kyc_status !== 'VERIFIED'`:
  - Afișez `<KycGateBanner reason="publish" />` în loc de formular
  - Buton mare "Mergi la verificare KYC"
- Dacă status e `SUBMITTED`/`NEEDS_MANUAL_REVIEW` → mesaj "Identitatea ta e în curs de verificare. Vei putea publica imediat ce e aprobată."

#### `src/components/product/BookingCard.tsx`
- Înainte de redirect spre `/checkout`, verific `kyc_status`
- Dacă nu e `VERIFIED`:
  - Buton "Rezervă acum" devine "Verifică identitatea pentru a rezerva"
  - Click → `KycGateBanner` în dialog sau redirect direct la `/kyc`

#### `src/pages/Checkout.tsx`
- Guard la mount: dacă user logat și `kyc_status !== 'VERIFIED'` → redirect `/kyc?next=checkout` cu state-ul preservat
- Sau afișez `KycGateBanner` direct pe pagină în loc de pașii 1–4

#### `src/components/dashboard/RequestsTab.tsx` și butonul "Acceptă"
- Înainte de a accepta o cerere primită: verific kyc_status proprietar (deja e proprietar deci ar trebui verificat — dar pun guard defensiv)

### Modificări backend (gating server-side — securitate reală)

UI guard nu e suficient — un atacator poate apela API direct. Trebuie blocat și pe server.

#### Migrație SQL: trigger pe `products` și `rentals`

```sql
CREATE OR REPLACE FUNCTION public.enforce_kyc_for_actions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  SELECT kyc_status INTO v_status 
  FROM profiles 
  WHERE id = COALESCE(NEW.owner_id, NEW.renter_id);
  
  IF v_status IS DISTINCT FROM 'VERIFIED' THEN
    RAISE EXCEPTION 'KYC_REQUIRED: Trebuie să-ți verifici identitatea înainte de a continua.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger pe products INSERT (blochează publicare)
CREATE TRIGGER products_kyc_check
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_kyc_for_actions();

-- Trigger pe rentals INSERT (blochează rezervare)
CREATE TRIGGER rentals_kyc_check
  BEFORE INSERT ON public.rentals
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_kyc_for_actions();
```

**Notă importantă**: trigger-ul nu rulează pentru admin (admin poate crea oricând). Adaug excepție:
```sql
IF has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
```

#### Edge function `create-checkout-session`
- Adaug check: înainte de a crea Stripe session, fetch `profiles.kyc_status` pentru `user.id`
- Dacă ≠ `VERIFIED` → return 403 cu `{ error: "KYC_REQUIRED" }`
- Frontend captează acest error și redirectează către `/kyc`

### Capturare erori în UI
- În `createProduct` și `createRental` (și `createRentalWithStripeCheckout`):
  - Detect `KYC_REQUIRED` în mesajul de eroare
  - Toast: "Identitate neverificată. Te redirecționăm către verificare..."
  - `navigate("/kyc")`

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/hooks/queries/useKycGate.ts` | **NOU** — hook central pentru status KYC |
| `src/components/kyc/KycGateBanner.tsx` | **NOU** — banner reutilizabil cu CTA |
| `src/pages/NewProduct.tsx` | Guard la mount + banner |
| `src/pages/Checkout.tsx` | Guard la mount + redirect cu state preserved |
| `src/components/product/BookingCard.tsx` | CTA condițional pe status KYC |
| `src/features/products/productsApi.ts` | Capturare eroare `KYC_REQUIRED` în `createProduct` |
| `src/features/rentals/rentalsApi.ts` | Capturare eroare `KYC_REQUIRED` în `createRental` |
| `supabase/functions/create-checkout-session/index.ts` | Server-side guard 403 |
| Migrație SQL nouă | Trigger `enforce_kyc_for_actions` pe `products` + `rentals` |
| `src/data/uxCopy.ts` | Texte RO/EN: banner, CTA, statusuri |

### Aspecte UX
- **Mesaj clar**: nu blocăm fără explicație — fiecare blocaj are CTA către `/kyc`
- **Rezervare în curs**: dacă utilizator e mid-checkout și nu are KYC, păstrăm datele rezervării în query string (`?productId=...&start=...&end=...`) ca să poată continua după aprobare
- **Status `SUBMITTED`**: mesaj "în lucru, ETA 24h" în loc de eroare
- **Anunțuri existente** create înainte de migrație: NU le afectăm (trigger e pe INSERT, nu UPDATE), rămân vizibile

### Limitări recunoscute
- Aprobarea KYC e manuală (admin) — utilizatorul așteaptă fizic. Acceptabil pentru MVP, dar pe termen lung merită integrare cu Stripe Identity / Onfido (task separat)
- Nu blocăm acceptarea rezervării de către proprietar dacă proprietarul nu mai e verificat (status schimbat după publicare). Caz extrem de rar — putem adăuga ulterior

