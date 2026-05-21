## Modificări

Eliminăm opțiunea de editare a IBAN-ului. Singurele acțiuni rămân **Adaugă** (când nu există IBAN) și **Șterge** (când există). Pentru a schimba IBAN-ul, utilizatorul îl șterge și adaugă unul nou — flux mai sigur și mai clar (evită modificări accidentale ale contului bancar destinatar).

### 1. `src/components/profile/AccountTab.tsx` — secțiunea „Cum primești banii"

În vizualizarea cu IBAN salvat (linia ~978):
- Elimin butonul „Schimbă" (cu iconița `Pencil`) și `setEditing(true)` aferent
- Păstrez doar butonul „Șterge" (cu `AlertDialog` de confirmare — neschimbat)
- Curăț importurile `Pencil` dacă nu mai e folosit nicăieri

În vizualizarea de adăugare (când nu există IBAN):
- Rămâne neschimbată — deja afișează formularul cu buton „Salvează IBAN"
- Elimin butonul „Anulează" condiționat de `hasIban` (nu mai e accesibil acest caz)

### 2. `src/components/earnings/WithdrawalMethodCard.tsx` — card wallet din `/castiguri`

În vizualizarea cu IBAN existent (linia ~46):
- Înlocuiesc butonul „Editează" (Pencil) cu un buton „Șterge" (Trash2, stil destructive)
- Adaug `AlertDialog` de confirmare ștergere identic cu cel din AccountTab
- Implementez `handleDelete` care apelează `supabase.from("profiles").update({ iban: null, account_holder: null })` cu verificare prealabilă pentru cereri de retragere în așteptare (același pattern ca în AccountTab)
- La succes: invalidează query-urile `earnings`/`walletBalance` și afișează toast

În vizualizarea fără IBAN (empty state):
- Rămâne neschimbată — deja are buton „Adaugă IBAN" care navighează la `/contul-meu?section=payout`

### Rezultat

| Stare | Cont meu | Wallet |
|-------|----------|--------|
| Fără IBAN | Formular „Salvează IBAN" | Buton „Adaugă IBAN" → redirect |
| Cu IBAN | Doar „Șterge" | Doar „Șterge" |

Logica business (validare IBAN, blocare ștergere când există retrageri pending, RLS) rămâne neatinsă.
