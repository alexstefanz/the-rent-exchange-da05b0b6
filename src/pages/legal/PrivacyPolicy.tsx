import { Link } from "react-router-dom";
import LegalPageLayout from "./LegalPageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageSeo } from "@/hooks/usePageSeo";

export const sectionsRo = [
  {
    id: "operator",
    title: "1. CINE SUNTEM NOI?",
    content: (
      <div className="space-y-3">
        <p><strong>RENTLI 1 S.R.L.</strong>, în continuare Societatea sau Noi,</p>
        <p>Datele noastre de contact sunt:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Adresa sediului:</strong> sat Valea Lupului, comuna Valea Lupului, str. Aleea cu Nuci nr. 42, județul Iași, România</li>
          <li><strong>Cod unic de înregistrare (CUI):</strong> 53914386</li>
          <li><strong>Nr. de ordine în Registrul Comerțului:</strong> J2026009653007</li>
          <li><strong>Website:</strong> <a href="https://rentli.ro" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://rentli.ro</a></li>
          <li><strong>Adresă de e-mail:</strong> office@rentli.ro, gdpr@rentli.ro</li>
          <li><strong>Nr. de tel.:</strong> de completat – număr de telefon de contact</li>
        </ul>
      </div>
    ),
  },
  {
    id: "cum-prelucram",
    title: "2. CUM PRELUCRĂM DATELE DVS. CU CARACTER PERSONAL?",
    content: (
      <div className="space-y-3">
        <p>Societatea, în calitatea sa de Operator, prelucrează datele cu caracter personal ale candidaților care aplică pentru posturile disponibile, angajaților, clienților persoane fizice, reprezentanților clienților persoane juridice, partenerilor contractuali și ai colaboratorilor, și datele altor persoane fizice care interacționează cu Societatea și/sau sunt antrenate în relații contractuale cu acesta.</p>
        <p>Datele cu caracter personal sunt:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>prelucrate în mod legal, echitabil și transparent față de persoana vizată;</li>
          <li>colectate în scopuri determinate, explicite și legitime și nu sunt prelucrate ulterior într-un mod incompatibil cu aceste scopuri;</li>
          <li>adecvate, relevante și limitate la ceea ce este necesar în raport cu scopurile în care sunt prelucrate;</li>
          <li>exacte și actualizate în termen;</li>
          <li>păstrate într-o formă care permite identificarea persoanelor vizate pe o perioadă care nu depășește perioada necesară îndeplinirii scopurilor în care sunt prelucrate datele;</li>
          <li>prelucrate într-un mod care asigură securitatea adecvată a datelor cu caracter personal, inclusiv protecția împotriva prelucrării neautorizate sau ilegale și împotriva pierderii, a distrugerii sau a deteriorării accidentale, prin luarea de măsuri tehnice sau organizatorice corespunzătoare.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "tipuri-date",
    title: "3. CARE SUNT TIPURILE DE DATE CU CARACTER PERSONAL PRELUCRATE ȘI ÎN CE SCOP SUNT PRELUCRATE ACESTEA?",
    content: (
      <div className="space-y-3">
        <p>În contextul <strong>recrutării de personal</strong>, prelucrăm următoarele tipuri de date cu caracter personal: nume, prenume, adresă, data nașterii, cetățenie, genul, nr. de tel., adresa de e-mail, date privind experiența profesională și/sau socială, educația și formarea profesională, competențe și alte date cu caracter personal care reies din informațiile cuprinse în CV-ul și din scrisoarea de intenție depuse, și după caz, în urma discuțiilor din cadrul interviului de angajare.</p>
        <p>Pentru <strong>încheierea și executarea</strong> contractelor de <strong>prestări servicii</strong> și de <strong>parteneriat/colaborare</strong>, prelucrăm în principal următoarele tipuri de date cu caracter personal: nume, prenume, serie și număr carte de identitate/pașaport, genul, adresă de domiciliu/reședință, numărul de cont bancar, adresă de e-mail, nr. de tel.</p>
        <p>În vederea <strong>creării și administrării contului de utilizator</strong> și a <strong>completării formularului de contact</strong> de pe website-ul Societății – <a href="https://rentli.ro" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://rentli.ro</a> (în continuare „website-ul” sau „Platforma”), prelucrăm următoarele tipuri de date cu caracter personal: nume, prenume, adresă de e-mail, număr de telefon, parolă (în formă criptată) și, după caz, alte date lăsate la inițiativa persoanei vizate în câmpul de mesaj.</p>
        <p>Pentru <strong>verificarea identității</strong> utilizatorilor Platformei, în scopul prevenirii fraudei și al asigurării siguranței tranzacțiilor, putem prelucra: numele și prenumele, data nașterii, seria și numărul actului de identitate, precum și imaginea documentului de identitate prezentat. Codul numeric personal <u>este prelucrat exclusiv atunci când legea o impune și cu respectarea garanțiilor prevăzute de art. 4</u> <u>din Legea nr. 190/2018. Imaginea documentului de identitate este stocată pentru o perioadă strict</u> limitată, iar accesul la aceasta este restricționat personalului anume desemnat.</p>
        <p>Pentru <strong>intermedierea rezervărilor și procesarea plăților</strong> efectuate prin Platformă, prelucrăm: datele de identificare și de contact ale proprietarului și ale chiriașului, datele privind bunul închiriat, perioada și tariful de închiriere, istoricul rezervărilor, istoricul plăților, al rambursărilor și al eventualelor penalități. Datele complete ale instrumentului de plată (numărul cardului, data expirării, codul de securitate) <strong>nu sunt colectate și nu sunt stocate de Societate</strong>; acestea sunt prelucrate direct de procesatorul de plăți autorizat.</p>
        <p>Pentru <strong>documentarea stării bunului</strong> la predare și la restituire, utilizatorii pot încărca fotografii ale <u>bunului închiriat. Aceste fotografii sunt destinate exclusiv documentării stării bunului și pot</u> <u>conține, în mod incidental, date cu caracter personal. Utilizatorii au obligația de a nu încărca</u> <u>imagini care să conțină persoane identificabile, numere de înmatriculare, documente sau alte</u> informații personale care nu sunt necesare acestui scop.</p>
        <p>Pentru <strong>comunicarea dintre utilizatori</strong>, asistența acordată prin canalele de suport și <strong>soluționarea reclamațiilor și a disputelor</strong>, prelucrăm conținutul mesajelor transmise prin Platformă, datele de identificare ale părților implicate, documentele și dovezile transmise, precum și evaluările și recenziile publicate de utilizatori.</p>
        <p>Pentru <strong>prevenirea fraudei și asigurarea securității Platformei</strong>, preluăm date tehnice și de utilizare (adresa IP, identificatorii dispozitivului, jurnalele de acces și de autentificare, istoricul activității în cont). Aceste prelucrări pot conduce la suspendarea temporară a contului. Nu luăm decizii bazate exclusiv pe prelucrarea automată care să producă efecte juridice sau să vă afecteze în mod similar în mod semnificativ fără a vă asigura dreptul de a obține intervenție umană, de a vă exprima punctul de vedere și de a contesta decizia.</p>
        <p>Vă atragem atenția că Societatea acționează ca <strong>intermediar</strong> între proprietari și chiriași. Odată confirmată o rezervare, o parte dintre datele dvs. de identificare și de contact sunt comunicate celeilalte părți a contractului de închiriere, în măsura strict necesară executării acestuia. Din acel <u>moment, cealaltă parte prelucrează datele respective în calitate de operator distinct, pe propria</u> răspundere, iar Societatea nu poate controla modul în care aceasta le utilizează.</p>
        <p>Platforma <strong>nu se adresează minorilor.</strong> Crearea unui cont și încheierea contractelor prin intermediul Platformei sunt permise exclusiv persoanelor care au împlinit vârsta de 18 ani și au capacitate deplină de exercițiu. Dacă luăm cunoștință de faptul că am colectat date ale unei <u>persoane care nu îndeplinește această condiție, vom șterge datele respective fără întârziere.</u></p>
        <p>Pentru <strong>vizitatorii website-ului</strong> este posibil să colectăm date prin module cookie sau alte tehnologii similare, precum: adresa IP, navigatorul de internet, locația, paginile web accesate pe website-ul nostru, timpul petrecut pe website, rețeaua de internet, dispozitivul utilizat. Pentru mai multe detalii în acest sens, consultați <Link to="/politica-cookies" className="text-primary hover:underline">Politica de cookie-uri.</Link></p>
        <p>Nu vă utilizăm datele dvs. cu caracter personal pentru a vă transmite <strong>comunicări de tip marketing</strong>, precum <strong>newsletter-uri</strong>, decât dacă vă dați consimțământul în mod expres pentru astfel de comunicări, bifând o căsuță de acord în acest sens. În acest sens, vă prelucrăm doar e-mailul și ne asigurăm că aveți la dispoziție o opțiune simplă de a vă dezabona în orice moment, respectiv de a vă retrage consimțământul cu privire la primirea acestor tipuri de comunicări.</p>
      </div>
    ),
  },
  {
    id: "temeiuri-legale",
    title: "4. CARE SUNT TEMEIURILE LEGALE PE CARE SE BAZEAZĂ PRELUCRAREA DATELOR CU CARACTER PERSONAL?",
    content: (
      <div className="space-y-3">
        <p>Datele dvs. cu caracter personal sunt prelucrate în vederea:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>încheierii și executării diferitelor contracte;</li>
          <li>pentru îndeplinirea obligațiilor legale care ne revin;</li>
          <li>în baza consimțământului solicitat și/sau oferit în prealabil (în contextul recrutării de personal, pentru transmiterea comunicărilor de tip marketing etc.);</li>
          <li>în scopul <strong>intereselor legitime</strong> urmărite de Societate (ex. adoptarea de măsuri de protecție și securitate a angajaților noștri, exercitarea unor drepturi și interese legitime ale Societății în cadrul procedurilor contencioase sau necontencioase etc.).</li>
        </ul>
        <p>În concret, temeiurile legale ale prelucrărilor descrise mai sus sunt următoarele:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>art. 6 alin. (1) lit. b) R.G.P.D.</strong> – executarea contractului: crearea și administrarea contului de utilizator, intermedierea rezervărilor, procesarea plăților și a rambursărilor, asistența acordată prin canalele de suport;</li>
          <li><strong>art. 6 alin. (1) lit. c) R.G.P.D.</strong> – <u>îndeplinirea obligațiilor legale: obligațiile fiscale și contabile,</u> <u>soluționarea reclamațiilor consumatorilor, răspunsul la solicitările autorităților competente;</u></li>
          <li><strong>art. 6 alin. (1) lit. f) R.G.P.D.</strong> – <u>interesele legitime ale Societății: prevenirea fraudei și a</u> <u>utilizării abuzive a Platformei, verificarea identității utilizatorilor, asigurarea securității</u> <u>sistemelor informatice, documentarea stării bunurilor închiriate, soluționarea disputelor dintre</u> <u>utilizatori, constatarea, exercitarea sau apărarea unui drept în instanță, îmbunătățirea</u> <u>serviciilor. Pentru fiecare dintre aceste prelucrări am realizat o evaluare a echilibrului dintre</u> <u>interesele noastre și drepturile și libertățile dvs., care poate fi pusă la dispoziție la cerere;</u></li>
          <li><strong>art. 6 alin. (1) lit. a) R.G.P.D.</strong> – <u>consimțământul dvs.: transmiterea comunicărilor de</u> <u>marketing, utilizarea modulelor cookie care nu sunt strict necesare, precum și orice alte</u> <u>prelucrări pentru care vă solicităm în mod expres acordul. Consimțământul poate fi retras în</u> <u>orice moment, fără a afecta legalitatea prelucrării efectuate anterior retragerii.</u></li>
        </ul>
      </div>
    ),
  },
  {
    id: "durata",
    title: "5. PE CE DURATĂ PRELUCRĂM DATELE DVS. CU CARACTER PERSONAL?",
    content: (
      <div className="space-y-3">
        <p>Datele cu caracter personal sunt stocate în vederea prelucrării lor pe durata necesară atingerii scopurilor de prelucrare menționate în prezenta Politică sau pe durata impusă de lege (ex. în materie de arhivare, de contabilitate etc.).</p>
        <p>Cu titlu orientativ, aplicăm următoarele durate de stocare:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>datele contului de utilizator</strong> – pe durata existenței contului și 30 de zile de la închiderea acestuia;</li>
          <li><strong>imaginea documentului de identitate</strong> <u>– maximum 30 de zile de la finalizarea verificării,</u> ulterior fiind păstrat doar rezultatul verificării;</li>
          <li><strong>datele privind rezervările, plățile și fotografiile de predare/restituire</strong> <u>– 3 ani de la</u> <u>încheierea închirierii, corespunzător termenului general de prescripție, respectiv până la</u> soluționarea definitivă a unei dispute în curs;</li>
          <li><strong>documentele justificative care stau la baza înregistrărilor contabile</strong> <u>– 5 ani, calculați de la</u> data de 1 iulie a anului următor celui încheierii exercițiului financiar, conform art. 25 din Legea contabilității nr. 82/1991; situațiile financiare anuale se păstrează 10 ani;</li>
          <li><strong>datele prelucrate în scop de marketing</strong> – până la retragerea consimțământului;</li>
          <li><strong>dovada consimțământului pentru module cookie</strong> – 6 luni;</li>
          <li><strong>jurnalele tehnice și de securitate</strong> – 12 luni.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "destinatari",
    title: "6. CUI TRANSMITEM DATELE CU CARACTER PERSONAL?",
    content: (
      <div className="space-y-3">
        <p>Nu vom comunica sau transfera vreunui terț, niciuna dintre datele cu caracter personal colectate de la dvs. sau despre dvs. cu <strong>excepția</strong>:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Autorităților și instituțiilor publice</strong> - când există o obligație legală în acest sens sau în scopul unui interes legitim (apărarea drepturilor Societății în procedurile contencioase sau necontencioase etc.).</li>
          <li><strong>Partenerilor contractuali sau colaboratorilor Societății</strong> care ne oferă servicii de găzduire web, de dezvoltare și mentenanță website, marketing online ș.a..</li>
          <li><strong>Oricărui terț</strong> – dacă v-ați dat consimțământul în mod expres și punctual, pentru respectiva situație și respectivele date.</li>
          <li><strong>Celorlalți utilizatori ai Platformei</strong> – proprietarul și chiriașul primesc reciproc datele de identificare și de contact strict necesare executării contractului de închiriere, după confirmarea rezervării.</li>
          <li><strong>Procesatorului de plăți</strong> – de completat – denumirea procesatorului de plăți – în vederea inițierii și securizării tranzacțiilor.</li>
          <li><strong>Furnizorului de servicii de găzduire și infrastructură</strong> – de completat – denumirea furnizorului de hosting.</li>
          <li><strong>Furnizorului de servicii de verificare a identității</strong> – de completat – denumirea furnizorului, dacă este cazul.</li>
        </ul>
        <p>În cazul în care datele cu caracter personal prelucrate de Societate sunt <strong>transferate</strong> de către aceasta direct sau prin intermediul partenerilor contractuali/colaboratorilor săi <strong>în afara Spațiului Economic European</strong>, vă asigurăm că aceste transferuri au loc cu respectarea R.G.P.D. (în special art. 46 din R.G.P.D.), a prevederilor legale aplicabile în materie, în baza unor garanții adecvate (clauze standard de protecție a datelor adoptate de Comisie) și cu condiția de a exista drepturi opozabile și căi de atac eficiente pentru persoanele vizate.</p>
        <p>În măsura în care unii dintre furnizorii noștri sunt stabiliți în Statele Unite ale Americii, transferul are loc, după caz, în temeiul <strong>Deciziei de adecvare (UE) 2023/1795 a Comisiei Europene privind Cadrul UE–SUA pentru confidențialitatea datelor</strong>, atunci când furnizorul este certificat în cadrul acestui mecanism, ori în temeiul clauzelor contractuale standard însoțite de o evaluare a <u>impactului transferului. Lista actualizată a destinatarilor și mecanismele de transfer aplicabile pot</u> <u>fi obținute la cerere, la datele de contact indicate în prezenta Politică.</u></p>
      </div>
    ),
  },
  {
    id: "protectie",
    title: "7. CE MĂSURI DE PROTECȚIE ȘI GARANȚII LUĂM?",
    content: (
      <div className="space-y-3">
        <p>Societatea implementează <u>măsuri tehnice și organizatorice adecvate în vederea asigurării unui</u> nivel înalt de securitate și protecție a datelor cu caracter personal. Utilizăm metode și tehnologii de securitate, împreună cu politici și proceduri interne de lucru, inclusiv de control și audit, pentru a proteja datele cu caracter personal colectate conform prevederilor legale în vigoare relevante în materia protecției datelor cu caracter personal.</p>
      </div>
    ),
  },
  {
    id: "drepturi",
    title: "8. CARE SUNT DREPTURILE DVS. ÎN CALITATE DE PERSOANĂ VIZATĂ?",
    content: (
      <div className="space-y-3">
        <p>Orice persoană vizată își poate exercita următoarele drepturi, așa cum sunt prevăzute de către Regulamentul general privind protecția datelor:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Dreptul de acces;</li>
          <li>Dreptul de rectificare;</li>
          <li>Dreptul la ștergere;</li>
          <li>Dreptul la restricționarea prelucrării;</li>
          <li>Dreptul la portabilitate;</li>
          <li>Dreptul la opoziție a prelucrării;</li>
          <li><u>Dreptul de a nu face obiectul unei decizii bazate exclusiv pe prelucrarea automată, inclusiv</u> <u>crearea de profiluri;</u></li>
          <li><strong>Dreptul de a vă retrage consimțământul</strong> în orice moment, atunci când prelucrarea se întemeiază pe consimțământ, fără a afecta legalitatea prelucrării efectuate anterior retragerii;</li>
          <li>Dreptul de a se adresa Autorității Naționale de Supraveghere a Prelucrării Datelor cu Caracter Personal (www.dataprotection.ro) și instanțelor de judecată.</li>
        </ul>
        <p><strong>Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal</strong> poate fi <u>contactată la adresa: B-dul G-ral. Gheorghe Magheru nr. 28-30, sector 1, cod poștal 010336,</u> <u>București, e-mail: anspdcp@dataprotection.ro.</u></p>
        <p><u>Vom răspunde solicitărilor dvs. fără întârzieri nejustificate și în orice caz în termen de o lună de la</u> <u>primirea cererii. Acest termen poate fi prelungit cu cel mult două luni atunci când este necesar,</u> <u>ținându-se seama de complexitatea și de numărul cererilor, situație în care vă vom informa cu</u> <u>privire la prelungire și la motivele acesteia în termen de o lună de la primirea cererii.</u></p>
        <p><u>În cazul în care survine o încălcare a securității datelor cu caracter personal, o vom notifica</u> <u>Autorității Naționale de Supraveghere a Prelucrării Datelor cu Caracter Personal în conformitate</u> <u>cu art. 33 din R.G.P.D. și, atunci când încălcarea este susceptibilă să genereze un risc ridicat pentru</u> <u>drepturile și libertățile dvs., vă vom informa fără întârzieri nejustificate, potrivit art. 34 din</u> R.G.P.D.</p>
        <p>Pentru exercitarea acestor drepturi sau pentru orice întrebări legate de prelucrarea datelor <u>dumneavoastră cu caracter personal, vă rugăm</u> să ne contactați pe adresa de e-mail: <a href="mailto:gdpr@rentli.ro" className="text-primary hover:underline">gdpr@rentli.ro</a> <strong>adresă de e-mail dedicată protecției datelor</strong> sau la numărul de telefon: <strong>0365.401.269</strong>, Serviciile de Responsabil pentru Protecția Datelor <u>(DPO)</u> sunt externalizate și oferite de <u>GDPRComplet.”</u></p>
      </div>
    ),
  },
];

export const sectionsEn = sectionsRo;

const PrivacyPolicy = () => {
  usePageSeo({
    title: "Politica de confidențialitate — Rentli",
    description: "Cum colectăm, folosim și protejăm datele tale personale pe Rentli.",
  });
  const { language } = useLanguage();
  const isEn = language === "en";
  return (
    <LegalPageLayout
      title={isEn ? "Politica de Confidențialitate" : "Politica de Confidențialitate"}
      subtitle={isEn
        ? "Prin prezenta Politică vă informăm despre modul în care colectăm, utilizăm, transferăm și protejăm datele dvs. cu caracter personal."
        : "Prin prezenta Politică vă informăm despre modul în care colectăm, utilizăm, transferăm și protejăm datele dvs. cu caracter personal."}
      lastUpdated="2 septembrie 2026"
      sections={isEn ? sectionsEn : sectionsRo}
    />
  );
};

export default PrivacyPolicy;
