## Fix: Click pe imagini/video în tabul Media deschide lightbox-ul

În `src/components/messaging/InfoPanel.tsx`, thumbnail-urile din tabul Media sunt simple `<div>` fără handler. Le facem clickable și deschidem același `MediaLightbox` folosit deja la click-ul pe atașamentele din mesaje.

### Modificări într-un singur fișier: `src/components/messaging/InfoPanel.tsx`

1. Import `MediaLightbox` și `useState`.
2. State nou: `const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 })`.
3. Combin imaginile și video-urile într-un singur array `media = [...images, ...videos]` (în această ordine) ca să poată fi navigate împreună în lightbox cu săgeți.
4. Înlocuiesc `<div>` wrapper-ul fiecărui thumbnail (imagine și video) cu `<button type="button" onClick={() => setLightbox({ open: true, index: mediaIndex })}>` păstrând clasele actuale + `hover:opacity-90 transition cursor-zoom-in`.
5. La sfârșitul componentei, randez `<MediaLightbox attachments={media} startIndex={lightbox.index} open={lightbox.open} onClose={() => setLightbox(s => ({ ...s, open: false }))} />`.

Nu se modifică `MediaLightbox.tsx` (deja gestionează ambele tipuri image/video și signed URLs prin `getSignedChatMedia`).

### Verificare
- Click pe miniatură imagine în tab Media → se deschide lightbox la imaginea corectă, săgeți funcționale.
- Click pe miniatură video → deschide lightbox cu video player.
- Esc / X / săgeți tastatură funcționează (din comportamentul existent al lightbox-ului).