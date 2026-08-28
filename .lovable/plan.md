# Eliminare completă a verificării KYC din Rentli

Scoatem tot fluxul de verificare a identității cu acte (upload CI, OCR, aprobare admin) și ștergem definitiv datele deja colectate. Accesul la publicare și rezervare rămâne condiționat doar de cont cu email și telefon verificat. Integrarea unui furnizor extern (ex. Stripe Identity) va fi un proiect separat, nu pregătim nimic pentru el acum.

## 1. Ce dispare pentru utilizatori

- Pagina „Verificare identitate” (`/verificare`) și tot flow-ul de upload documente.
- Bannerele „Verificare identitate necesară” de la publicare anunț, pagina de produs, checkout.
- Pastila KYC din meniul mobil, statusurile KYC din profil, dashboard, notificări și insigna „identitate verificată” de pe cardul proprietarului.
- Emailurile KYC (trimis / aprobat / respins / re-încărcare documente).
- Secțiunile din FAQ și textele de suport care menționează verificarea cu buletinul.

## 2. Ce înlocuiește poarta de acces

Publicarea unui anunț și rezervarea vor cere: cont autentificat + email confirmat + telefon verificat prin SMS. Componenta existentă de verificare telefon devine singura barieră; unde azi apare bannerul KYC va apărea îndemnul de verificare a telefonului.

## 3. Ștergerea datelor (ireversibil)

- Ștergerea tuturor fișierelor din bucket-ul privat de documente KYC și eliminarea bucket-ului.
- Ștergerea tabelelor `kyc_cases`, `kyc_documents`, `kyc_audit_log`, `kyc_extracted_data` (inclusiv CNP-uri, serii CI, adrese extrase).
- Eliminarea coloanelor `kyc_status`, `kyc_level`, `kyc_last_verified_at` din profiluri.
- Curățarea notificărilor și a intrărilor din jurnalul de activitate legate de KYC.

## 4. Procesele-verbale (PV predare/primire)

Scoatem complet CNP, seria și numărul CI din PV-uri. Documentul va identifica părțile prin nume complet, email/telefon și datele închirierii (cod rezervare, produs, perioadă). Eliminăm și generatorul de identitate fictivă folosit azi ca placeholder.

## 5. Admin

- Dispar secțiunile Admin „KYC” (listă + detaliu), cardul de date extrase din buletin și filtrele/coloanele după status KYC din lista de utilizatori.
- Statisticile de dashboard și rapoartele care numărau dosare KYC se elimină.
- Retragerile de bani nu vor mai fi condiționate de status KYC.

## Detalii tehnice

Frontend – ștergere: `src/pages/KycVerification.tsx`, `src/components/kyc/*`, `src/components/admin/kyc/*`, `src/pages/admin/AdminKYC.tsx`, `AdminKYCDetail.tsx`, `src/features/admin/kycApi.ts`, `kycExtractedDataApi.ts`, `src/hooks/queries/useKyc.ts`, `useKycGate.ts`, `src/components/layout/mobile-drawer/DrawerKycPill.tsx`.

Frontend – curățare referințe: `App.tsx` (rute), `AdminSidebar`/`MobileAdminMenu`, `PublishProduct.tsx`, `PublishWizard.tsx`, `BookingCard.tsx`, `Checkout.tsx`, `StickyCheckoutBar.tsx`, `OwnerTrustCard.tsx`, `AccountTab.tsx`, `SmartCards.tsx`, dashboard/notification components, `useAccountDashboard.ts`, `useCurrentUserProfile.ts`, `useAdminStats.ts`, `adminApi.ts`, `withdrawalsApi.ts`, `profileApi.ts`, `notificationCategory.ts`, `uxCopy.ts`, `FAQ.tsx`, `AccountHubMenu`, `Footer`, `Navbar`, `InfoPanel`, `ActivityLogPage`, `BusinessOnboarding`.

PV: rescriere `src/lib/pvContent.ts` și `src/lib/pvDocx.ts` fără CNP/serie/număr CI și fără `fakeIdentity`; scoatem câmpurile de identitate din `get_rental_full_detail` și eliminăm RPC-ul `get_pv_identity_data`; ajustăm `PvSignatureDialog` și `rentalDetailPageApi.ts`.

Backend: ștergere edge function `extract-id-data`; ștergere template-uri `kyc-*.tsx` + intrările din `registry.ts`; curățare referințe în `create-checkout-session`, `admin-delete-user`, `support-ai-chat`.

Migrare SQL (o singură migrare, după ștergerea obiectelor din storage): drop trigger/funcții `enforce_kyc_for_actions`, `enforce_kyc_case_user_immutability`, `enforce_kyc_cases_user_update`, `detect_kyc_duplicate_names`, `get_admin_kyc_cases`, `get_kyc_duplicate_users`, `get_pv_identity_data`; rescriere `get_admin_users`, `get_admin_stats`, `get_rental_full_detail` fără câmpuri KYC; `DROP TABLE` pentru cele 4 tabele KYC; `ALTER TABLE public.profiles DROP COLUMN kyc_status, kyc_level, kyc_last_verified_at`; ștergere politici storage și bucket-ul de documente KYC; ștergere notificări cu `type` KYC.

Memorie proiect: eliminăm `mem/features/kyc-verification-module` și `mem/features/kyc-id-data-extraction`, adăugăm o notă de tip constraint: nu stocăm poze cu acte de identitate; verificarea identității se va face doar prin furnizor extern.
