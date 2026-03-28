

## Plan: Testare individuală a fiecărei notificări prin email

Am identificat **9 tipuri de notificări** prin email trimise de 7 Edge Functions. Voi crea o pagină de test în panoul admin care permite trimiterea fiecărei notificări către `aleczanderr20@gmail.com`.

### Notificările identificate

| # | Edge Function | Tip email | Destinatar |
|---|---|---|---|
| 1 | `send-general-notification` | Welcome (bun venit) | Utilizator nou |
| 2 | `send-general-notification` | Review received (recenzie primită) | Proprietar produs |
| 3 | `send-general-notification` | Product published (produs publicat) | Proprietar produs |
| 4 | `send-rental-notification` | Cerere nouă de închiriere (owner) | Proprietar |
| 5 | `send-rental-notification` | Cerere trimisă (renter) | Chiriaș |
| 6 | `send-message-notification` | Mesaj nou primit | Destinatar mesaj |
| 7 | `send-cancellation-notification` | Cerere anulată | Owner + Renter |
| 8 | `send-password-changed-notification` | Parolă schimbată | Utilizator |
| 9 | `respond-rental-request` | Accept/Refuz cerere | Owner + Renter |
| 10 | `request-account-deactivation` | Confirmare dezactivare | Utilizator |

### Ce voi face

**1. Creez un Edge Function de test: `test-email-notifications`**
- Acceptă un parametru `type` care specifică ce notificare să trimită
- Trimite direct emailul către `aleczanderr20@gmail.com` cu date mock realiste (nu depinde de date reale din DB)
- Reutilizează exact template-urile HTML din funcțiile existente pentru a testa output-ul real
- Tipuri suportate: `welcome`, `review_received`, `product_published`, `rental_new_owner`, `rental_new_renter`, `message_new`, `cancellation_owner`, `cancellation_renter`, `password_changed`, `rental_accepted`, `rental_rejected`, `deactivation`

**2. Adaug o pagină admin `/admin/test-emails`**
- Butoane pentru fiecare tip de notificare
- La click, invocă funcția de test și afișează rezultatul (succes/eroare)
- Accesibilă doar adminilor

**3. Adaug link în sidebar-ul admin**
- Opțiune "Test Emailuri" vizibilă doar în dev/test

### Observație importantă
Toate funcțiile existente trimit prin **Resend API** de pe `noreply@rentli.ro`. Dacă domeniul `rentli.ro` nu este încă verificat în Resend, emailurile nu vor ajunge. Funcția `request-account-deactivation` trimite de pe `noreply@resend.dev` (domeniul de test Resend) — aceasta ar trebui să funcționeze.

### Fișiere
- **Creez** `supabase/functions/test-email-notifications/index.ts`
- **Creez** `src/pages/admin/AdminTestEmails.tsx`
- **Modific** `src/App.tsx` — adaug ruta `/admin/test-emails`
- **Modific** `src/components/admin/AdminSidebar.tsx` — adaug link

