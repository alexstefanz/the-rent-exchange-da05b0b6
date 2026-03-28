

## Plan: Auto-resize și compresie imagini la upload

### Problema
Utilizatorii primesc eroare când încearcă să urce poze mai mari de 5MB. În loc să fie respinse, imaginile ar trebui comprimate automat.

### Soluție
Adaug o funcție `compressImage()` în `ImageUpload.tsx` care folosește Canvas API (browser-native, fără dependențe externe) pentru a redimensiona și comprima imaginile înainte de upload.

### Specificații
- **Rezoluție maximă**: 1920px (latura cea mai mare) — suficient pentru afișare web
- **Format output**: JPEG la calitate 0.8 (compromis bun între calitate și dimensiune)
- **Comportament**: Orice imagine mai mare de 1MB este comprimată automat; cele sub 1MB rămân neschimbate
- **Eliminare limită 5MB**: Nu mai afișăm eroare, ci comprimăm în mod transparent

### Fișiere modificate
- `src/components/products/ImageUpload.tsx` — adaug funcția `compressImage()` și o apelez înainte de upload, eliminând validarea de 5MB

