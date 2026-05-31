## Obiectiv

În secțiunea **Cum primești banii** (Cont → Payout):
1. Eliminăm afirmația despre titular pe care nu o putem verifica.
2. IBAN-ul se poate seta **o singură dată**. Pentru schimbare, utilizatorul trebuie să deschidă un tichet de suport.

## Modificări — `src/components/profile/AccountTab.tsx`

### A. Eliminare copy nejustificat
- **Descrierea secțiunii** (linia 621): scoatem fraza despre "titularul contului" și "suspendarea contului". Înlocuim cu un text neutru:
  - RO: `Adaugă IBAN-ul în care vei primi banii din închirieri.`
  - EN: `Add the IBAN where you'll receive rental payouts.`
- **Banner-ul amber din formul de editare** (liniile 1060–1068): eliminat complet (caseta roșie din screenshot).
- În formul de adăugare păstrăm doar pre-completarea `Titular cont: <full_name>` ca informativ; **fără** validare suplimentară. Linia rămâne pentru transparență, ca utilizatorul să știe ce nume e atașat plății.

### B. IBAN o singură dată (one-shot)
- În vizualizarea cu IBAN salvat (liniile 977–1031):
  - **Eliminăm** butoanele `Adaugă` și `Șterge`, `AlertDialog`-ul de confirmare ștergere, `handleDelete`, state-urile `confirmOpen` și `deleting`.
  - Adăugăm un singur buton secundar **„Solicită schimbare IBAN"** / `Request IBAN change` care navighează la `/suport`.
  - Sub IBAN-ul mascat, inserăm un info box gri/amber cu lacăt (`Lock` icon):
    - RO: `IBAN-ul este blocat pentru securitate. Pentru schimbare, deschide un tichet de suport — echipa verifică identitatea și actualizează contul.`
    - EN: `Your IBAN is locked for security. To change it, open a support ticket — our team will verify your identity and update the account.`
  - Păstrăm badge-ul `Implicit` și caseta verde `IBAN configurat — ești gata să primești plăți.`
- `setEditing(true)` nu mai poate fi declanșat din UI când există deja un IBAN. Inițializarea `editing = !hasIban` rămâne corectă pentru utilizatorii fără IBAN.

### C. Cleanup
- Importurile `Trash2` și componentele `AlertDialog*` rămân utile în restul fișierului (Danger Zone, etc.), nu le ștergem.
- `account_holder_name` continuă să se salveze din `profile.full_name` la prima introducere — fără modificări la schemă.

## Ce **nu** se schimbă
- Nu se modifică backend / RLS / migrări. Coloana `iban` rămâne editabilă din DB pentru admini (vor procesa cererea de schimbare manual via tichet).
- Withdrawals și restul UX rămân neschimbate.

## Verificare
1. User fără IBAN → vede formul cu input + buton `Salvează IBAN`, fără amber-banner.
2. După prima salvare → IBAN-ul devine read-only, fără buton de ștergere/editare. Apare info box cu lacăt + buton `Solicită schimbare IBAN` care duce la `/suport`.
3. La refresh, IBAN-ul rămâne blocat. Singura cale de modificare e prin tichet (manual, de către admin/suport).
