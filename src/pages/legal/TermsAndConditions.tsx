import { Link } from "react-router-dom";
import LegalPageLayout from "./LegalPageLayout";

export const sections = [
  {
    id: "definitii",
    title: "Definiții",
    content: (
      <div className="space-y-3">
        <p><strong>„Platforma"</strong> — reprezintă site-ul web operat de Rentli, prin care utilizatorii pot publica, căuta și închiria diverse bunuri. Include toate funcționalitățile disponibile: listare de produse, gestionarea conturilor, procesarea plăților și comunicarea între utilizatori.</p>
        <p><strong>„Anunț"</strong> — procesul prin care un proprietar înregistrează un bun pe platformă, furnizând detalii precum descrierea, fotografii, tariful de închiriere și disponibilitatea.</p>
        <p><strong>„Bun" / „Obiect"</strong> — orice produs sau echipament care poate fi listat și închiriat prin intermediul platformei (de exemplu: echipamente sportive, electronice, unelte, vehicule recreaționale etc.).</p>
        <p><strong>„Proprietar"</strong> — persoana fizică sau juridică care deține un bun și îl pune la dispoziție pentru închiriere prin Rentli. Este responsabilă pentru corectitudinea informațiilor furnizate și pentru respectarea obligațiilor contractuale.</p>
        <p><strong>„Chiriaș"</strong> — persoana fizică sau juridică care utilizează platforma pentru a identifica, rezerva și închiria un bun de la un proprietar.</p>
        <p><strong>„Serviciul"</strong> — totalitatea funcționalităților oferite de Rentli, incluzând listarea de bunuri, procesarea rezervărilor și plăților, precum și intermedierea relației dintre proprietari și chiriași.</p>
        <p><strong>„Utilizatori"</strong> — toate persoanele care accesează platforma, fie că sunt proprietari, chiriași sau simpli vizitatori.</p>
        <p><strong>„Contractul"</strong> — acordul încheiat între Rentli și un utilizator prin acceptarea prezentelor condiții. Intră în vigoare la momentul creării contului.</p>
        <p><strong>„Contract de Închiriere"</strong> — acordul stabilit între un proprietar și un chiriaș pentru închirierea unui bun, generat electronic prin platformă.</p>
      </div>
    ),
  },
  {
    id: "servicii",
    title: "Serviciile platformei și utilizarea lor",
    content: (
      <div className="space-y-3">
        <p>Rentli oferă un spațiu digital unde proprietarii pot publica anunțuri pentru bunurile pe care doresc să le închirieze, iar chiriașii pot căuta, compara și rezerva aceste bunuri. Platforma facilitează comunicarea, gestionarea rezervărilor și procesarea plăților.</p>
        <p>Proprietarii sunt responsabili pentru acuratețea și actualizarea informațiilor despre bunurile listate. Aceștia trebuie să respecte legislația aplicabilă și să se asigure că bunurile sunt în stare corespunzătoare, conform descrierilor publicate.</p>
        <p>Chiriașii sunt obligați să respecte condițiile de utilizare stabilite, să achite tariful de închiriere conform termenilor conveniți și să utilizeze bunul în mod adecvat.</p>
        <p>Rentli nu este parte a contractului de închiriere dintre proprietar și chiriaș. Platforma acționează exclusiv ca intermediar și nu poate fi trasă la răspundere pentru nerespectarea obligațiilor contractuale dintre aceste părți.</p>
        <p>Utilizatorii au obligația de a respecta procedurile stabilite pe platformă, inclusiv cele referitoare la listarea bunurilor, efectuarea rezervărilor, plăți și restituirea bunurilor.</p>
      </div>
    ),
  },
  {
    id: "contract",
    title: "Acordul cu Rentli",
    content: (
      <div className="space-y-3">
        <p><strong>Încheierea acordului:</strong> Prin înregistrarea pe platformă și acceptarea prezentelor condiții, utilizatorul încheie un acord cu Rentli. Acordul se formează electronic și intră în vigoare la crearea contului.</p>
        <p><strong>Scopul acordului:</strong> Furnizarea serviciilor platformei, inclusiv intermedierea între proprietari și chiriași, gestionarea rezervărilor și a plăților, precum și asistență tehnică.</p>
        <p><strong>Valabilitate:</strong> Acordul este valabil pe perioadă nedeterminată, de la data înregistrării și până la încetarea acestuia de către oricare dintre părți.</p>
        <p><strong>Denunțarea acordului:</strong> Oricare parte poate denunța acordul cu o notificare prealabilă de 15 zile calendaristice, transmisă prin e-mail.</p>
        <p><strong>Închiderea contului:</strong> Utilizatorii pot închide contul lor în orice moment. Închiderea contului nu îi scutește de obligațiile neîndeplinite (plăți restante, acoperirea daunelor etc.).</p>
        <p><strong>Suspendarea de către Rentli:</strong> Rentli își rezervă dreptul de a suspenda sau închide un cont, fără notificare, în cazul încălcării condițiilor de utilizare, activităților frauduloase sau plângerilor justificate din partea altor utilizatori.</p>
      </div>
    ),
  },
  {
    id: "plati",
    title: "Plăți și comisioane",
    content: (
      <div className="space-y-3">
        <p><strong>Comisionul platformei:</strong> Rentli percepe un comision de la proprietari și chiriași, care este afișat clar în momentul confirmării plății. Comisionul include TVA conform legislației în vigoare.</p>
        <p><strong>Debitare automată:</strong> Chiriașii sunt de acord ca platforma să efectueze debitări automate de pe metoda de plată asociată, pentru acoperirea costurilor de închiriere, penalităților sau altor taxe aferente.</p>
        <p><strong>Costuri suplimentare:</strong> În situații precum întârzieri la returnarea bunului sau deteriorări, pot fi aplicate costuri adiționale, comunicate în prealabil utilizatorului.</p>
        <p><strong>Rambursări:</strong> Rambursările sunt guvernate de <Link to="/politica-anulare" className="text-primary hover:underline">politica de anulare</Link>.</p>
      </div>
    ),
  },
  {
    id: "inchiriere",
    title: "Procesul de închiriere",
    content: (
      <div className="space-y-3">
        <p><strong>Selectarea bunului:</strong> Chiriașii pot alege un bun din ofertele disponibile pe platformă, în funcție de nevoile și preferințele lor.</p>
        <p><strong>Anularea rezervării:</strong> Anularea gratuită este posibilă cu cel puțin 48 de ore înainte de începerea perioadei de închiriere. Pentru detalii complete, consultați <Link to="/politica-anulare" className="text-primary hover:underline">politica de anulare</Link>.</p>
        <p><strong>Activități interzise:</strong> Chiriașul nu are voie să utilizeze bunul pentru activități ilegale, sportive extreme sau orice altă întrebuințare care depășește scopul declarat al închirierii.</p>
        <p><strong>Restituirea bunului:</strong> Chiriașul este obligat să returneze bunul în aceeași stare în care l-a primit, la data și ora stabilite. Întârzierile sau deteriorările atrag aplicarea de penalități.</p>
        <p><strong>Deteriorarea sau pierderea bunului:</strong> În cazul deteriorării sau pierderii bunului, chiriașul este responsabil pentru costurile de reparare sau înlocuire. Proprietarul trebuie să notifice platforma și să furnizeze dovezi.</p>
        <p><strong>Forță majoră:</strong> În situații de forță majoră (dezastre naturale, pandemii, restricții impuse de autorități), platforma nu răspunde pentru neîndeplinirea obligațiilor. Utilizatorii pot solicita rambursări conform politicii de anulare.</p>
      </div>
    ),
  },
  {
    id: "documentare",
    title: "Documentarea stării bunului",
    content: (
      <div className="space-y-3">
        <p>Platforma oferă utilizatorilor posibilitatea de a documenta starea bunului prin încărcarea de fotografii, atât la momentul preluării, cât și la restituire.</p>
        <p>Este responsabilitatea exclusivă a fiecărui utilizator să încarce imagini relevante. Platforma nu răspunde pentru lipsa documentației fotografice sau pentru consecințele generate de absența acesteia.</p>
        <p>Imaginile încărcate pot servi ca dovezi în cazul disputelor referitoare la starea bunului. Fiecare utilizator poate vizualiza doar propriile încărcări.</p>
        <p>Se pot încărca maximum 5 imagini per eveniment (preluare sau restituire). Imaginile trebuie să reflecte starea reală a bunului și nu pot fi modificate ulterior.</p>
        <p>Recomandăm insistent documentarea fotografică la fiecare preluare și restituire. Absența dovezilor poate afecta soluționarea echitabilă a eventualelor dispute.</p>
      </div>
    ),
  },
  {
    id: "drepturi-obligatii",
    title: "Drepturile și obligațiile utilizatorilor",
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-foreground mb-2">Obligații generale</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Respectarea procedurilor platformei privind listarea bunurilor, rezervările și plățile</li>
            <li>Furnizarea de informații corecte și actualizate în contul de utilizator</li>
            <li>Notificarea imediată a oricăror modificări ale datelor personale</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-2">Obligații ale chiriașilor</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Interzicerea accesului terților la bunul închiriat fără acordul proprietarului</li>
            <li>Respectarea legislației aplicabile pe durata utilizării bunului</li>
            <li>Informarea imediată a proprietarului și a autorităților în caz de accident sau deteriorare</li>
            <li>Returnarea bunului în starea în care a fost primit</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-2">Obligații ale proprietarilor</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Furnizarea de informații complete și corecte despre bunurile listate</li>
            <li>Respectarea rezervărilor confirmate și asigurarea disponibilității bunului</li>
            <li>Responsabilitatea fiscală pentru veniturile obținute din închirieri</li>
            <li>Garanția că bunul respectă standardele de siguranță aplicabile</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-2">Sancțiuni</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Penalități financiare pentru întârzieri la returnarea bunului</li>
            <li>Acoperirea costurilor de reparație sau înlocuire în cazul deteriorării</li>
            <li>Suspendarea sau închiderea contului pentru încălcări repetate</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "protectia-datelor",
    title: "Protecția datelor personale",
    content: (
      <div className="space-y-3">
        <p>Rentli prelucrează datele personale ale utilizatorilor conform <Link to="/politica-confidentialitate" className="text-primary hover:underline">Politicii de Confidențialitate</Link>.</p>
        <p>Utilizatorii au dreptul de a accesa, rectifica sau solicita ștergerea datelor lor personale, în conformitate cu legislația aplicabilă privind protecția datelor (GDPR).</p>
      </div>
    ),
  },
  {
    id: "limitarea-raspunderii",
    title: "Limitarea răspunderii",
    content: (
      <div className="space-y-3">
        <p>Rentli nu răspunde pentru daunele cauzate de utilizatori sau pentru problemele tehnice apărute în timpul utilizării platformei. Platforma acționează exclusiv ca intermediar.</p>
        <p>Platforma nu poate fi trasă la răspundere pentru daune indirecte (pierderi de profit, întreruperea activității) rezultate din utilizarea sau neutilizarea serviciilor.</p>
        <p>Rentli nu verifică autenticitatea informațiilor furnizate de utilizatori și nu răspunde pentru conținutul listat de proprietari (descrieri, fotografii etc.).</p>
        <p>În cazul deteriorării sau pierderii unui bun în perioada închirierii, chiriașul suportă integral costurile. Proprietarul trebuie să furnizeze dovezi.</p>
        <p>Platforma nu răspunde pentru incidente, accidente sau încălcări legale survenite în timpul utilizării bunurilor. Utilizatorii sunt singurii responsabili.</p>
        <p>Rentli nu răspunde pentru evaluările și feedback-ul postat de utilizatori, acestea reprezentând opiniile lor personale.</p>
        <p>Colaborăm cu furnizori terți de încredere, însă nu putem fi trași la răspundere pentru eventualele probleme cauzate de aceștia.</p>
      </div>
    ),
  },
  {
    id: "litigii",
    title: "Litigii și legislația aplicabilă",
    content: (
      <div className="space-y-3">
        <p><strong>Soluționare amiabilă:</strong> În cazul disputelor, părțile se angajează să încerce rezolvarea pe cale amiabilă în termen de 30 de zile de la notificarea problemei.</p>
        <p><strong>Jurisdicție:</strong> Prezentele condiții sunt guvernate de legislația din România. Disputele nesoluționate amiabil vor fi supuse instanțelor competente din România.</p>
        <p><strong>Comunicări:</strong> Orice notificări referitoare la litigii trebuie transmise în scris, la adresa de e-mail asociată contului sau la adresa de contact a platformei.</p>
      </div>
    ),
  },
  {
    id: "forta-majora",
    title: "Forța majoră",
    content: (
      <div className="space-y-3">
        <p>Forța majoră include evenimente independente de voința părților: dezastre naturale, restricții impuse de autorități, pandemii sau alte situații excepționale care împiedică funcționarea normală a platformei.</p>
        <p>În astfel de situații, Rentli nu va fi responsabilă pentru întârzieri sau neîndeplinirea obligațiilor. Utilizatorii pot solicita rambursări conform <Link to="/politica-anulare" className="text-primary hover:underline">politicii de anulare</Link>.</p>
        <p>Pentru a beneficia de soluții în caz de forță majoră, utilizatorii trebuie să furnizeze documente justificative în termen de 24 de ore de la producerea evenimentului.</p>
      </div>
    ),
  },
  {
    id: "modificari",
    title: "Modificări și dispoziții finale",
    content: (
      <div className="space-y-3">
        <p>Rentli își rezervă dreptul de a actualiza prezentele condiții în orice moment. Utilizatorii vor fi notificați cu privire la modificările semnificative, iar continuarea utilizării platformei constituie acceptarea noilor termeni.</p>
        <p>Dacă orice prevedere este considerată nevalidă, celelalte prevederi rămân în vigoare.</p>
        <p>Pentru întrebări sau nelămuriri, vă rugăm să ne contactați prin <Link to="/centru-asistenta" className="text-primary hover:underline">pagina de suport</Link>.</p>
      </div>
    ),
  },
];

const TermsAndConditions = () => (
  <LegalPageLayout
    title="Termeni și Condiții"
    subtitle="Aceste condiții reglementează utilizarea platformei Rentli și relația dintre platformă, proprietari și chiriași. Prin utilizarea platformei, sunteți de acord cu acești termeni."
    lastUpdated="28.02.2026"
    sections={sections}
  />
);

export default TermsAndConditions;
