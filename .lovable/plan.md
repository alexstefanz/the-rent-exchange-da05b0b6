## Drag & drop pentru reordonarea imaginilor în „Adaugă anunț"

### Obiectiv
La pasul 3 (Fotografii) din flow-ul de publicare, utilizatorul trebuie să poată reordona manual imaginile prin drag & drop. Prima imagine = coperta anunțului.

### Ce se schimbă

**Doar `src/components/products/ImageUpload.tsx`** (folosit și în PublishWizard, deci se aplică automat).

Adaug:
- Drag & drop nativ HTML5 (fără librării noi) pe fiecare card de imagine din grid.
- Handle vizual (icon `GripVertical` din lucide-react) în colțul din stânga sus al fiecărei imagini, vizibil la hover/touch.
- Indicator vizual la drop target: ring portocaliu (`ring-2 ring-primary`) pe poziția unde va fi inserată imaginea.
- Cursor `grab` / `grabbing` pe carduri.
- Pe mobile: long-press (300ms) pentru a iniția drag-ul, apoi swipe pentru a reordona — folosesc `onTouchStart`/`onTouchMove`/`onTouchEnd` cu detectare poziție prin `elementFromPoint`.
- Toast confirmare „Ordine actualizată" când prima poziție se schimbă (cover nou).

### Detalii tehnice

- State local nou: `draggedIndex: number | null`, `dragOverIndex: number | null`.
- Handler `handleReorder(from, to)` care apelează `onChange` cu array reordonat.
- `draggable={true}` pe fiecare item din grid; `onDragStart`, `onDragOver` (cu `preventDefault`), `onDragLeave`, `onDrop`, `onDragEnd`.
- Touch fallback: store `touchStartY/X` + timer pentru long-press; după activare, urmăresc poziția cu `document.elementFromPoint(touch.clientX, touch.clientY)` și data attribute `data-image-index` pe fiecare card.
- Badge „Principal" rămâne pe `index === 0` și se actualizează automat după reordonare.
- Butonul de delete (`X`) și badge-ul existent rămân neschimbate; opresc propagarea pe drag pentru handle.

### Ce NU se schimbă
- API-ul componentei (`images`, `onChange`) rămâne identic.
- Logica de upload, compresie și ștergere.
- Backend / DB / RLS.
- Limita `maxImages`.
