
# Rezolvare Upload Imagini pe Pagina "Adaugă Anunț"

## Problema Identificată

Pagina `/adauga-anunt` (`ListItem.tsx`) folosește o funcție mock pentru upload-ul de imagini care nu face nimic real - doar adaugă URL-uri de test. În schimb, există deja o componentă funcțională `ImageUpload` care folosește Supabase Storage (folosită în `NewProduct.tsx`).

## Soluție

Voi înlocui funcția mock din `ListItem.tsx` cu componenta reală `ImageUpload` care permite încărcarea reală a imaginilor în Supabase Storage.

---

## Modificări Necesare

### Fișier: `src/pages/ListItem.tsx`

**1. Importuri noi:**
- Adaug `useAuth` din `@/contexts/AuthContext` pentru a obține user ID
- Adaug `ImageUpload` din `@/components/products/ImageUpload`
- Adaug `useEffect` pentru redirect la login dacă nu e autentificat
- Adaug `Loader2` pentru starea de loading

**2. Modificări în componenta ListItem:**
- Obțin utilizatorul curent cu `useAuth()`
- Adaug redirect la `/auth` dacă nu e logat (pentru că are nevoie de user ID pentru upload)
- Adaug loading state pentru autentificare

**3. Înlocuire secțiune imagini:**
- Elimin funcția `handleImageUpload` mock
- Elimin funcția `removeImage` (e gestionată de `ImageUpload`)
- Înlocuiesc secțiunea de imagini cu componenta `ImageUpload`

---

## Cod Curent vs Cod Nou

**Curent (nu funcționează):**
```tsx
const handleImageUpload = () => {
  // Mock image upload - in real app, this would handle file uploads
  const mockImages = [...];
  setImages([...images, mockImages[images.length % 2]]);
};
```

**Nou (funcțional):**
```tsx
{user && (
  <ImageUpload
    userId={user.id}
    images={images}
    onChange={setImages}
    maxImages={5}
  />
)}
```

---

## Structura Finală Secțiune Imagini

```text
┌────────────────────────────────────────────────────────────┐
│  Photos                                                     │
│  Add photos to showcase your item                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    ImageUpload                        │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐   │  │
│  │  │  Img 1  │ │  Img 2  │ │  Img 3  │ │ + Adaugă  │   │  │
│  │  │    X    │ │    X    │ │    X    │ │  imagini  │   │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └───────────┘   │  │
│  │                                                       │  │
│  │  sau zona de drop cu border dashed dacă nu sunt      │  │
│  │  imagini încărcate                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## Fișiere Modificate

| Fișier | Acțiune |
|--------|---------|
| `src/pages/ListItem.tsx` | Modificat - înlocuire mock cu ImageUpload real |

---

## Pași de Implementare

1. Adaug importuri pentru `useAuth`, `ImageUpload`, `useEffect`, `Loader2`
2. Obțin user și loading state din `useAuth()`
3. Adaug `useEffect` pentru redirect la login
4. Elimin funcțiile mock (`handleImageUpload`, `removeImage`)
5. Înlocuiesc secțiunea imagini cu componenta `ImageUpload`
6. Adaug loading spinner pentru când se verifică autentificarea

---

## Note

- Utilizatorul trebuie să fie autentificat pentru a putea încărca imagini (necesar pentru path-ul în storage)
- Se păstrează limita de 5 imagini (configurabil)
- Prima imagine încărcată devine automat imaginea principală
- Toate imaginile sunt stocate în bucket-ul `product-images` din Supabase Storage
