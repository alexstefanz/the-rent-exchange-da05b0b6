## Modificare secțiunea "Zonă sensibilă" → "Dezactivează contul"

În `src/components/profile/AccountTab.tsx` (zona de jos a tabului Cont):

1. **Redenumire header accordeon**: înlocuiesc titlul "Zonă sensibilă" / "Danger zone" cu "Dezactivează contul" / "Deactivate account". Elimin subtitlul "Acțiuni ireversibile asupra contului."

2. **Simplificare conținut accordeon**: în interiorul accordeonului păstrez doar butonul roșu "Dezactivează contul" (cu dialogul de confirmare existent). Elimin textul descriptiv "Dezactivează contul / Vei primi un email pentru a confirma dezactivarea" care acum era duplicat.

3. Iconița (Trash2) și stilul cardului rămân neschimbate.

Nicio altă logică sau funcționalitate nu se schimbă.