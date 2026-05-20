# Eliminare completă WhatsApp

Scop: înlăturăm orice urmă de WhatsApp din platformă. În contextul închirierilor rămân doar **email** și **telefon** ca metode de contact.

## Modificări UI

- **`src/components/messaging/ContactInfoCard.tsx`** — elimin prop-ul `whatsapp`, butonul WhatsApp și handler-ul `handleWhatsApp`. Rămân doar telefon + email.
- **`src/components/messaging/InfoPanel.tsx`** — elimin câmpul `whatsapp` din state, din interogare și butonul "WhatsApp: …" din panou.
- **`src/pages/RentalDetailPage.tsx`** — elimin butonul "Trimite mesaj pe WhatsApp" din secțiunea de contact a închirierii (rămân Sună + Email + Chat intern).
- **`src/components/profile/AccountTab.tsx`** — scot câmpul WhatsApp din schema Zod, defaults, reset, submit și UI (Field cu icoană MessageCircle).
- **`src/components/profile/ProfileTab.tsx`** — la fel: schema, defaults, UI Label/Input.
- **`src/pages/admin/AdminUserDetail.tsx`** — scot rândul de afișare `userDetail.whatsapp`.
- **`src/components/product/ShareDialog.tsx`** — elimin canalul WhatsApp (`wa.me`) din lista de share. Rămân Facebook, Telegram, Email + Copy link.

## Modificări tipuri / API

- **`src/features/profile/profileApi.ts`** — scot `whatsapp` din `ProfileData` și din semnătura funcției de update.

## Migrare DB

- `ALTER TABLE public.profiles DROP COLUMN IF EXISTS whatsapp;`
  (coloana este folosită doar pentru afișarea contactului; nu există FK / index dedicat în afară de definiția coloanei.)

## Neschimbat

- `supabase/functions/generate-product-description/index.ts` — păstrăm mențiunea "WhatsApp" din prompt: ea **interzice** AI-ului să sugereze WhatsApp în descrieri, deci susține eliminarea, nu o contrazice.
- Vechile migrări istorice care au creat coloana rămân ca atare (nu rescriem istoric).

## Verificare

- `rg -i "whatsapp|wa\.me"` trebuie să returneze doar fișierul edge function de mai sus (+ migrările istorice).
- Build TypeScript pasează după regenerarea `types.ts` post-migrare.
