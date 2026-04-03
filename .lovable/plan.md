

## Plan: Configurare email noreply@rentli.ro

### Situația actuală
- Domeniul `notify.rentli.ro` este configurat dar a eșuat la verificare (provisioning timed out)
- Emailurile nu se trimit deloc — nici OTP, nici notificări

### Ce trebuie făcut

**Pas 1 — Dezactivez emailurile custom și șterg domeniul eșuat**
- Dezactivez Lovable Emails pentru proiect (emailurile de autentificare vor reveni la template-urile implicite, dar vor funcționa)
- Domeniul `notify.rentli.ro` va fi eliminat din configurație

**Pas 2 — Reconfigurare cu domeniul root `rentli.ro`**
- Configurez un nou domeniu de email, de data asta direct pe `rentli.ro` (fără subdomeniu `notify`)
- Sistemul va crea automat un subdomeniu tehnic pentru trimitere (e.g. `mail.rentli.ro` sau similar), dar adresa afișată destinatarilor va fi `noreply@rentli.ro`

**Important de înțeles:** Indiferent de configurare, trimiterea emailurilor necesită delegarea DNS a unui subdomeniu către serverele Lovable (NS records). Adresa `noreply@rentli.ro` este doar ce vede destinatarul în inbox — tehnic, emailul trece printr-un subdomeniu verificat. Aceasta e o cerință universală pentru orice serviciu de email (SPF, DKIM, autentificare).

### Ce ai de făcut tu (DNS la gazduire.net)
1. Șterge NS records-urile vechi pentru `notify` (cele care pointează la `ns3.lovable.cloud` și `ns4.lovable.cloud`)
2. Când reconfigurez domeniul, vei primi instrucțiuni noi cu ce NS records trebuie adăugate — le adaugi la gazduire.net

### Rezultat final
- Emailurile (OTP, resetare parolă, notificări) vor ajunge la utilizatori
- Adresa afișată va fi `noreply@rentli.ro`
- Fluxul de signup va funcționa complet

### Detalii tehnice
- Dezactivare Lovable Emails → reactivare cu domeniu nou
- Re-scaffold auth-email-hook și send-transactional-email cu noul domeniu
- Redeploy toate Edge Functions afectate
- Testare cap-coadă a fluxului de signup cu OTP

