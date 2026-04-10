

## Plan: Documentație fotografică la predare și returnare

### Concept

Adăugăm un sistem de **check-in / check-out fotografic** în fluxul de închiriere. Ambele părți (proprietar și chiriaș) vor urca poze cu starea produsului în două momente cheie:

1. **La predare (check-out)** — proprietarul și chiriașul fotografiază produsul când se predă
2. **La returnare (check-in)** — ambii fotografiază produsul când se returnează

Acest lucru oferă dovezi clare în caz de dispute privind deteriorarea.

### Fluxul utilizatorului

```text
Rental confirmed → PREDARE (check-out):
  ├─ Proprietar: urcă poze "stare la predare"
  └─ Chiriaș: urcă poze "stare la primire"
  → Status trece la "active"

Rental active → RETURNARE (check-in):
  ├─ Chiriaș: urcă poze "stare la returnare"  
  └─ Proprietar: urcă poze "stare la primire înapoi"
  → Status trece la "completed"
```

### Modificări tehnice

#### 1. Baza de date — migrare nouă

Creăm tabela `rental_inspections`:

```sql
CREATE TABLE rental_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('checkout', 'checkin')),
  role TEXT NOT NULL CHECK (role IN ('owner', 'renter')),
  photos TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: participanții la rental pot vedea și crea inspecții
ALTER TABLE rental_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own inspections" ON rental_inspections
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM rentals r WHERE r.id = rental_id
    AND (r.renter_id = auth.uid() OR r.owner_id = auth.uid())
  ));

CREATE POLICY "Participants can view inspections" ON rental_inspections
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM rentals r WHERE r.id = rental_id
    AND (r.renter_id = auth.uid() OR r.owner_id = auth.uid())
  ) OR has_role(auth.uid(), 'admin'));
```

Creăm un bucket de storage `rental-inspections` (public read).

#### 2. Componenta `InspectionUpload`

Componentă reutilizabilă cu:
- Upload de poze (refolosim logica de compresie din `ImageUpload.tsx`)
- Câmp opțional de note/observații
- Indicator vizual al statusului (cine a urcat, cine nu)
- Maxim 10 poze per inspecție

#### 3. Pagină/Dialog `RentalInspection`

- Accesibil din dashboard-ul proprietarului și chiriașului
- Afișează pozele ambelor părți side-by-side
- Buton de confirmare după ce ambii au urcat poze

#### 4. Integrare în fluxul existent

- **LendingsTab**: buton "📷 Predare" pe rentalurile confirmate, "📷 Returnare" pe cele active
- **RentalsTab**: aceleași butoane din perspectiva chiriașului
- **Admin**: vizualizare poze inspecție în detaliul rezervării

#### 5. API (`src/features/rentals/inspectionApi.ts`)

- `uploadInspectionPhoto(file, rentalId, userId)` — upload în bucket
- `createInspection(rentalId, phase, role, photos, notes)` — insert în tabel
- `getInspections(rentalId)` — fetch inspecții pentru un rental

### Fișiere noi
| Fișier | Descriere |
|---|---|
| `src/features/rentals/inspectionApi.ts` | API pentru inspecții |
| `src/components/dashboard/InspectionDialog.tsx` | Dialog pentru upload poze + vizualizare |

### Fișiere modificate
| Fișier | Modificare |
|---|---|
| `src/components/dashboard/LendingsTab.tsx` | Buton inspecție pe rentaluri confirmate/active |
| `src/components/dashboard/RentalsTab.tsx` | Buton inspecție din perspectiva chiriașului |
| `src/components/admin/user-detail/UserRentalsTab.tsx` | Link vizualizare inspecții |
| Migrare SQL | Tabelă + bucket + RLS |

### Securitate
- RLS pe `rental_inspections`: doar participanții + admin
- Storage RLS pe bucket: upload doar de participanți la rental
- Pozele nu pot fi șterse după upload (protecție anti-manipulare)

