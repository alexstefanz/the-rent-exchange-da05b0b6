

## Plan: Fix chat suport mobil + adăugare upload imagini

### Probleme identificate

1. **Pe mobil**, input-ul și butonul de trimitere nu sunt vizibile — chatul ocupă tot ecranul dar zona de input este ascunsă sub bara de navigare de jos (`MobileBottomNav`)
2. **Butonul X** de închidere există dar e posibil să fie acoperit sau greu de accesat
3. **Lipsă funcționalitate**: nu se pot trimite imagini în chat

### Soluție

#### 1. Fix layout mobil (SupportChatWidget.tsx)
- Adaug `z-[60]` pe container (mai mare decât `MobileBottomNav` care e `z-50`) pentru a fi deasupra navigării
- Setez explicit `height: 100dvh` pe mobil pentru a folosi viewport-ul dinamic (evită problemele cu bara de adrese pe mobil)
- Mă asigur că input-ul are `pb-safe` sau padding suficient pentru a nu fi acoperit

#### 2. Adăugare upload imagini
- Adaug un buton cu icon `ImagePlus` lângă input-ul de text (atât în faza AI cât și în faza ticket)
- La click, deschid un `<input type="file" accept="image/*">` ascuns
- Imaginea selectată este comprimată (reutilizez logica de `compressImage` din `ImageUpload.tsx`) și uploadată în bucket-ul `product-images` (sau un bucket dedicat `support-attachments`)
- URL-ul imaginii este trimis ca mesaj (în faza AI ca text descriptiv, în faza ticket ca mesaj cu URL)
- Imagini primite sunt afișate inline în chat cu `<img>` tag

### Fișiere modificate
- **`src/components/support/SupportChatWidget.tsx`** — fix layout mobil, adăugare buton upload imagine, afișare imagini inline în mesaje
- **Migrare SQL** — creez bucket `support-attachments` cu RLS policy pentru utilizatori autentificați

