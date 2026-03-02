

## Plan: Înregistrare și profil pentru Persoană Juridică

### Modificări necesare

#### 1. Migrare bază de date — coloane noi pe `profiles`
Adăugăm câmpuri pentru datele companiei:
- `account_type` (text, default `'individual'`) — valori: `individual` / `business`
- `company_name` (text, nullable)
- `cui` (text, nullable) — Cod Unic de Înregistrare
- `reg_com` (text, nullable) — Nr. Registrul Comerțului
- `company_address` (text, nullable)

#### 2. Formularul de înregistrare (`src/pages/Auth.tsx`)
- Adăugăm un toggle/selector „Persoană fizică" / „Persoană juridică" în tab-ul de Register
- Când se selectează „Persoană juridică", apar câmpuri suplimentare: Denumire firmă, CUI, Nr. Reg. Comerțului
- Datele companiei se salvează în `profiles` la crearea automată a contului (prin `user_metadata` sau update imediat după signup)

#### 3. Profilul utilizatorului (`src/components/profile/ProfileTab.tsx`)
- Adăugăm secțiune „Date companie" care apare dacă `account_type === 'business'`
- Adăugăm switch pentru a comuta între persoană fizică și juridică
- Câmpuri editabile: Denumire firmă, CUI, Nr. Reg. Comerțului, Adresa companiei
- Schema Zod extinsă cu validări pentru câmpurile de companie

#### 4. API profil (`src/features/profile/profileApi.ts`)
- Extindem interfața `Profile` cu câmpurile noi
- Extindem `updateProfile` și `createProfile` să accepte datele de companie

### Fișiere afectate
- **Migrare SQL**: coloane noi pe `profiles`
- **Modificat**: `src/pages/Auth.tsx`, `src/components/profile/ProfileTab.tsx`, `src/features/profile/profileApi.ts`

