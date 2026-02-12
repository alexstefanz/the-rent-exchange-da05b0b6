

# Confirmare acceptare cerere + Chat cu chiriasul

## Ce se schimba

### 1. Dialog de confirmare dupa acceptare (LendingsTab)
Cand proprietarul apasa "Accepta", dupa ce cererea e procesata cu succes, in loc de un simplu toast, se afiseaza un **dialog de confirmare** cu informatii despre chirias si booking, similar cu screenshot-ul 2:

- **Avatar + Nume chirias** (cu link catre profil)
- **Verificat ID** - badge verde daca chiriasul are KYC aprobat
- **3 casete info**:
  - Perioada inchiriere (data start - data end)
  - Booking number (primele 8 caractere din rental ID)
  - Pret total (subtotal RON)
- **Buton "Discuta cu chiriasul"** - deschide/creaza conversatie cu chiriasul
- **Buton "Cancel request"** - vizibil doar daca cererea a fost creata in ultimele 24h, cu asterisk si nota "*Anularea este posibila doar in primele 24 de ore"

### 2. Verificare KYC chirias
Se face un query la tabela `kyc_verifications` pentru a verifica daca chiriasul are status "approved" - afisam "Verificat ID" cu iconita verde.

### 3. Initiere chat cu chiriasul
Butonul "Discuta" foloseste `getOrCreateConversation` din messagingApi pentru a crea/deschide o conversatie intre proprietar si chirias pe produsul respectiv, apoi deschide ChatDialog.

## Detalii tehnice

### Fisier: `src/components/dashboard/LendingsTab.tsx`
- Adaug state `acceptedRental` care se seteaza dupa accept reusit (in loc de toast)
- Adaug un Dialog care afiseaza informatiile de confirmare
- Query KYC status pentru chirias (`kyc_verifications` table)
- Buton "Discuta" care creaza conversatie si deschide ChatDialog
- Buton "Cancel request" cu conditia de 24h si nota cu asterisk
- Cancel request apeleaza `respondToRental(rentalId, "reject")` sau direct update pe rental

### Fisier: `src/features/rentals/ownerRentalsApi.ts`
- Extind `OwnerRental` interface sa includa `renter_id` (deja exista) - no changes needed

### Flow
1. Owner apasa "Accepta" pe cerere
2. Se proceseaza acceptarea (edge function)
3. Se afiseaza dialogul de confirmare cu datele booking-ului
4. Owner poate apasa "Discuta" pentru a trimite mesaj chiriasului
5. Owner poate anula cererea doar in primele 24h (cu confirmare)

## Fisiere modificate

| Fisier | Schimbare |
|--------|-----------|
| `src/components/dashboard/LendingsTab.tsx` | Dialog confirmare dupa acceptare, chat integration, cancel cu 24h |

