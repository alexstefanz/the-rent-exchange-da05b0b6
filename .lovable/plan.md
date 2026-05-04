## Notificări retrageri pentru admin — îmbogățire date

Momentan, când un utilizator solicită o retragere, notificarea pentru admin afișează doar numele și suma. Vom adăuga datele necesare pentru verificare rapidă.

### Schimbare

Actualizez funcția trigger `notify_admin_withdrawal_requested` astfel încât descrierea notificării din panoul admin să includă:

- **Nume complet** (din `profiles.full_name` — același nume verificat în KYC)
- **IBAN** (din `withdrawal_requests.iban`)
- **Telefon** (din `profiles.phone`)

### Exemplu notificare (RO)
```
Ion Popescu solicită 250 RON
IBAN: RO49AAAA1B31007593840000
Telefon: +40712345678
```

### Detalii tehnice

- Migrare SQL care înlocuiește (`CREATE OR REPLACE`) funcția `public.notify_admin_withdrawal_requested()`.
- Link-ul notificării se actualizează la `/admin/withdrawals` (pagina dedicată de retrageri creată recent), în loc de `/admin/finances`.
- Versiunile RO și EN ale descrierii sunt ambele actualizate.
- Nu se modifică schema tabelelor și nici alte triggere.

### Notă

Aceasta afectează doar **notificările noi** create după aplicarea migrării. Notificările existente rămân neschimbate.
