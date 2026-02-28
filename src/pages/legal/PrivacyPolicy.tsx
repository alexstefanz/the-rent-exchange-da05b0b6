import { Link } from "react-router-dom";
import LegalPageLayout from "./LegalPageLayout";

const sections = [
  {
    id: "informatii-colectate",
    title: "Ce informații colectăm",
    content: (
      <div className="space-y-3">
        <p>Colectăm și procesăm următoarele categorii de date personale:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Date de identificare:</strong> numele, adresa de e-mail, numărul de telefon și alte informații necesare pentru a vă identifica și a vă permite accesul la servicii.</li>
          <li><strong>Documente oficiale:</strong> pentru verificarea identității, putem solicita fotografii ale unui document de identitate (buletin, pașaport sau permis de conducere).</li>
          <li><strong>Informații despre bunurile închiriate:</strong> descrierea, starea tehnică, fotografii și alte detalii relevante ale bunurilor publicate pe platformă.</li>
          <li><strong>Date de plată:</strong> informații despre metoda de plată aleasă, necesare procesării tranzacțiilor. Păstrăm și un istoric al plăților pentru gestionarea rambursărilor.</li>
          <li><strong>Date tehnice:</strong> adresa IP, tipul dispozitivului, informații despre browser, sistemul de operare și activitatea pe platformă (pagini accesate, durată).</li>
          <li><strong>Alte date:</strong> informații furnizate voluntar, cum ar fi preferințele sau feedback-ul oferit.</li>
        </ul>
        <p className="text-sm">Platforma noastră nu este destinată minorilor sub 16 ani. Dacă identificăm date colectate de la un minor fără consimțământul părintelui, le vom șterge imediat.</p>
      </div>
    ),
  },
  {
    id: "cum-colectam",
    title: "Cum colectăm informațiile",
    content: (
      <div className="space-y-3">
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Direct de la dumneavoastră:</strong> prin completarea formularelor de înregistrare, rezervare sau contact, precum și prin încărcarea documentelor solicitate.</li>
          <li><strong>Automat:</strong> prin tehnologii precum cookie-uri și jurnale de server, care ne ajută să îmbunătățim experiența pe platformă.</li>
          <li><strong>De la terți:</strong> ocazional, primim informații de la parteneri (servicii de verificare a identității, procesatori de plăți) sau de la autorități, conform legii.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "utilizare",
    title: "Cum utilizăm informațiile",
    content: (
      <div className="space-y-3">
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Furnizarea serviciilor:</strong> procesarea închirierilor, verificarea identității, gestionarea plăților.</li>
          <li><strong>Îmbunătățirea platformei:</strong> analiza modului de utilizare pentru optimizarea funcționalităților și personalizarea experienței.</li>
          <li><strong>Comunicări și marketing:</strong> cu acordul dumneavoastră, vă putem trimite oferte personalizate și notificări despre actualizări ale platformei.</li>
          <li><strong>Conformitate legală:</strong> prelucrăm datele pentru respectarea obligațiilor legale (arhivare documente, raportări către autorități).</li>
        </ul>
      </div>
    ),
  },
  {
    id: "temeiuri-legale",
    title: "Temeiurile legale ale prelucrării",
    content: (
      <div className="space-y-3">
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Executarea contractului:</strong> prelucrarea necesară pentru furnizarea serviciilor solicitate.</li>
          <li><strong>Consimțământ:</strong> pentru activități de marketing sau scopuri secundare, solicităm acordul dumneavoastră explicit.</li>
          <li><strong>Obligații legale:</strong> verificarea identității, raportarea către autorități.</li>
          <li><strong>Interese legitime:</strong> îmbunătățirea serviciilor, prevenirea fraudei, asigurarea securității platformei.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "partajare",
    title: "Partajarea informațiilor",
    content: (
      <div className="space-y-3">
        <p>Nu comercializăm datele dumneavoastră personale. Informațiile sunt partajate doar în situații limitate:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Furnizori de servicii:</strong> procesatori de plăți, servicii IT (hosting, mentenanță) — obligați contractual să prelucreze datele în siguranță.</li>
          <li><strong>Autorități competente:</strong> când legislația o impune (investigații, ordine judecătorești).</li>
        </ul>
      </div>
    ),
  },
  {
    id: "securitate",
    title: "Securitatea și stocarea datelor",
    content: (
      <div className="space-y-3">
        <p>Implementăm măsuri tehnice și organizatorice pentru protejarea informațiilor personale:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Criptarea datelor sensibile pentru prevenirea accesului neautorizat</li>
          <li>Acces restricționat — doar personalul autorizat poate accesa datele</li>
          <li>Audituri regulate de securitate</li>
        </ul>
        <p>Păstrăm datele doar pe durata necesară îndeplinirii scopurilor descrise, cu excepția cazurilor în care legea impune o perioadă mai lungă. După aceea, datele sunt șterse sau anonimizate.</p>
      </div>
    ),
  },
  {
    id: "drepturi-gdpr",
    title: "Drepturile dumneavoastră (GDPR)",
    content: (
      <div className="space-y-3">
        <p>Conform Regulamentului General privind Protecția Datelor, beneficiați de:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Dreptul de acces</strong> — puteți solicita o copie a datelor personale</li>
          <li><strong>Dreptul la rectificare</strong> — puteți cere corectarea informațiilor inexacte</li>
          <li><strong>Dreptul la ștergere</strong> — puteți solicita eliminarea datelor (în anumite condiții)</li>
          <li><strong>Dreptul la portabilitate</strong> — puteți primi datele într-un format structurat</li>
          <li><strong>Dreptul de opoziție</strong> — puteți refuza prelucrarea în scopuri de marketing</li>
        </ul>
        <p>Pentru exercitarea acestor drepturi, contactați-ne prin <Link to="/centru-asistenta" className="text-primary hover:underline">pagina de suport</Link>. Răspundem în maximum 30 de zile.</p>
        <p className="text-sm">Dacă considerați că prelucrarea datelor încalcă GDPR, puteți depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP).</p>
      </div>
    ),
  },
  {
    id: "bresa-securitate",
    title: "Notificări în caz de breșă de securitate",
    content: (
      <p>În eventualitatea unei breșe de securitate care afectează datele dumneavoastră, vă vom informa prin e-mail în termen de 72 de ore, conform cerințelor GDPR. De asemenea, vom notifica autoritățile competente (ANSPDCP).</p>
    ),
  },
  {
    id: "parteneri",
    title: "Parteneri",
    content: (
      <p>Partenerii noștri (proprietarii de bunuri) sunt responsabili pentru confidențialitatea datelor primite prin platformă. Vă recomandăm să consultați politicile de confidențialitate ale partenerilor pentru a înțelege modul în care prelucrează datele.</p>
    ),
  },
  {
    id: "modificari",
    title: "Actualizări ale politicii",
    content: (
      <div className="space-y-3">
        <p>Ne rezervăm dreptul de a actualiza această politică. Modificările vor fi comunicate prin platformă sau prin e-mail. Recomandăm verificarea periodică a acestei pagini.</p>
        <p>Pentru întrebări legate de confidențialitate, contactați-ne prin <Link to="/centru-asistenta" className="text-primary hover:underline">pagina de suport</Link>.</p>
      </div>
    ),
  },
];

const PrivacyPolicy = () => (
  <LegalPageLayout
    title="Politica de Confidențialitate"
    subtitle="Această politică explică modul în care Rentli colectează, utilizează, stochează și protejează datele dumneavoastră personale atunci când folosiți platforma noastră de închirieri."
    lastUpdated="28.02.2026"
    sections={sections}
  />
);

export default PrivacyPolicy;
