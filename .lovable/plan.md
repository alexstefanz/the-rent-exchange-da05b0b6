# Nume complet obligatoriu la KYC + confirmare admin

## Context
Utilizatorii apar „Fără nume" în listă (`profiles.full_name` gol). KYC-ul colectează deja un câmp nume obligatoriu (`KycInlineFlow` linia 73–242) și îl scrie în `profiles.full_name`. Problema: (1) utilizatorii care nu au făcut KYC rămân fără nume; (2) numele introdus de utilizator nu este comparat explicit cu numele extras OCR din CI; (3) admin-ul aprobă fără să confirme că cele două coincid.

## Modificări

### 1. KYC inline flow — întărim cerința de nume
- Păstrăm pasul existent „Date personale" cu `fullName` obligatoriu (deja blochează submit-ul).
- Adăugăm sub câmp un mesaj clar: „Numele trebuie să fie identic cu cel din cartea de identitate. Va fi verificat de echipa noastră."
- La trimitere, scriem și `profiles.full_name_source = 'KYC'` și `profiles.full_name_locked = true` (vezi migrația). După aprobarea KYC numele nu mai poate fi schimbat de utilizator din UI fără cerere de actualizare.

### 2. Admin KYC Detail — comparator nume
În `AdminKYCDetail.tsx`, în panoul „Date extrase din CI", adăugăm o secțiune nouă **„Verificare nume"**:

```text
Nume declarat (profil) : ION POPESCU
Nume extras din CI    : POPESCU ION
Status                : ⚠ Diferit (după normalizare: identic)
[ Marchează ca potrivit ]   [ Cere reîncărcare ]
```

- Normalizare: uppercase, fără diacritice, sortare cuvinte, trim spații multiple.
- Dacă numele normalizate diferă, butonul **Aprobă** este dezactivat cu tooltip „Numele nu coincide cu CI-ul. Cere reîncărcare sau corectează numele înainte de aprobare."
- Buton „Corectează numele din profil" deschide un mic dialog care setează `profiles.full_name` la valoarea din CI (cu audit în `kyc_audit_log`: action `NAME_CORRECTED_BY_ADMIN`).
- La click pe **Aprobă**, în plus față de fluxul existent, marcăm `kyc_extracted_data.verified_by_admin = true` și salvăm `profiles.full_name_verified_at = now()`.

### 3. Listă utilizatori admin
În `AdminUsers` înlocuim fallback-ul „Fără nume" cu badge:
- nume gol și fără KYC → „Fără nume · KYC neînceput"
- nume gol și KYC trimis → „Fără nume · KYC în verificare"
Permite admin-ului să identifice rapid cazurile.

### 4. Migrație DB
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name_source text,        -- 'USER' | 'KYC' | 'ADMIN'
  ADD COLUMN IF NOT EXISTS full_name_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS full_name_verified_at timestamptz;
```
Fără modificări de RLS (câmpurile sunt deja acoperite de policy-urile existente pe `profiles`).

## Ce NU schimbăm
- Schema `kyc_cases` / `kyc_extracted_data` rămâne identică.
- Edge function `extract-id-data` rămâne neschimbată (deja extrage `full_name`).
- Fluxul de aprobare/respingere KYC existent rămâne; doar adăugăm gate-ul pe potrivire nume.

## Notă despre utilizatorii existenți „Fără nume"
Nu putem completa retroactiv numele lor — vor fi forțați să completeze la primul flux KYC sau pot fi editați manual de admin din `AdminUserDetail`. Plan-ul nu include un script de migrare a datelor existente.
