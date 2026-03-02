

## Plan: Dezactivare auto-confirm email la înregistrare

### Problema
Auto-confirm este activat, ceea ce permite utilizatorilor să se autentifice imediat după signup fără verificare email. De aceea nu ai primit niciun email de confirmare.

### Soluție
Dezactivăm auto-confirm prin tool-ul `configure-auth`. Astfel:
- La signup, utilizatorul primește un email cu cod OTP (fluxul deja implementat în cod)
- Nu se poate autentifica până nu verifică emailul
- Contul creat pe `alex@advanceonline.co.uk` va trebui recreat sau verificat manual

### Ce se modifică
- **Configurare auth**: `double_confirm_changes = false`, `enable_confirmations = true` (auto-confirm OFF)
- **Nicio modificare de cod** — fluxul OTP este deja implementat în `Auth.tsx` și `LoginDialog.tsx`

