import { Link } from "react-router-dom";
import LegalPageLayout from "./LegalPageLayout";
import { useLanguage } from "@/contexts/LanguageContext";

const sectionsRo = [
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

const sectionsEn = [
  {
    id: "informatii-colectate",
    title: "What information we collect",
    content: (
      <div className="space-y-3">
        <p>We collect and process the following categories of personal data:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Identification data:</strong> name, email address, phone number and other information needed to identify you and grant access to the services.</li>
          <li><strong>Official documents:</strong> for identity verification, we may request photos of an identity document (ID card, passport or driving license).</li>
          <li><strong>Information about rented items:</strong> description, technical condition, photos and other relevant details of items listed on the platform.</li>
          <li><strong>Payment data:</strong> information about your chosen payment method, required for processing transactions. We also keep a payment history for managing refunds.</li>
          <li><strong>Technical data:</strong> IP address, device type, browser information, operating system and platform activity (pages visited, duration).</li>
          <li><strong>Other data:</strong> information voluntarily provided, such as preferences or feedback.</li>
        </ul>
        <p className="text-sm">Our platform is not intended for minors under 16. If we identify data collected from a minor without parental consent, we will delete it immediately.</p>
      </div>
    ),
  },
  {
    id: "cum-colectam",
    title: "How we collect information",
    content: (
      <div className="space-y-3">
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Directly from you:</strong> through registration, booking or contact forms, and by uploading the requested documents.</li>
          <li><strong>Automatically:</strong> through technologies such as cookies and server logs, which help us improve the platform experience.</li>
          <li><strong>From third parties:</strong> occasionally, we receive information from partners (identity verification services, payment processors) or from authorities, as required by law.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "utilizare",
    title: "How we use the information",
    content: (
      <div className="space-y-3">
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Service delivery:</strong> processing rentals, identity verification, payment management.</li>
          <li><strong>Platform improvement:</strong> analyzing usage to optimize features and personalize the experience.</li>
          <li><strong>Communications and marketing:</strong> with your consent, we may send personalized offers and notifications about platform updates.</li>
          <li><strong>Legal compliance:</strong> we process data to comply with legal obligations (document archiving, reporting to authorities).</li>
        </ul>
      </div>
    ),
  },
  {
    id: "temeiuri-legale",
    title: "Legal bases for processing",
    content: (
      <div className="space-y-3">
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Contract performance:</strong> processing required to provide the requested services.</li>
          <li><strong>Consent:</strong> for marketing or secondary purposes, we ask for your explicit consent.</li>
          <li><strong>Legal obligations:</strong> identity verification, reporting to authorities.</li>
          <li><strong>Legitimate interests:</strong> service improvement, fraud prevention, ensuring platform security.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "partajare",
    title: "Sharing information",
    content: (
      <div className="space-y-3">
        <p>We do not sell your personal data. Information is shared only in limited situations:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Service providers:</strong> payment processors, IT services (hosting, maintenance) — contractually required to process data securely.</li>
          <li><strong>Competent authorities:</strong> when required by law (investigations, court orders).</li>
        </ul>
      </div>
    ),
  },
  {
    id: "securitate",
    title: "Security and data storage",
    content: (
      <div className="space-y-3">
        <p>We implement technical and organizational measures to protect personal information:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Encryption of sensitive data to prevent unauthorized access</li>
          <li>Restricted access — only authorized personnel can access the data</li>
          <li>Regular security audits</li>
        </ul>
        <p>We retain data only for as long as necessary to fulfill the described purposes, except where law requires a longer period. After that, data is deleted or anonymized.</p>
      </div>
    ),
  },
  {
    id: "drepturi-gdpr",
    title: "Your rights (GDPR)",
    content: (
      <div className="space-y-3">
        <p>Under the General Data Protection Regulation, you have:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Right of access</strong> — you may request a copy of your personal data</li>
          <li><strong>Right to rectification</strong> — you may request correction of inaccurate information</li>
          <li><strong>Right to erasure</strong> — you may request data deletion (under certain conditions)</li>
          <li><strong>Right to portability</strong> — you may receive the data in a structured format</li>
          <li><strong>Right to object</strong> — you may refuse processing for marketing purposes</li>
        </ul>
        <p>To exercise these rights, contact us via the <Link to="/centru-asistenta" className="text-primary hover:underline">support page</Link>. We respond within 30 days at most.</p>
        <p className="text-sm">If you believe data processing infringes the GDPR, you may file a complaint with the National Supervisory Authority for Personal Data Processing (ANSPDCP).</p>
      </div>
    ),
  },
  {
    id: "bresa-securitate",
    title: "Notifications in case of a security breach",
    content: (
      <p>In the event of a security breach affecting your data, we will inform you by email within 72 hours, in line with GDPR requirements. We will also notify the competent authorities (ANSPDCP).</p>
    ),
  },
  {
    id: "parteneri",
    title: "Partners",
    content: (
      <p>Our partners (item owners) are responsible for the confidentiality of data received through the platform. We recommend reviewing partners' privacy policies to understand how they process data.</p>
    ),
  },
  {
    id: "modificari",
    title: "Policy updates",
    content: (
      <div className="space-y-3">
        <p>We reserve the right to update this policy. Changes will be communicated through the platform or by email. We recommend checking this page periodically.</p>
        <p>For privacy-related questions, contact us via the <Link to="/centru-asistenta" className="text-primary hover:underline">support page</Link>.</p>
      </div>
    ),
  },
];

const PrivacyPolicy = () => {
  const { language } = useLanguage();
  const isEn = language === "en";
  return (
    <LegalPageLayout
      title={isEn ? "Privacy Policy" : "Politica de Confidențialitate"}
      subtitle={isEn
        ? "This policy explains how Rentli collects, uses, stores and protects your personal data when you use our rental platform."
        : "Această politică explică modul în care Rentli colectează, utilizează, stochează și protejează datele dumneavoastră personale atunci când folosiți platforma noastră de închirieri."}
      lastUpdated="28.02.2026"
      sections={isEn ? sectionsEn : sectionsRo}
    />
  );
};

export default PrivacyPolicy;
