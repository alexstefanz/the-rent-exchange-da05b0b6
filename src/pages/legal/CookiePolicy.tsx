import { Link } from "react-router-dom";
import LegalPageLayout from "./LegalPageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageSeo } from "@/hooks/usePageSeo";
import CookieDeclaration from "@/components/CookieDeclaration";

const sectionsRo = [
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
        <p>Lista completă și mereu actualizată a cookie-urilor folosite pe Rentli este generată automat de platforma noastră de consimțământ (Cookiebot) și este afișată mai jos.</p>
        <CookieDeclaration culture="ro" />
        <div className="mt-3">
          <h4 className="font-semibold text-foreground mb-2">Temeiuri juridice:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Cookie-uri esențiale:</strong> interes legitim (art. 6 alin. 1 lit. f din GDPR) — strict necesare funcționării corecte.</li>
            <li><strong>Cookie-uri de statistică, preferințe și marketing:</strong> consimțământ (art. 6 alin. 1 lit. a din GDPR), colectat prin banner-ul Cookiebot și revocabil oricând.</li>
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

const sectionsEn = [
  {
    id: "ce-sunt",
    title: "What are cookies?",
    content: (
      <div className="space-y-3">
        <p>Cookies are small text files stored on your device (computer, phone, tablet) when you visit our website. Their purpose is to recognize your device and offer you a better experience.</p>
        <p>Cookies fall into several categories:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Essential cookies:</strong> required for the basic functioning of the site (navigation, access to secure areas). They do not require consent.</li>
          <li><strong>Performance cookies:</strong> help us understand how you use the site and improve it. Placed only with your consent.</li>
          <li><strong>Marketing cookies:</strong> used for personalized ads. We currently do not use this category.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "tipuri",
    title: "Types of cookies used",
    content: (
      <div className="space-y-3">
        <p>The full, always up-to-date list of cookies used on Rentli is generated automatically by our consent management platform (Cookiebot) and shown below.</p>
        <CookieDeclaration culture="en" />
        <div className="mt-3">
          <h4 className="font-semibold text-foreground mb-2">Legal bases:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Essential cookies:</strong> legitimate interest (Art. 6(1)(f) GDPR) — strictly necessary for proper operation.</li>
            <li><strong>Statistics, preferences and marketing cookies:</strong> consent (Art. 6(1)(a) GDPR), collected through the Cookiebot banner and revocable at any time.</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "gestionare",
    title: "How to manage cookies",
    content: (
      <div className="space-y-3">
        <p>You can control or disable cookies from your browser settings. Note that disabling some cookies may limit site functionality.</p>
        <div>
          <h4 className="font-semibold text-foreground mb-2">Available options:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Block all:</strong> you can block all cookies, but site functionality may be affected.</li>
            <li><strong>Delete cookies:</strong> you can delete existing cookies from your browser, including those storing your preferences.</li>
            <li><strong>Private browsing:</strong> most browsers offer "incognito" mode, which limits stored data and automatically deletes cookies at the end of the session.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-2">Managing cookies in popular browsers:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
            <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
            <li><a href="https://support.apple.com/en-us/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Apple Safari</a></li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "consimtamant",
    title: "User consent",
    content: (
      <div className="space-y-3">
        <p>On your first visit, we ask for your consent to use cookies. You can withdraw consent at any time, either from your browser settings or via the consent banner displayed on the site.</p>
        <p>If you choose to block cookies, certain site features may become unavailable or work incorrectly.</p>
      </div>
    ),
  },
  {
    id: "actualizari",
    title: "Policy updates",
    content: (
      <p>We reserve the right to update this policy. Changes will be communicated by email or through platform notifications. We recommend checking this page periodically.</p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <p>If you have questions about this cookie policy, you can contact us through the <Link to="/centru-asistenta" className="text-primary hover:underline">support page</Link>.</p>
    ),
  },
];

const CookiePolicy = () => {
  usePageSeo({
    title: "Politica de cookie-uri — Rentli",
    description: "Ce cookie-uri folosim pe Rentli și cum poți gestiona preferințele tale.",
  });
  const { language } = useLanguage();
  const isEn = language === "en";
  return (
    <LegalPageLayout
      title={isEn ? "Cookie Policy" : "Politica privind Cookie-urile"}
      subtitle={isEn
        ? "This policy explains how Rentli uses cookies and similar technologies on our website."
        : "Această politică explică modul în care Rentli utilizează cookie-urile și tehnologiile similare pe site-ul nostru web."}
      lastUpdated="28.02.2026"
      sections={isEn ? sectionsEn : sectionsRo}
    />
  );
};

export default CookiePolicy;
