import { Link } from "react-router-dom";
import LegalPageLayout from "./LegalPageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageSeo } from "@/hooks/usePageSeo";

export const sectionsRo = [
  {
    id: "operator",
    title: "Operatorul de date",
    content: (
      <div className="space-y-3">
        <p>Platforma Rentli este operată de Rentli SRL, cu sediul social în România. În calitate de operator de date, colectăm și prelucrăm datele personale în conformitate cu Regulamentul (UE) 2016/679 (GDPR) și legislația română în vigoare.</p>
        <p>Pentru orice întrebare privind prelucrarea datelor, ne puteți contacta prin <Link to="/centru-asistenta" className="text-primary hover:underline">pagina de suport</Link>. Răspundem în maximum 30 de zile.</p>
      </div>
    ),
  },
  {
    id: "informatii-colectate",
    title: "Ce informații colectăm",
    content: (
      <div className="space-y-3">
        <p>Colectăm și procesăm următoarele categorii de date personale:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Date de identificare:</strong> numele, adresa de e-mail, numărul de telefon și alte informații necesare pentru a vă identifica și a vă permite accesul la servicii.</li>
          <li><strong>Informații despre bunurile închiriate:</strong> descrierea, starea tehnică, fotografii, locația aproximativă și alte detalii relevante ale bunurilor publicate pe platformă.</li>
          <li><strong>Date de plată:</strong> informații despre metoda de plată aleasă, necesare procesării tranzacțiilor. Păstrăm și un istoric al plăților pentru gestionarea rambursărilor și a disputelor.</li>
          <li><strong>Date tehnice:</strong> adresa IP, tipul dispozitivului, informații despre browser, sistemul de operare, identificatori unici de dispozitiv și activitatea pe platformă (pagini accesate, durată, interacțiuni).</li>
          <li><strong>Date de comunicare:</strong> mesajele, ticketele de suport și alte interacțiuni pe care le aveți cu noi sau cu ceilalți utilizatori prin intermediul platformei.</li>
          <li><strong>Alte date:</strong> informații furnizate voluntar, cum ar fi preferințele, recenziile sau feedback-ul oferit.</li>
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
          <li><strong>Direct de la dumneavoastră:</strong> prin completarea formularelor de înregistrare, publicare anunț, rezervare, plată sau contact, precum și prin încărcarea fotografiilor și documentelor solicitate.</li>
          <li><strong>Automat:</strong> prin tehnologii precum cookie-uri, pixeli de tracking, jurnale de server și API-uri de geolocație, care ne ajută să îmbunătățim experiența pe platformă, să asigurăm securitatea și să măsurăm performanța.</li>
          <li><strong>De la terți:</strong> ocazional, primim informații de la parteneri (procesatori de plăți, servicii de autentificare precum Google sau Apple) sau de la autorități, conform legii.</li>
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
          <li><strong>Furnizarea serviciilor:</strong> crearea și gestionarea contului, publicarea anunțurilor, procesarea închirierilor, gestionarea plăților și emiterea documentelor fiscale.</li>
          <li><strong>Verificarea identității:</strong> confirmarea identității utilizatorilor pentru siguranța tranzacțiilor și prevenirea fraudelor.</li>
          <li><strong>Îmbunătățirea platformei:</strong> analiza modului de utilizare pentru optimizarea funcționalităților, remedierea erorilor și personalizarea experienței.</li>
          <li><strong>Comunicări și marketing:</strong> cu acordul dumneavoastră explicit, vă putem trimite oferte personalizate, newslettere și notificări despre actualizări ale platformei.</li>
          <li><strong>Asistență clienți:</strong> răspunderea la întrebări, tickete de suport, gestionarea disputelor și îmbunătățirea serviciului.</li>
          <li><strong>Conformitate legală:</strong> prelucrăm datele pentru respectarea obligațiilor legale (facturare, arhivare documente, raportări către autorități).</li>
          <li><strong>Securitate și prevenirea fraudei:</strong> detectarea activităților suspecte, protejarea conturilor și a bunurilor utilizatorilor.</li>
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
          <li><strong>Executarea contractului:</strong> prelucrarea necesară pentru furnizarea serviciilor solicitate (cont, anunțuri, închirieri, plăți).</li>
          <li><strong>Consimțământ:</strong> pentru activități de marketing, cookie-uri non-esențiale sau alte scopuri secundare, solicităm acordul dumneavoastră explicit, pe care îl puteți retrage oricând.</li>
          <li><strong>Obligații legale:</strong> facturarea, arhivarea documentelor, raportarea către autorități, verificarea identității.</li>
          <li><strong>Interese legitime:</strong> îmbunătățirea serviciilor, prevenirea fraudei, asigurarea securității platformei, protejarea drepturilor noastre legale.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "partajare",
    title: "Partajarea informațiilor",
    content: (
      <div className="space-y-3">
        <p>Nu comercializăm datele dumneavoastră personale. Informațiile sunt partajate doar în situații limitate și necesare:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Cu alți utilizatori ai platformei:</strong> numai datele strict necesare pentru desfășurarea închirierii (ex. nume, număr de telefon, locație aproximativă), conform <Link to="/termeni-si-conditii" className="text-primary hover:underline">Termenilor și condițiilor</Link>.</li>
          <li><strong>Furnizori de servicii:</strong> procesatori de plăți (Stripe), servicii IT și cloud (hosting, baze de date, e-mail), servicii de analiză și suport — toți obligați contractual să prelucreze datele în siguranță și doar în scopurile convenite.</li>
          <li><strong>Autorități competente:</strong> când legislația o impune (investigații, ordine judecătorești, protejarea drepturilor noastre legale).</li>
        </ul>
      </div>
    ),
  },
  {
    id: "transferuri",
    title: "Transferuri internaționale de date",
    content: (
      <div className="space-y-3">
        <p>În general, datele sunt stocate și prelucrate în Uniunea Europeană. Unii furnizori de servicii (de exemplu, pentru hosting, e-mail, plăți sau analiză) pot avea sediul sau infrastructura în afara UE/SEE.</p>
        <p>În astfel de cazuri, ne asigurăm că transferurile sunt protejate prin garanții adecvate, cum ar fi clauze contractuale standard aprobate de Comisia Europeană sau certificări recunoscute (de exemplu, Privacy Shield / Data Privacy Framework pentru furnizorii din SUA), astfel încât datele dumneavoastră să beneficieze de un nivel de protecție echivalent cu cel din UE.</p>
      </div>
    ),
  },
  {
    id: "stocare",
    title: "Perioada de stocare",
    content: (
      <div className="space-y-3">
        <p>Păstrăm datele personale doar pe durata necesară îndeplinirii scopurilor pentru care au fost colectate, cu excepția cazurilor în care legea impune o perioadă mai lungă:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Datele contului: până la ștergerea contului sau inactivitate timp de 3 ani, după care sunt anonimizate sau șterse.</li>
          <li>Datele de plată și facturare: conform legislației fiscale (10 ani de regulă).</li>
          <li>Datele anunțurilor și închirierilor: pe durata existenței contului și după aceea, în măsura necesară soluționării disputelor sau obligațiilor legale.</li>
          <li>Datele tehnice și de navigare: până la 12 luni, în funcție de scopul analizei și securității.</li>
        </ul>
        <p>După expirarea perioadelor menționate, datele sunt șterse sau anonimizate în condiții de siguranță.</p>
      </div>
    ),
  },
  {
    id: "cookie-uri",
    title: "Cookie-uri și tehnologii de tracking",
    content: (
      <div className="space-y-3">
        <p>Folosim cookie-uri și tehnologii similare pentru funcționarea platformei, analiza traficului, personalizarea conținutului și publicitate. Detalii complete despre tipurile de cookie-uri, durata de stocare și modalitățile de gestionare a preferințelor sunt disponibile în <Link to="/politica-cookies" className="text-primary hover:underline">Politica de cookies</Link>.</p>
        <p>Cookie-urile esențiale nu pot fi dezactivate, deoarece sunt necesare pentru funcționarea de bază a site-ului. Pentru celelalte categorii, vă puteți actualiza preferințele oricând prin bannerul de cookie-uri sau prin setările browserului.</p>
      </div>
    ),
  },
  {
    id: "securitate",
    title: "Securitatea datelor",
    content: (
      <div className="space-y-3">
        <p>Implementăm măsuri tehnice și organizatorice adecvate pentru protejarea informațiilor personale împotriva accesului neautorizat, modificării, divulgării sau distrugerii:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Criptarea conexiunilor prin HTTPS și criptarea datelor sensibile la stocare</li>
          <li>Autentificare multi-factor și controale stricte de acces pentru personalul autorizat</li>
          <li>Audituri regulate de securitate, teste de vulnerabilitate și monitorizare continuă</li>
          <li>Instruirea periodică a angajaților cu privire la protecția datelor</li>
          <li>Acorduri de confidențialitate cu toți furnizorii și partenerii care prelucrează date în numele nostru</li>
        </ul>
        <p>Deși depunem toate eforturile rezonabile pentru securitatea datelor, nicio metodă de transmitere sau stocare electronică nu este 100% sigură.</p>
      </div>
    ),
  },
  {
    id: "drepturi-gdpr",
    title: "Drepturile dumneavoastră (GDPR)",
    content: (
      <div className="space-y-3">
        <p>Conform Regulamentului General privind Protecția Datelor, beneficiați de următoarele drepturi:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Dreptul de acces</strong> — puteți solicita o copie a datelor personale pe care le deținem</li>
          <li><strong>Dreptul la rectificare</strong> — puteți cere corectarea informațiilor inexacte sau incomplete</li>
          <li><strong>Dreptul la ștergere („dreptul de a fi uitat")</strong> — puteți solicita eliminarea datelor, în măsura în care nu există o obligație legală de păstrare</li>
          <li><strong>Dreptul la portabilitate</strong> — puteți primi datele într-un format structurat, utilizat frecvent și lizibil, sau puteți solicita transmiterea lor către alt operator</li>
          <li><strong>Dreptul de opoziție</strong> — puteți refuza prelucrarea în scopuri de marketing direct sau în baza intereselor legitime</li>
          <li><strong>Dreptul la restricționarea prelucrării</strong> — puteți solicita limitarea utilizării datelor în anumite situații</li>
          <li><strong>Dreptul de a vă retrage consimțământul</strong> — pentru prelucrările bazate pe consimțământ, retragerea nu afectează legalitatea prelucrării anterioare</li>
        </ul>
        <p>Pentru exercitarea acestor drepturi, contactați-ne prin <Link to="/centru-asistenta" className="text-primary hover:underline">pagina de suport</Link>. Răspundem în maximum 30 de zile. Identitatea dumneavoastră poate fi verificată înainte de a răspunde solicitării.</p>
        <p className="text-sm">Dacă considerați că prelucrarea datelor încalcă GDPR, aveți dreptul de a depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP) sau la o autoritate de supraveghere din UE.</p>
      </div>
    ),
  },
  {
    id: "profilare",
    title: "Profilare și decizii automate",
    content: (
      <p>Nu luăm decizii cu efect legal sau similar semnificativ asupra dumneavoastră exclusiv prin mijloace automate. Putem folosi analize automate pentru recomandări de produse, detectarea fraudei sau îmbunătățirea securității, dar acestea nu duc la decizii individuale fără implicare umană.</p>
    ),
  },
  {
    id: "bresa-securitate",
    title: "Notificări în caz de breșă de securitate",
    content: (
      <p>În eventualitatea unei breșe de securitate care afectează datele dumneavoastră personale, vă vom informa prin e-mail în termen de 72 de ore de la constatarea incidentului, conform cerințelor GDPR. De asemenea, vom notifica autoritățile competente (ANSPDCP) atunci când este necesar.</p>
    ),
  },
  {
    id: "parteneri",
    title: "Parteneri",
    content: (
      <p>Partenerii noștri (proprietarii de bunuri) sunt responsabili pentru confidențialitatea datelor primite prin platformă în cadrul unei închirieri. Vă recomandăm să consultați politicile de confidențialitate ale acestora pentru a înțelege modul în care prelucrează datele.</p>
    ),
  },
  {
    id: "legea-aplicabila",
    title: "Legea aplicabilă și jurisdicția",
    content: (
      <p>Prezenta politică este guvernată de legea română și de legislația Uniunii Europene aplicabilă în materie de protecție a datelor personale. Orice litigiu derivat din sau în legătură cu această politică va fi soluționat de instanțele competente din România.</p>
    ),
  },
  {
    id: "modificari",
    title: "Actualizări ale politicii",
    content: (
      <div className="space-y-3">
        <p>Ne rezervăm dreptul de a actualiza această politică pentru a reflecta modificările legislative sau operaționale. Modificările vor fi comunicate prin platformă sau prin e-mail, iar versiunea actualizată va fi disponibilă pe această pagină cu data ultimei actualizări.</p>
        <p>Pentru întrebări legate de confidențialitate, contactați-ne prin <Link to="/centru-asistenta" className="text-primary hover:underline">pagina de suport</Link>.</p>
      </div>
    ),
  },
];

export const sectionsEn = [
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
  usePageSeo({
    title: "Politica de confidențialitate — Rentli",
    description: "Cum colectăm, folosim și protejăm datele tale personale pe Rentli.",
  });
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
