import { Link } from "react-router-dom";
import LegalPageLayout from "./LegalPageLayout";
import { usePageSeo } from "@/hooks/usePageSeo";

const externalLinkClass = "text-primary underline hover:no-underline break-all";

const CookieTable = ({
  heading,
  introduction,
  rows,
}: {
  heading: string;
  introduction: string;
  rows: Array<[string, string, string, string, string]>;
}) => (
  <div className="overflow-x-auto border border-border rounded-lg">
    <table className="w-full min-w-[820px] border-collapse text-sm">
      <thead>
        <tr>
          <th colSpan={5} className="border-b border-border bg-muted p-3 text-left font-normal">
            <strong>{heading}</strong> <em>{introduction}</em>
          </th>
        </tr>
        <tr className="bg-muted/60">
          {['Nume cookie', 'Domeniu / Furnizor', 'Tip', 'Când expiră', 'Descriere'].map((label) => (
            <th key={label} className="border-b border-r border-border p-3 text-left last:border-r-0">{label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={`${row[0]}-${row[1]}-${rowIndex}`}>
            {row.map((value, cellIndex) => (
              <td key={`${value}-${cellIndex}`} className="border-b border-r border-border p-3 align-top last:border-r-0 last:border-b-0">
                {cellIndex === 0 ? <strong>{value}</strong> : value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const sections = [
  {
    id: "introducere",
    title: "Introducere",
    content: (
      <div className="space-y-3">
        <p>Prezenta politică se aplică website-ului https://rentli.ro (în continuare „website-ul" sau „Platforma"), operat de RENTLI 1 S.R.L., cu sediul social în sat Valea Lupului, comuna Valea Lupului, str. Aleea cu Nuci nr. 42, județul Iași, România, CUI 53914386, înregistrată la Registrul Comerțului sub nr. J2026009653007 (în continuare „Societatea" sau „Noi").</p>
        <p><u>Pentru informații complete privind prelucrarea datelor cu caracter personal, vă rugăm să consultați</u> <Link to="/politica-confidentialitate" className="text-primary underline hover:no-underline"><u>Politica de confidențialitate.</u></Link></p>
        <p>Acest website folosește atât cookie-uri proprii, cât și de la terți, pentru a furniza vizitatorilor o experiență cât mai bună de navigare și servicii adaptate nevoilor și interesului fiecăruia dintre aceștia.</p>
        <p>În conformitate cu Regulamentul (UE) 2016/679 al Parlamentului European și al Consiliului din 27 aprilie 2016 privind protecția persoanelor fizice în ceea ce privește prelucrarea datelor cu caracter personal și privind libera circulație a acestor date, și de abrogare a Directivei nr. 95/46/CE (,,Regulamentul general privind protecția datelor'') și cu legislația națională relevantă în materia protecției datelor, <strong>tuturor vizitatorilor website-ului li se cere consimțământul înaintea transmiterii de cookie-uri în computerele acestora.</strong></p>
        <p>Când vizitați pagina noastră de Internet, nu sunt transmise date cu caracter personal către serverul nostru, decât dacă ne trimiteți în mod activ astfel de date. Singurele excepții sunt cookie-urile obligatorii din punct de vedere tehnic, care sunt esențiale pentru funcționarea paginii noastre de Internet.</p>
        <p><u>Modulele cookie și tehnologiile similare care nu sunt strict necesare funcționării website-ului nu se instalează și nu se activează înainte de obținerea consimțământului dvs. Până în momentul în care vă exprimați opțiunea prin bannerul de consimțământ, acestea rămân blocate.</u></p>
        <p><u>Conținutul furnizat de terți și integrat în website (de exemplu hărți, materiale video încorporate, module de rețele sociale, instrumente de analiză) este dezactivat în mod implicit, astfel încât să nu se transmită date către acești terți în lipsa acordului dvs.</u></p>
        <p>Aveți opțiunea de a accepta utilizarea altor cookie-uri în banner-ul cookie sau de a permite conținut extern pentru a îmbunătăți funcționalitatea și conținutul paginii noastre de Internet. În acest caz, furnizorii terți pot afla de la dvs. datele dvs. cu caracter personal.</p>
      </div>
    ),
  },
  {
    id: "ce-sunt-cookie-urile",
    title: "Ce se înțelege prin cookies?",
    content: (
      <div className="space-y-3">
        <p>Cookie-ul este un fișier text de mici dimensiuni pe care un website îl salvează în calculatorul sau dispozitivul dvs. mobil atunci când îl vizitați. Datorită cookie-urilor, website-ul reține, pentru o perioadă de timp, acțiunile și preferințele dvs. (login, limbă, dimensiunea caracterelor și alte preferințe de afișare). Astfel, nu mai trebuie să le reintroduceți ori de câte ori reveniți la website sau navigați de pe o pagină pe alta.</p>
        <p>Cookie-urile pot conține și date cu caracter personal, precum adresa dvs. IP. Prin urmare, stocăm cookie-uri care nu sunt strict necesare numai dacă ați permis în mod explicit acest lucru prin <u>bannerul de consimțământ. Vă puteți retrage consimțământul în orice moment, la fel de simplu cum l-ați acordat, prin accesarea link-ului permanent „Setări cookie-uri" disponibil în subsolul fiecărei pagini a website-ului. Retragerea consimțământului nu afectează legalitatea prelucrării efectuate anterior retragerii.</u></p>
        <p>Excepție fac cookie-urile care sunt esențiale din punct de vedere tehnic pentru funcționarea paginii noastre de Internet. Fără acestea nu puteți vizita sau naviga pe pagina noastră de Internet. Prin urmare, aceste cookie-uri sunt activate în general din oficiu.</p>
        <p>De asemenea, aveți posibilitatea de a dezactiva, în general, cookie-urile în browser-ul dvs. în orice moment. Acest lucru împiedică stocarea cookie-urilor pe dispozitivul dvs. În acest sens, atragem atenția că dezactivarea generală a cookie-urilor poate duce la disfuncționalități privind utilizarea paginii noastre de Internet.</p>
      </div>
    ),
  },
  {
    id: "cum-se-folosesc",
    title: "Cum se folosesc cookie-urile?",
    content: (
      <div className="space-y-3">
        <p>Există 3 tipuri de cookie-uri utilizate în general:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Cookie-urile necesare:</strong> fac website-ul funcțional, oferind funcționalități de bază precum navigarea pe paginile website-ului și accesul la zonele securizate ale website-ului. Website-ul nu poate funcționa corect fără aceste cookie-uri.</li>
          <li><strong>Cookie-urile statistice:</strong> colectează și raportează informații în mod anonim și ajută proprietarii de website-uri să înțeleagă modul în care vizitatorii interacționează cu website-ul.</li>
          <li><strong>Cookie-urile de marketing:</strong> sunt folosite pentru a urmări vizitatorii pe website-urile lor de navigare. Scopul este de a oferi reclame relevante și captivante pentru fiecare vizitator.</li>
        </ul>
        <p>Mai există și categoria de Cookie-uri neclasificate, care sunt în curs de clasificare, respectiv de încadrare în una dintre cele 3 categorii principale.</p>
        <p><u>Precizăm că regulile privind consimțământul se aplică nu doar cookie-urilor propriu-zise, ci oricărei operațiuni de stocare sau de accesare a informațiilor pe echipamentul dvs. terminal – inclusiv tehnologiilor de tip localStorage, sessionStorage, pixeli de urmărire, SDK-uri sau amprentare digitală („fingerprinting") – potrivit art. 5 alin. (3) din Directiva 2002/58/CE, transpus prin art. 4 alin. (5) din Legea nr. 506/2004, astfel cum a fost interpretat prin Ghidul 2/2023 al Comitetului European pentru Protecția Datelor.</u></p>
        <p>Domeniul rentli.ro folosește module cookie și tehnologii similare. Categoriile efectiv utilizate și lista completă a acestora sunt cele indicate în tabelul de mai jos, generat pe baza raportului de scanare a website-ului.</p>
      </div>
    ),
  },
  {
    id: "temeiuri-juridice",
    title: "Temeiurile juridice sunt următoarele:",
    content: (
      <div className="space-y-3">
        <p>– <strong>Cookie-urile strict necesare sunt exceptate de la obligația de a obține consimțământul, în temeiul art. 5 alin. (3) teza a II-a din Directiva 2002/58/CE, transpus prin art. 4 alin. (5) din Legea</strong> <u>nr. 506/2004, întrucât sunt indispensabile furnizării serviciului solicitat în mod expres de dvs.</u> <u>Prelucrarea datelor cu caracter personal rezultate se întemeiază pe art. 6 alin. (1) lit. f) din R.G.P.D.</u></p>
        <p>– <u>Toate celelalte module cookie (statistice, de preferințe, de marketing) se instalează exclusiv în</u> <u>temeiul consimțământului dvs., potrivit art. 5 alin. (3) din Directiva 2002/58/CE și art. 6 alin. (1)</u> <u>lit. a) din R.G.P.D.</u></p>
        <p><u>Consimțământul se acordă prin acțiune afirmativă neechivocă. Bannerul de consimțământ vă permite să acceptați, să respingeți sau să selectați în mod granular categoriile de cookie-uri, opțiunea de respingere fiind disponibilă la același nivel vizual cu cea de acceptare. Continuarea navigării, derularea paginii sau închiderea bannerului</u> <strong>nu constituie consimțământ valabil.</strong> <u>Dovada consimțământului dvs. este păstrată timp de 6 luni, după care vi se va solicita din nou</u> <u>opțiunea.</u></p>
      </div>
    ),
  },
  {
    id: "cookie-uri-terti",
    title: "Ce sunt cookie-urile plasate de terți?",
    content: <p>Anumite secțiuni de conținut de pe website pot fi furnizate prin intermediul unor terțe părți. Aceste terțe părți pot plasa cookie-uri prin intermediul altui website și ele se numesc ,,third party cookies&quot; pentru că nu sunt plasate de proprietarul website-ului respectiv. Furnizorii terți trebuie să respecte de asemenea, legea în vigoare și politicile de confidențialitate ale deținătorului website-ului.</p>,
  },
  {
    id: "durata-de-viata",
    title: "Care este durata de viață a unui cookie?",
    content: <p>Cookie-urile sunt administrate de webservere. Durata de viață a unui cookie poate varia semnificativ, depinzând de scopul pentru care este plasat. Unele cookie-uri sunt folosite exclusiv pentru o singură sesiune (<em>session cookies</em>) și nu mai sunt reținute, odată ce vizitatorul a părăsit website-ul, în timp ce alte cookie-uri sunt reținute și refolosite de fiecare dată când vizitatorul revine pe acel website (cookie-uri persistente). Cu toate acestea, cookie-urile pot fi șterse de un vizitator în orice moment prin intermediul setărilor browser-ului pe care îl folosește.</p>,
  },
  {
    id: "control-cookie-uri",
    title: "Cum puteți controla cookie-urile?",
    content: (
      <div className="space-y-3">
        <p>Puteți controla și/sau șterge cookie-urile după cum doriți – pentru detalii, consultați website-ul <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer" className={externalLinkClass}>https://www.aboutcookies.org.</a> Puteți șterge toate cookie-urile din calculatorul dvs. și puteți seta majoritatea browserelor să blocheze plasarea acestora. Dacă faceți acest lucru, este posibil să fiți nevoit să setați manual unele preferințe, de fiecare dată când vizitați website-ul. De asemenea, s-ar putea ca unele servicii sau opțiuni să nu funcționeze.</p>
        <p>Link-uri utile pentru controlul cookie-urilor în funcție de browser-ul pe care îl folosiți:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Cookies în Internet Explorer (<a href="https://support.microsoft.com/en-us/help/17442/windows-internet-explorer-delete-manage-cookies" target="_blank" rel="noopener noreferrer" className={externalLinkClass}>https://support.microsoft.com/en-us/help/17442/windows-internet-explorer-delete-manage-cookies</a>)</li>
          <li>Cookies în Firefox (<a href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" target="_blank" rel="noopener noreferrer" className={externalLinkClass}>https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences</a>)</li>
          <li>Cookies în Chrome (<a href="https://support.google.com/chrome/answer/95647?co=GENIE.Platform%3DAndroid&hl=en" target="_blank" rel="noopener noreferrer" className={externalLinkClass}>https://support.google.com/chrome/answer/95647?co=GENIE.Platform%3DAndroid&amp;hl=en</a>)</li>
          <li>Cookies în Opera (<a href="https://www.opera.com/help/tutorials/security/privacy/" target="_blank" rel="noopener noreferrer" className={externalLinkClass}>https://www.opera.com/help/tutorials/security/privacy/</a>)</li>
        </ul>
      </div>
    ),
  },
  {
    id: "raport-scanare",
    title: "Cookie-urile folosite de rentli.ro",
    content: (
      <div className="space-y-5">
        <p>Mai jos puteți consulta în mod specific cookie-urile folosite de <u>rentli.ro</u> după categoria acestora:</p>
        <p>Rezultatul Raportului de scanare <u>a cookie-urilor</u> („Cookie scan report") generat de modulul folosit – CookieServe, la data de 2 septembrie 2026:</p>
        <CookieTable
          heading="Necesare: 2"
          introduction="Cookie-urile necesare ajută la funcționarea unui website, permițând funcțiile de bază precum navigarea pe pagină și accesul la zone securizate ale acestuia. Website-ul nu poate funcționa corect fără aceste cookie-uri. Nu necesită consimțământ."
          rows={[
            ['__cf_bm', '.rentli.ro', 'HTTP', '1 oră', 'Cookie plasat deCloudflare, utilizat pentru funcționalitateaCloudflareBot Management, respectiv pentru distingerea traficului generat de utilizatori reali de cel generat automat și pentru protejarea website-ului împotriva accesului abuziv.'],
            ['__cf_bm', 'supabase.co', 'HTTP', '1 oră', 'Cookie plasat deCloudflarepentru infrastructura furnizorului supabase.co, utilizat pentru funcționalitateaCloudflareBot Management, respectiv pentru distingerea traficului generat de utilizatori reali de cel generat automat.'],
          ]}
        />
        <CookieTable
          heading="Analitice / Statistice: 1"
          introduction="Cookie-urile analitice ne ajută să înțelegem cum interacționează vizitatorii cu website-ul prin colectarea și raportarea informațiilor. Se instalează numai în temeiul consimțământului dvs."
          rows={[
            ['session-id', 'rentli.ro', 'HTTP', '1 oră', 'Cookie de sesiune care menține continuitatea sesiunii utilizatorului între mai multe pagini și vizite. Informațiile de sesiune pot include identitatea utilizatorului, link-urile accesate recent și durata de inactivitate.'],
          ]}
        />
        <CookieTable
          heading="Altele / Neclasificate: 1"
          introduction="Cookie-uri neclasificate sunt acele cookie-uri pentru care, la data scanării, nu a fost stabilită încă o încadrare într-una dintre categoriile principale. Acestea se află în curs de clasificare, împreună cu furnizorii de servicii implicați."
          rows={[
            ['__dpl', 'rentli.ro', 'HTTP', '7 zile', 'Cookie neclasificat la data scanării. Scopul și furnizorul urmează a fi confirmate; până la clasificare, acest cookie este tratat ca fiind supus consimțământului.'],
          ]}
        />
        <p><strong>Precizări privind raportul de scanare:</strong></p>
        <p><u>– Scanarea a fost efectuată cu instrumentul CookieServe</u></p>
        <p><u>– Lista se actualizează ori de câte ori se implementează module, scripturi sau tehnologii noi pe website și, în orice caz, prin rescanare periodică.</u></p>
      </div>
    ),
  },
  {
    id: "modificare-optiuni-contact",
    title: "Modificarea opțiunilor și contact",
    content: (
      <div className="space-y-3">
        <p>Pentru modificarea opțiunilor dvs., vă rugăm să accesați link-ul permanent <strong>„Setări cookie-uri"</strong>, disponibil în subsolul fiecărei pagini a website-ului. Prin intermediul acestuia vă puteți acorda, <u>modifica sau retrage consimțământul în orice moment, la fel de simplu cum l-ați acordat.</u></p>
        <p><u>Pentru orice întrebări privind prezenta politică sau modul în care utilizăm modulele cookie, ne puteți contacta la adresa de e-mail <a href="mailto:gdpr@rentli.ro" className="text-primary underline hover:no-underline"><strong>gdpr@rentli.ro</strong></a>. Serviciile de Responsabil cu Protecția Datelor sunt externalizate și oferite de GDPRComplet, tel. 0365.401.269.</u></p>
      </div>
    ),
  },
];

const CookiePolicy = () => {
  usePageSeo({
    title: "Politica de cookies — Rentli",
    description: "Politica Rentli privind utilizarea cookie-urilor și tehnologiilor similare.",
  });

  return (
    <LegalPageLayout
      title="POLITICA DE COOKIES"
      subtitle=""
      lastUpdated="2 septembrie 2026"
      sections={sections}
      forceRomanianLabels
    />
  );
};

export default CookiePolicy;
