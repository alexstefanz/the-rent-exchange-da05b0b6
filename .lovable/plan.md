## Problema
Când userul intră pe `/owner/new-product`, `PublishWizard` încarcă automat ultimul draft nepublicat (via `getActiveDraft`) și prepopulează formularul fără să întrebe. Userul vrea să fie întrebat explicit dacă vrea să continue draftul sau să înceapă unul nou.

## Soluție
Modific doar `src/components/publish/PublishWizard.tsx` (mode `create`):

1. **Detectare draft fără auto-restore.** În `useEffect`-ul care apelează `getActiveDraft`, în loc să setez direct `data`/`step`, salvez draftul găsit într-un state nou `pendingDraft` (conținut + step + id) și deschid un `AlertDialog`.

2. **Pop-up cu 2 opțiuni** (folosind `AlertDialog` din `@/components/ui/alert-dialog`, deja folosit în proiect):
   - Titlu: „Ai un anunț nesalvat"
   - Descriere: arată titlul draftului (sau „Anunț fără titlu") + categoria + data ultimei modificări (`updated_at`).
   - **„Continuă draftul"** → aplică `setData({ ...emptyPublishForm(), ...payload })`, `setStep(d.step)`, `setDraftId(d.id)`, închide dialogul.
   - **„Începe anunț nou"** → apelează `deleteDraft(d.id)`, resetează `draftId` la `null`, lasă formularul gol, închide dialogul. Așa următorul autosave creează un draft nou curat.
   - Dialogul nu se poate închide accidental (fără `X`/click-outside dismiss) ca să forțeze o alegere conștientă.

3. **Anti-flicker.** Blochez autosave-ul cât timp `pendingDraft` e setat (early-return în `useEffect`-ul de autosave dacă `pendingDraft !== null`), ca să nu se suprascrie draftul înainte ca userul să decidă.

4. **Edge cases.**
   - Dacă nu există draft → fără dialog, comportament identic cu cel de acum.
   - Dacă draftul e gol (fără title, category, images) → îl șterg silențios și nu arăt dialogul (evită pop-up inutil pentru drafturi „fantomă" create la click pe step).
   - În modul `edit` → nu se schimbă nimic.

## Out of scope
- Listă cu toate drafturile (rămâne unul singur per owner, ca acum).
- Schimbări UI în `PublishTopBar` sau în indicatorul „Toate modificările sunt salvate".
- Nu modific `draftsApi.ts` sau migrații DB.

## Tech notes
- Componente reutilizate: `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel` din shadcn.
- Localizare RO directă în componentă (consistent cu restul wizardului care e RO-only).
- Single file change: `src/components/publish/PublishWizard.tsx`.
