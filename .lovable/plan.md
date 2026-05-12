## Context

Emailurile către `@primaconstruct.ro` ajung cu întârziere (5–60 min uneori). Sistemul nostru le trimite în 2–6 secunde (verificat în `email_send_log`), deci delay-ul e pe serverul lor de mail (greylisting / antispam corporate). Domeniul `notify.rentli.ro` este **verificat și activ**.

Îți pregătesc două lucruri, livrate ca răspuns în chat (fără modificări de cod):

## 1. Raport DNS detaliat pentru `notify.rentli.ro`

Voi rula verificări `dig` din sandbox pentru:
- **SPF** (TXT pe `notify.rentli.ro`) — verific că include serverele de trimitere
- **DKIM** — verific selectorii activi și cheile publice
- **DMARC** (TXT pe `_dmarc.rentli.ro` și `_dmarc.notify.rentli.ro`) — politica și aliniere
- **MX** pe `notify.rentli.ro`
- **NS delegation** către `ns3.lovable.cloud` / `ns4.lovable.cloud`
- **PTR (reverse DNS)** pe IP-urile de trimitere
- **MX pentru primaconstruct.ro** + ce provider folosesc (Microsoft 365, Google, on-prem etc.) — util pentru a ști exact cui se trimite cererea de whitelist

Rezultatul îl prezint ca un tabel scurt cu status (✅ / ⚠️ / ❌) și recomandări concrete dacă găsesc ceva nealiniat.

## 2. Șablon de email în română pentru IT-ul primaconstruct.ro

Un mesaj profesional, gata de trimis, care:
- Se prezintă (Rentli, marketplace de închirieri P2P)
- Explică problema observată (delay 5–60 min la livrare, fără bounce)
- Furnizează datele tehnice de care are nevoie IT-ul lor:
  - Domeniu expeditor: `notify.rentli.ro`
  - Adresă From: `noreply@rentli.ro`
  - SPF / DKIM / DMARC records (completate din raportul de la pasul 1)
  - IP-uri de trimitere (din MX/SPF lookup)
- Cere explicit: whitelist domeniu + IP-uri în filtrul antispam (Defender / Barracuda / etc.) și dezactivare greylisting pentru `rentli.ro`
- Include o variantă scurtă în engleză la final (pentru cazul în care IT-ul folosește engleză)

## Livrare

Răspund într-un singur mesaj cu:
1. Tabelul DNS + concluzii
2. Șablonul de email (RO + EN) într-un bloc copy-paste

Nicio modificare în cod sau în baza de date.
