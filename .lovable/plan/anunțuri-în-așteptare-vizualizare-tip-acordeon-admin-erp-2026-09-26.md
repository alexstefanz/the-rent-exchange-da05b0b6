# Anunțuri în așteptare — vizualizare tip acordeon (Admin ERP)

## Ce se schimbă
În panoul **Confirmări / Anulări** (tab-ul „Anunțuri"), lista anunțurilor în așteptare trece de la carduri mari mereu deschise la un **acordeon**:

- **Rând închis (compact):** miniatură pătrată a primei imagini, titlu, numele proprietarului, data publicării, categoria (badge), prețul/zi în portocaliu și un indicator „N imagini". Rândul ocupă ~1-2 linii, deci adminul vede mai multe anunțuri pe ecran.
- **Rând deschis:** conținutul actual al cardului (galeria de imagini cu navigare, descriere, „Ce este inclus", locație) plus butoanele **Previzualizează anunț / Aprobă / Respinge** plasate în zona de jos a secțiunii deschise.
- Mai multe rânduri pot fi deschise simultan (type="multiple"), ca să poată compara anunțuri.
- Comportamentul rămâne neschimbat: căutarea după titlu, aprobarea, respingerea cu motiv (fereastra existentă), actualizarea contorului din tab și lista se reîmprospătează după acțiuni.

## Fișier afectat
- `src/pages/admin/AdminApprovals.tsx` — singurul fișier modificat. Se refolosește componenta existentă `src/components/ui/accordion.tsx` (Radix/shadcn), fără alte dependențe noi.

## Detalii tehnice
- Se păstrează `imageIndices` per produs, mutațiile `approveMutation` / `rejectMutation` și dialogul de respingere.
- `AccordionTrigger` se personalizează (clasa `hover:underline` scoasă) pentru un rând de tip listă; chevron rotativ din componenta existentă.
- Rândul închis nu pornește acțiuni — doar expandează; butoanele rămân doar în secțiunea deschisă.
- Layout deschis: imaginea + detaliile în aceeași structură `md:grid-cols-[400px_1fr]` existentă, cu butoanele de acțiuni sub descriere/locație.

## Validare
- Build fără erori.
- Verificare vizuală cu Playwright pe pagina de admin: rânduri compacte, expand/collapse, aprobare/respins funcționale.
