# KYC inline în „Contul meu"

Permite utilizatorului să completeze flow-ul KYC direct din pagina `/contul-meu`, fără redirect către `/verificare`.

## Stadiu actual

- `AccountTab.tsx` are o secțiune `Verification` care arată statusul KYC + un buton „Începe verificarea" care face `navigate("/verificare")`.
- `src/pages/KycVerification.tsx` (536 linii) conține tot UI-ul + logica (load case, upload docs, submit) într-o singură pagină cu `<Navbar/>`, `<main/>`, `<Footer/>`.

## Plan

### 1. Extrage flow-ul KYC într-un component reutilizabil

Creez `src/components/kyc/KycInlineFlow.tsx` care conține:
- Tot state-ul: `kycCase`, `docs`, `isLoading`, `isSubmitting`, `activeDocType`, `phoneGate`
- Tot logic-ul: load case, upload, submit, file input handling
- UI-ul: cardurile cu pașii (upload ID front/back/selfie, submit button, status banners)

**NU** include `<Navbar/>`, `<main className="container...">`, `<Footer/>`, `<ArrowLeft Înapoi>`. Doar conținutul intern.

Prop opțional `variant?: "page" | "inline"` pentru micile diferențe de spacing (ex: `max-w-2xl` doar pe variantul page).

### 2. Refactor `KycVerification.tsx` (page)

Devine un wrapper subțire:
```tsx
<Navbar />
<main className="container max-w-2xl py-8 px-4 pt-20 lg:pt-8">
  <Button onClick={() => navigate(-1)}>Înapoi</Button>
  <KycInlineFlow variant="page" />
</main>
<Footer />
```

### 3. Integrare în `AccountTab.tsx` — secțiunea Verification

Înlocuiesc butonul „Începe verificarea" cu un mecanism progressive disclosure:

- **Dacă** `kycStatus === "VERIFIED"` → păstrez doar badge-ul de status (nimic de făcut)
- **Dacă** `kycStatus === "SUBMITTED" / "NEEDS_MANUAL_REVIEW"` → păstrez badge „În curs de verificare" (read-only)
- **Altfel** → afișez un toggle „Începe verificarea" / „Reîncepe verificarea" care expand-uiește inline `<KycInlineFlow variant="inline" />` chiar în secțiune

State local nou în `AccountTab`: `const [showKyc, setShowKyc] = useState(false)`. La click pe buton → `setShowKyc(true)` și scroll smooth la zona expandată.

Mini-stepper-ul existent (Date personale / Documente / Aprobat) rămâne deasupra ca progress indicator.

### 4. Păstrez ruta `/verificare`

- Linkurile existente (drawer mobile, KycRejectedBanner, notificări email, deep links) continuă să funcționeze.
- E doar o cale alternativă: utilizatorii pot completa KYC fie pe pagina dedicată, fie inline în Contul meu.

## Fișiere modificate

- **Nou:** `src/components/kyc/KycInlineFlow.tsx` (~470 linii — conținutul intern din KycVerification)
- **Refactorizat:** `src/pages/KycVerification.tsx` (~50 linii — doar shell)
- **Modificat:** `src/components/profile/AccountTab.tsx` — secțiunea Verification afișează `<KycInlineFlow variant="inline" />` la cerere

## Out of scope

- Modificări DB / RLS (folosim aceleași tabele `kyc_cases` + `kyc_documents`)
- Logică nouă de validare / status — totul reutilizat 1:1
- Redesign vizual al pașilor — păstrez UI-ul actual

## Risc

Minim — doar mutare de cod într-un component partajat. Dacă vrei și un redesign mai compact pentru variantul `inline` (ex: stepper orizontal în loc de carduri full-width), pot face într-o fază separată.
