# Eliminare opțiune „Persoană juridică" / Companie din platformă

Funcționalitatea de cont business rămâne pe viitor — o ascundem din UI și forțăm toate conturile noi/existente pe flow-ul de persoană fizică. Nu atingem schema DB (coloanele `account_type`, `company_name`, `cui`, `reg_com`, `company_address` rămân pentru când va fi reintrodusă).

## Modificări

### 1. `src/pages/Auth.tsx` (înregistrare)
- Elimin import-ul și render-ul `<AccountTypeToggle …/>`.
- Elimin state-ul `accountType` și textul condițional „Vei completa datele firmei (CUI, IBAN)…".
- În `handleRegister`, scot ramura `if (accountType === "business") updates.account_type = "business"` și redirect-ul condiționat către `/onboarding/business`. Toate conturile noi rămân `individual` (default-ul din DB) și merg pe flow-ul standard.

### 2. `src/App.tsx`
- Scot ruta `/onboarding/business` și import-ul lazy `BusinessOnboarding`. Pagina rămâne pe disk (`src/pages/BusinessOnboarding.tsx`) pentru viitor, dar nu mai e accesibilă.

### 3. `src/components/profile/ProfileTab.tsx` (My Account)
- Elimin switch-ul „Persoană juridică" și întreg blocul `{isBusiness && (…)}` cu inputurile `company_name`, `cui`, `reg_com`, `company_address`.
- Scot state-ul `isBusiness` + `setIsBusiness`, citirea `account_type === 'business'` și payload-ul de salvare aferent. `updateProfile` trimite doar `full_name`, `phone`, `email`.
- Las câmpurile zod din schema formularului ca optional (nu mai sunt folosite) sau le scot pentru curățenie — opțiune curată: scot și câmpurile.

### 4. Fișiere lăsate intenționat
- `src/components/onboarding/AccountTypeToggle.tsx`, `src/components/onboarding/CuiLookupField.tsx`, `src/components/onboarding/CompanyAutofillCard.tsx`, `src/pages/BusinessOnboarding.tsx` — rămân ca cod „dormant" pentru reintroducere viitoare.
- `src/pages/admin/AdminUserDetail.tsx` — afișarea CUI/RegCom pentru conturile existente marcate `business` rămâne (admin info, nu UI public).
- `src/features/profile/profileApi.ts` — semnătura cu câmpurile business rămâne (DB neschimbat).

## Verificare
- Pagina `/autentificare` → tab Înregistrare nu mai afișează toggle-ul Persoană fizică / Companie și nici textul „Vei completa datele firmei".
- `/cont` → tab Profil nu mai are switch-ul „Persoană juridică" și nici inputurile companie.
- Navigarea directă la `/onboarding/business` cade pe NotFound.