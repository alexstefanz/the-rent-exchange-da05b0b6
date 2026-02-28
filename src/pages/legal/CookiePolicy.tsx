import { Link } from "react-router-dom";
import LegalPageLayout from "./LegalPageLayout";

const sections = [
  {
    id: "ce-sunt",
    title: "Ce sunt cookie-urile?",
    content: (
      <div className="space-y-3">
        <p>Cookie-urile sunt fișiere mici de text stocate pe dispozitivul dumneavoastră (computer, telefon, tabletă) atunci când vizitați site-ul nostru. Scopul lor este de a vă recunoaște dispozitivul și de a vă oferi o experiență mai bună.</p>
        <p>Cookie-urile se împart în mai multe categorii:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Cookie-uri esențiale:</strong> necesare funcționării de bază a site-ului (navigare, acces la zone securizate). Nu necesită consimțământ.</li>
          <li><strong>Cookie-uri de performanță:</strong> ne ajută să înțelegem cum folosiți site-ul și să îl îmbunătățim. Se plasează doar cu acordul dumneavoastră.</li>
          <li><strong>Cookie-uri de marketing:</strong> folosite pentru reclame personalizate. În prezent, nu utilizăm această categorie.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "tipuri",
    title: "Tipurile de cookie-uri utilizate",
    content: (
      <div className="space-y-3">
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Cookie-uri esențiale:</strong> permit funcționalitățile de bază ale site-ului — navigare, autentificare, acces la zone securizate.</li>
          <li><strong>Cookie-uri pentru plăți:</strong> utilizate de procesatorul de plăți pentru securizarea tranzacțiilor și gestionarea sesiunilor de plată. Sunt esențiale pentru procesul de plată.</li>
          <li><strong>Cookie-uri de performanță:</strong> colectează date anonime despre utilizarea site-ului, ajutându-ne să optimizăm experiența. Se activează doar cu acordul dumneavoastră.</li>
        </ul>
        <div className="mt-3">
          <h4 className="font-semibold text-foreground mb-2">Temeiuri juridice:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Cookie-uri esențiale:</strong> interes legitim (art. 6 alin. 1 lit. f din GDPR) — strict necesare funcționării corecte.</li>
            <li><strong>Cookie-uri de performanță:</strong> consimțământ (art. 6 alin. 1 lit. a din GDPR) — pentru analiza și îmbunătățirea site-ului.</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "gestionare",
    title: "Cum gestionați cookie-urile",
    content: (
      <div className="space-y-3">
        <p>Puteți controla sau dezactiva cookie-urile din setările browserului. Rețineți că dezactivarea unor cookie-uri poate limita funcționalitatea site-ului.</p>
        <div>
          <h4 className="font-semibold text-foreground mb-2">Opțiuni disponibile:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Blocarea totală:</strong> puteți bloca toate cookie-urile, dar funcționalitatea site-ului poate fi afectată.</li>
            <li><strong>Ștergerea cookie-urilor:</strong> puteți șterge cookie-urile existente din browser, inclusiv cele care stochează preferințele dumneavoastră.</li>
            <li><strong>Navigare privată:</strong> majoritatea browserelor permit modul „incognito", care limitează datele stocate și șterge automat cookie-urile la încheierea sesiunii.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-2">Gestionarea cookie-urilor pe browsere populare:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><a href="https://support.google.com/chrome/answer/95647?hl=ro" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/ro/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
            <li><a href="https://support.microsoft.com/ro-ro/microsoft-edge/ștergerea-modulelor-cookie-în-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
            <li><a href="https://support.apple.com/ro-ro/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Apple Safari</a></li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "consimtamant",
    title: "Consimțământul utilizatorilor",
    content: (
      <div className="space-y-3">
        <p>La prima accesare a site-ului, vă solicităm acordul pentru utilizarea cookie-urilor. Puteți retrage consimțământul oricând, fie din setările browserului, fie prin banner-ul de consimțământ afișat pe site.</p>
        <p>Dacă alegeți să blocați cookie-urile, anumite funcții ale site-ului pot deveni indisponibile sau pot funcționa necorespunzător.</p>
      </div>
    ),
  },
  {
    id: "actualizari",
    title: "Actualizări ale politicii",
    content: (
      <p>Ne rezervăm dreptul de a actualiza această politică. Modificările vor fi comunicate prin e-mail sau prin notificări pe platformă. Vă recomandăm să verificați periodic această pagină.</p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <p>Dacă aveți întrebări despre această politică privind cookie-urile, ne puteți contacta prin <Link to="/centru-asistenta" className="text-primary hover:underline">pagina de suport</Link>.</p>
    ),
  },
];

const CookiePolicy = () => (
  <LegalPageLayout
    title="Politica privind Cookie-urile"
    subtitle="Această politică explică modul în care Rentli utilizează cookie-urile și tehnologiile similare pe site-ul nostru web."
    lastUpdated="28.02.2026"
    sections={sections}
  />
);

export default CookiePolicy;
