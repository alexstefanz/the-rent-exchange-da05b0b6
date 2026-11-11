import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type TableComp = (p: { heading: string; introduction: string; rows: Array<[string, string, string, string, string]>; labels?: string[] }) => ReactNode;

const ext = "text-primary underline hover:no-underline break-all";

export const buildCookieSectionsEn = (CookieTable: TableComp) => {
  const labels = ["Cookie name", "Domain / Provider", "Type", "Expires", "Description"];
  return [
  {
    id: "introducere",
    title: "Introduction",
    content: (
      <div className="space-y-3">
        <p>This policy applies to the website https://rentli.ro (hereinafter the “website” or the “Platform”), operated by RENTLI 1 S.R.L., registered office in Valea Lupului village, Valea Lupului commune, 42 Aleea cu Nuci St., Iași County, Romania, CUI 53914386, registered with the Trade Register under no. J2026009653007 (hereinafter the “Company” or “We”).</p>
        <p><u>For complete information on the processing of personal data, please see the</u> <Link to="/politica-confidentialitate" className="text-primary underline hover:no-underline"><u>Privacy Policy.</u></Link></p>
        <p>This website uses both its own and third-party cookies to provide visitors with the best possible browsing experience and services tailored to their needs and interests.</p>
        <p>In accordance with Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 on the protection of natural persons with regard to the processing of personal data and on the free movement of such data, repealing Directive 95/46/EC (the “General Data Protection Regulation”) and the relevant national data protection legislation, <strong>all website visitors are asked for consent before cookies are sent to their devices.</strong></p>
        <p>When you visit our website, no personal data is sent to our server unless you actively send us such data. The only exceptions are technically required cookies, which are essential for our website to work.</p>
        <p><u>Cookies and similar technologies that are not strictly necessary for the website to function are not installed or activated before your consent is obtained. Until you express your choice through the consent banner, they remain blocked.</u></p>
        <p><u>Third-party content embedded in the website (e.g. maps, embedded videos, social media modules, analytics tools) is disabled by default, so that no data is sent to these third parties without your consent.</u></p>
        <p>You can choose to accept other cookies in the cookie banner or to allow external content to improve the functionality and content of our website. In this case, third-party providers may learn your personal data.</p>
      </div>
    ),
  },
  {
    id: "ce-sunt-cookie-urile",
    title: "What are cookies?",
    content: (
      <div className="space-y-3">
        <p>A cookie is a small text file that a website saves on your computer or mobile device when you visit it. Thanks to cookies, the website remembers your actions and preferences (login, language, font size and other display preferences) for a period of time, so you don't have to re-enter them whenever you come back to the website or browse from one page to another.</p>
        <p>Cookies may also contain personal data, such as your IP address. Therefore, we only store non-essential cookies if you have explicitly allowed it through the <u>consent banner. You can withdraw your consent at any time, as easily as you gave it, via the permanent “Cookie settings” link available in the footer of every page. Withdrawal of consent does not affect the lawfulness of processing carried out before withdrawal.</u></p>
        <p>The exception is cookies that are technically essential for our website to work. Without them you cannot visit or browse our website, so these cookies are generally enabled by default.</p>
        <p>You can also disable cookies generally in your browser at any time. This prevents cookies from being stored on your device. Please note that disabling cookies generally may cause our website to malfunction.</p>
      </div>
    ),
  },
  {
    id: "cum-se-folosesc",
    title: "How are cookies used?",
    content: (
      <div className="space-y-3">
        <p>There are 3 types of cookies generally used:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Necessary cookies:</strong> make the website work by enabling basic functions such as page navigation and access to secure areas of the website. The website cannot function properly without these cookies.</li>
          <li><strong>Statistics cookies:</strong> collect and report information anonymously and help website owners understand how visitors interact with the website.</li>
          <li><strong>Marketing cookies:</strong> are used to track visitors across websites. The aim is to display ads that are relevant and engaging for each visitor.</li>
        </ul>
        <p>There is also a category of Unclassified cookies, which are in the process of being classified into one of the 3 main categories.</p>
        <p><u>Please note that the consent rules apply not only to cookies themselves but to any storage of or access to information on your terminal equipment – including localStorage, sessionStorage, tracking pixels, SDKs or fingerprinting – according to art. 5(3) of Directive 2002/58/EC, transposed by art. 4(5) of Law no. 506/2004, as interpreted by Guidelines 2/2023 of the European Data Protection Board.</u></p>
        <p>The rentli.ro domain uses cookies and similar technologies. The categories actually used and their full list are shown in the table below, generated based on the website scan report.</p>
      </div>
    ),
  },
  {
    id: "temeiuri-juridice",
    title: "The legal bases are as follows:",
    content: (
      <div className="space-y-3">
        <p>– <strong>Strictly necessary cookies are exempt from the consent requirement under art. 5(3), second sentence, of Directive 2002/58/EC, transposed by art. 4(5) of Law</strong> <u>no. 506/2004, as they are essential for providing the service you have expressly requested.</u> <u>The resulting processing of personal data is based on art. 6(1)(f) GDPR.</u></p>
        <p>– <u>All other cookies (statistics, preferences, marketing) are installed only on the</u> <u>basis of your consent, according to art. 5(3) of Directive 2002/58/EC and art. 6(1)</u> <u>(a) GDPR.</u></p>
        <p><u>Consent is given by a clear affirmative action. The consent banner lets you accept, reject or granularly select cookie categories, with the reject option shown at the same visual level as the accept option. Continuing to browse, scrolling or closing the banner</u> <strong>does not constitute valid consent.</strong> <u>Proof of your consent is kept for 6 months, after which you will be asked for your</u> <u>choice again.</u></p>
      </div>
    ),
  },
  {
    id: "cookie-uri-terti",
    title: "What are third-party cookies?",
    content: <p>Certain content sections on the website may be provided by third parties. These third parties may place cookies through another website; they are called “third party cookies” because they are not placed by the owner of that website. Third-party providers must also comply with applicable law and the website owner's privacy policies.</p>,
  },
  {
    id: "durata-de-viata",
    title: "What is the lifetime of a cookie?",
    content: <p>Cookies are managed by web servers. A cookie's lifetime can vary significantly depending on its purpose. Some cookies are used only for a single session (<em>session cookies</em>) and are no longer kept once the visitor has left the website, while other cookies are kept and reused every time the visitor returns to that website (persistent cookies). However, cookies can be deleted by a visitor at any time through their browser settings.</p>,
  },
  {
    id: "control-cookie-uri",
    title: "How can you control cookies?",
    content: (
      <div className="space-y-3">
        <p>You can control and/or delete cookies as you wish – for details, see <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer" className={ext}>https://www.aboutcookies.org.</a> You can delete all cookies on your computer and set most browsers to block them. If you do this, you may have to manually adjust some preferences every time you visit the website, and some services or features may not work.</p>
        <p>Useful links for controlling cookies depending on your browser:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Cookies in Internet Explorer (<a href="https://support.microsoft.com/en-us/help/17442/windows-internet-explorer-delete-manage-cookies" target="_blank" rel="noopener noreferrer" className={ext}>https://support.microsoft.com/en-us/help/17442/windows-internet-explorer-delete-manage-cookies</a>)</li>
          <li>Cookies in Firefox (<a href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" target="_blank" rel="noopener noreferrer" className={ext}>https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences</a>)</li>
          <li>Cookies in Chrome (<a href="https://support.google.com/chrome/answer/95647?co=GENIE.Platform%3DAndroid&hl=en" target="_blank" rel="noopener noreferrer" className={ext}>https://support.google.com/chrome/answer/95647?co=GENIE.Platform%3DAndroid&amp;hl=en</a>)</li>
          <li>Cookies in Opera (<a href="https://www.opera.com/help/tutorials/security/privacy/" target="_blank" rel="noopener noreferrer" className={ext}>https://www.opera.com/help/tutorials/security/privacy/</a>)</li>
        </ul>
      </div>
    ),
  },
  {
    id: "raport-scanare",
    title: "Cookies used by rentli.ro",
    content: (
      <div className="space-y-5">
        <p>Below you can see the specific cookies used by <u>rentli.ro</u> by category:</p>
        <p>Result of the <u>Cookie scan report</u> generated by the module used – CookieServe, on 2 September 2026:</p>
        <CookieTable labels={labels}
          heading="Necessary: 2"
          introduction="Necessary cookies help a website work by enabling basic functions such as page navigation and access to secure areas. The website cannot function properly without these cookies. No consent required."
          rows={[
            ['__cf_bm', '.rentli.ro', 'HTTP', '1 hour', 'Cookie set by Cloudflare, used for Cloudflare Bot Management, i.e. to distinguish traffic generated by real users from automated traffic and to protect the website against abusive access.'],
            ['__cf_bm', 'supabase.co', 'HTTP', '1 hour', 'Cookie set by Cloudflare for the supabase.co provider infrastructure, used for Cloudflare Bot Management, i.e. to distinguish traffic generated by real users from automated traffic.'],
          ]}
        />
        <CookieTable labels={labels}
          heading="Analytics / Statistics: 1"
          introduction="Analytics cookies help us understand how visitors interact with the website by collecting and reporting information. They are installed only on the basis of your consent."
          rows={[
            ['session-id', 'rentli.ro', 'HTTP', '1 hour', 'Session cookie that maintains continuity of the user session across multiple pages and visits. Session information may include user identity, recently accessed links and idle time.'],
          ]}
        />
        <CookieTable labels={labels}
          heading="Other / Unclassified: 1"
          introduction="Unclassified cookies are cookies that, at the time of scanning, had not yet been assigned to one of the main categories. They are being classified together with the service providers involved."
          rows={[
            ['__dpl', 'rentli.ro', 'HTTP', '7 days', 'Unclassified cookie at the time of scanning. Its purpose and provider are to be confirmed; until classified, this cookie is treated as subject to consent.'],
          ]}
        />
        <p><strong>Notes on the scan report:</strong></p>
        <p><u>– The scan was performed with the CookieServe tool</u></p>
        <p><u>– The list is updated whenever new modules, scripts or technologies are implemented on the website and, in any case, through periodic rescanning.</u></p>
      </div>
    ),
  },
  {
    id: "modificare-optiuni-contact",
    title: "Changing your choices and contact",
    content: (
      <div className="space-y-3">
        <p>To change your choices, please use the permanent <strong>“Cookie settings”</strong> link available in the footer of every page. Through it you can give, <u>change or withdraw your consent at any time, as easily as you gave it.</u></p>
        <p><u>For any questions about this policy or how we use cookies, you can contact us at <a href="mailto:gdpr@rentli.ro" className="text-primary underline hover:no-underline"><strong>gdpr@rentli.ro</strong></a>. Data Protection Officer services are outsourced and provided by GDPRComplet, tel. 0365.401.269.</u></p>
      </div>
    ),
  },
  ];
};
