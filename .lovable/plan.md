

## Plan: Redesign desktop chat suport stil Cyberfolks

### Obiectiv
Pe desktop, chatul de suport să arate ca un chat messenger modern (similar Cyberfolks): header cu avatar și status online, bubble-uri de mesaj cu fundal galben pentru user, input curat jos cu iconițe attach/emoji, totul într-un card rotunjit.

### Modificări în `src/components/support/SupportChatWidget.tsx`

#### 1. Header redesign (desktop)
- Înlocuiesc `MessageSquare` icon cu un avatar rotund (inițialele "R" pentru Rentli sau un logo mic)
- Adaug un indicator verde de "online" (dot verde lângă avatar)
- Numele: "Rentli Support" cu status "Online" dedesubt
- Buton X mutat în dreapta-sus, mai vizibil
- Background header: alb/light, nu primary color — mai curat, cu border-bottom subtil

#### 2. Zona de mesaje
- Bubble-urile user: fundal galben/amber (`bg-amber-400 text-foreground`) cu colțuri rotunjite — similar screenshot-ului
- Bubble-urile bot/admin: fundal alb/gri deschis, aliniate stânga
- Separator "Astăzi" / dată — text centrat cu linie subtilă

#### 3. Input area redesign
- Input cu border rotunjit, placeholder "Scrie mesajul tău"
- Butonul de attach (clip/ImagePlus) și un emoji icon în dreapta input-ului (inside)
- Butonul Send ascuns (se trimite cu Enter) sau ca icon discret
- Text mic sub input: "Chat Rentli" ca branding subtil

#### 4. Desktop container
- Lățime mărită la `400px`, height `min(600px, calc(100vh-100px))`
- Rounded corners `2xl`, shadow mai pronunțat
- Pe mobil rămâne full-screen ca acum

### Fișiere modificate
- **`src/components/support/SupportChatWidget.tsx`** — redesign complet al UI-ului pe desktop

