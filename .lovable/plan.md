## Fix buton de close pe notificarea toast

### Cauza

In `src/lib/notify.tsx`, butonul X are doar `onClick` cu `e.stopPropagation()`. Sonner ataseaza pe wrapperul toastului handler-e de **pointer events** (pentru swipe-to-dismiss) si pentru click pe intregul toast. Cand utilizatorul apasa pe X:

1. `pointerdown` ajunge la wrapperul sonner inainte de click-ul React, care porneste tracking-ul de swipe / focus pe toast.
2. In plus, cand notificarea are `link`, intregul div parinte are `onClick={handleClick}` cu `cursor-pointer`. React synthetic `stopPropagation` impiedica navigarea, dar in unele situatii (ex: cand sonner re-randeaza intre `pointerdown` si `click`), butonul X pierde click-ul.

Rezultatul vizibil: utilizatorul apasa pe X, dar toastul nu se inchide (sau, daca toastul are link, navigheaza in loc sa inchida).

### Modificari (un singur fisier)

`src/lib/notify.tsx` — in `NotificationToast`, pe butonul de close:

1. Adaug `onPointerDown={(e) => e.stopPropagation()}` ca sa nu mai porneasca gestul de swipe al sonner.
2. Adaug `onMouseDown={(e) => e.stopPropagation()}` pentru consistenta.
3. Pastrez `onClick` cu `e.stopPropagation()` + `toast.dismiss(id)`, dar adaug si `e.preventDefault()` ca masura suplimentara.
4. Cresc usor zona clickabila a butonului: `h-7 w-7` in loc de `h-6 w-6`, mut la `top-1.5 right-1.5`, si adaug `z-10` pentru a fi sigur ca e deasupra div-ului parinte cu `onClick`.

### Verificare

- Click pe X intr-o notificare fara link → toastul dispare.
- Click pe X intr-o notificare cu link → toastul dispare, **fara** navigare.
- Click pe corpul notificarii cu link → navigheaza normal.