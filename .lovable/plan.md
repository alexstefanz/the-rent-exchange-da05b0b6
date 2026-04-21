

## Plan: KYC gating pe pagina produsului + fix rută 404

### Cauza erorii din screenshot (404)
Codul redirectează către `/kyc` în 4 locuri, dar **ruta reală este `/verificare`** (configurată în `App.tsx:126` ca `KycVerification`). Orice utilizator nereverificat care încerca să plătească ajungea pe pagina 404 — exact ce arată captura ta.

### Modificări

#### 1. Fix rute sparte (`/kyc` → `/verificare`)
- `src/components/product/BookingCard.tsx` (linia 90)
- `src/pages/Checkout.tsx` (liniile 74 și 96)
- `src/pages/NewProduct.tsx` (linia 122)
- `src/components/kyc/KycGateBanner.tsx` (linia 83 — `kycHref`)

#### 2. UX nou pe `BookingCard` (componenta de rezervare din pagina produsului)

Comportament dorit pentru utilizatorii **autentificați și fără KYC verificat**:

| Stare utilizator | Buton "Rezervă" | Mesaj afișat |
|---|---|---|
| Neautentificat | Activ (la click → trimite la login din checkout, ca acum) | — |
| Autentificat + KYC verificat | Activ | — |
| Autentificat + KYC neînceput / respins | **Dezactivat** (gri, neclickabil) | Card portocaliu deasupra butonului: "Pentru a rezerva acest produs trebuie să-ți verifici identitatea." + buton secundar "Verifică-mi identitatea" → `/verificare?next=/produs/<slug>` |
| Autentificat + KYC în așteptare (SUBMITTED / NEEDS_MANUAL_REVIEW) | **Dezactivat** | Card neutru: "Identitatea ta este în curs de verificare. Vei putea rezerva imediat ce este aprobată (de obicei 24h)." (fără buton CTA) |

**Implementare**:
- Reutilizez componenta existentă `<KycGateBanner reason="book" nextHref={current_path} />` care **deja** acoperă toate cele 3 stări (notStarted / pending / rejected) cu copy bilingv RO/EN și design corect (orange ring + ShieldAlert icon, sau Clock pentru pending, sau XCircle pentru rejected).
- Inserez bannerul în `BookingCard.tsx` deasupra butonului "Rezervă" (între breakdown-ul de preț și buton).
- Setez `disabled` pe buton când: `needsKyc` este true (orice stare ≠ verified pentru user autentificat).
- Elimin `toast` + `navigate("/kyc")` din `handleBooking` (devine cod mort — butonul e dezactivat).
- Schimb label-ul butonului dezactivat: dacă există KYC pending → "În așteptare verificare"; dacă necesită KYC → label rămâne "Verifică identitatea pentru a rezerva" (deja e implementat) dar acum doar ca text pe buton dezactivat, nu mai e clickabil.

#### 3. Curățare în `Checkout.tsx`
Păstrăm ca **al doilea strat de protecție** verificările KYC din checkout (în caz că user-ul navighează direct la /checkout cu state) — doar fixăm ruta `/kyc` → `/verificare`.

### Fișiere modificate

| Fișier | Modificare |
|---|---|
| `src/components/product/BookingCard.tsx` | Adaug `<KycGateBanner reason="book" nextHref={...}/>` deasupra butonului; dezactivez butonul când utilizatorul are nevoie de KYC; elimin toast+navigate redundante; fix `/kyc` → `/verificare` |
| `src/components/kyc/KycGateBanner.tsx` | Fix `kycHref` să folosească `/verificare` |
| `src/pages/Checkout.tsx` | Fix 2× `navigate("/kyc")` → `navigate("/verificare")` |
| `src/pages/NewProduct.tsx` | Fix `navigate("/kyc")` → `navigate("/verificare")` |

### Limitări recunoscute
- Vizitatorii **neautentificați** nu pot ști în avans că au nevoie de KYC — își vor face cont, apoi vor vedea bannerul. (Acesta e flow-ul corect: nu cerem KYC pentru browsing, doar pentru acțiune efectivă.)
- Bannerul KYC ocupă spațiu vertical în coloana sticky pe desktop, dar este acceptabil pentru că este temporar (doar pentru utilizatorii nereverificați).

