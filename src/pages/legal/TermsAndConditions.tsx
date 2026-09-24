import { Link } from "react-router-dom";
import LegalPageLayout from "./LegalPageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageSeo } from "@/hooks/usePageSeo";

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
        <p><strong>Anularea rezervării:</strong> Anularea gratuită este posibilă cu cel puțin 24 de ore înainte de începerea perioadei de închiriere. Pentru detalii complete, consultați <Link to="/politica-anulare" className="text-primary hover:underline">politica de anulare</Link>.</p>
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
        <p>Pentru întrebări sau nelămuriri, vă rugăm să ne contactați prin <Link to="/suport" className="text-primary hover:underline">pagina de suport</Link>.</p>
      </div>
    ),
  },
];

const sectionsEn = [
  {
    id: "definitii",
    title: "Definitions",
    content: (
      <div className="space-y-3">
        <p><strong>"Platform"</strong> — the website operated by Rentli through which users can list, search for and rent various items. It includes all available features: product listings, account management, payment processing and user-to-user communication.</p>
        <p><strong>"Listing"</strong> — the process by which an owner registers an item on the platform, providing details such as description, photos, rental price and availability.</p>
        <p><strong>"Item" / "Object"</strong> — any product or piece of equipment that can be listed and rented through the platform (e.g., sports equipment, electronics, tools, recreational vehicles, etc.).</p>
        <p><strong>"Owner"</strong> — the natural or legal person who owns an item and makes it available for rent through Rentli. Responsible for the accuracy of the information provided and for fulfilling contractual obligations.</p>
        <p><strong>"Renter"</strong> — the natural or legal person who uses the platform to identify, book and rent an item from an owner.</p>
        <p><strong>"Service"</strong> — all features offered by Rentli, including item listings, processing of bookings and payments, and intermediating the relationship between owners and renters.</p>
        <p><strong>"Users"</strong> — all persons who access the platform, whether owners, renters or simple visitors.</p>
        <p><strong>"Agreement"</strong> — the agreement entered into between Rentli and a user by accepting these conditions. It enters into force when the account is created.</p>
        <p><strong>"Rental Contract"</strong> — the agreement established between an owner and a renter for the rental of an item, generated electronically through the platform.</p>
      </div>
    ),
  },
  {
    id: "servicii",
    title: "Platform services and their use",
    content: (
      <div className="space-y-3">
        <p>Rentli offers a digital space where owners can list items they want to rent out, and renters can search, compare and book those items. The platform facilitates communication, booking management and payment processing.</p>
        <p>Owners are responsible for the accuracy and the up-to-date nature of the information about listed items. They must comply with applicable law and ensure the items are in proper condition, as described in the listings.</p>
        <p>Renters are required to comply with the established usage conditions, pay the rental fee on the agreed terms and use the item appropriately.</p>
        <p>Rentli is not a party to the rental contract between owner and renter. The platform acts solely as an intermediary and cannot be held liable for the failure of those parties to fulfill their contractual obligations.</p>
        <p>Users are required to follow the procedures set on the platform, including those related to listing items, making bookings, payments and returning items.</p>
      </div>
    ),
  },
  {
    id: "contract",
    title: "Agreement with Rentli",
    content: (
      <div className="space-y-3">
        <p><strong>Conclusion of the agreement:</strong> By registering on the platform and accepting these conditions, the user enters into an agreement with Rentli. The agreement is formed electronically and enters into force upon account creation.</p>
        <p><strong>Purpose:</strong> Provision of the platform's services, including intermediation between owners and renters, management of bookings and payments, and technical support.</p>
        <p><strong>Validity:</strong> The agreement is valid for an indefinite period, from the date of registration until terminated by either party.</p>
        <p><strong>Termination:</strong> Either party may terminate the agreement with 15 calendar days' prior notice, sent by email.</p>
        <p><strong>Account closure:</strong> Users may close their account at any time. Closing the account does not relieve them of unfulfilled obligations (outstanding payments, damage coverage, etc.).</p>
        <p><strong>Suspension by Rentli:</strong> Rentli reserves the right to suspend or close an account, without notice, in case of breach of the usage conditions, fraudulent activity or justified complaints from other users.</p>
      </div>
    ),
  },
  {
    id: "plati",
    title: "Payments and fees",
    content: (
      <div className="space-y-3">
        <p><strong>Platform fee:</strong> Rentli charges a fee from owners and renters, which is clearly displayed at payment confirmation. The fee includes VAT in accordance with applicable law.</p>
        <p><strong>Automatic charging:</strong> Renters agree that the platform may automatically charge the associated payment method to cover rental costs, penalties or other related fees.</p>
        <p><strong>Additional costs:</strong> In situations such as late returns or damages, additional costs may apply, communicated in advance to the user.</p>
        <p><strong>Refunds:</strong> Refunds are governed by the <Link to="/politica-anulare" className="text-primary hover:underline">cancellation policy</Link>.</p>
      </div>
    ),
  },
  {
    id: "inchiriere",
    title: "Rental process",
    content: (
      <div className="space-y-3">
        <p><strong>Item selection:</strong> Renters can choose an item from the offers available on the platform, depending on their needs and preferences.</p>
        <p><strong>Booking cancellation:</strong> Free cancellation is possible at least 24 hours before the start of the rental period. For full details, see the <Link to="/politica-anulare" className="text-primary hover:underline">cancellation policy</Link>.</p>
        <p><strong>Prohibited activities:</strong> The renter may not use the item for illegal activities, extreme sports or any other use beyond the declared purpose of the rental.</p>
        <p><strong>Returning the item:</strong> The renter is required to return the item in the same condition in which it was received, on the date and time agreed. Delays or damages incur penalties.</p>
        <p><strong>Damage or loss:</strong> In case of damage or loss of the item, the renter is responsible for repair or replacement costs. The owner must notify the platform and provide evidence.</p>
        <p><strong>Force majeure:</strong> In force majeure situations (natural disasters, pandemics, restrictions imposed by authorities), the platform is not liable for failure to fulfill obligations. Users may request refunds under the cancellation policy.</p>
      </div>
    ),
  },
  {
    id: "documentare",
    title: "Documenting the item's condition",
    content: (
      <div className="space-y-3">
        <p>The platform allows users to document the item's condition by uploading photos, both at pickup and at return.</p>
        <p>It is each user's sole responsibility to upload relevant images. The platform is not liable for missing photo documentation or for the consequences of its absence.</p>
        <p>Uploaded images can serve as evidence in case of disputes about the item's condition. Each user can view only their own uploads.</p>
        <p>A maximum of 5 images can be uploaded per event (pickup or return). Images must reflect the actual condition of the item and cannot be modified afterwards.</p>
        <p>We strongly recommend photo documentation at every pickup and return. Lack of evidence may affect the fair resolution of any disputes.</p>
      </div>
    ),
  },
  {
    id: "drepturi-obligatii",
    title: "Users' rights and obligations",
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-foreground mb-2">General obligations</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Compliance with platform procedures regarding listings, bookings and payments</li>
            <li>Provision of accurate and up-to-date information in the user account</li>
            <li>Immediate notification of any changes to personal data</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-2">Renters' obligations</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Prohibition of third-party access to the rented item without the owner's consent</li>
            <li>Compliance with applicable law during the use of the item</li>
            <li>Immediate notification of the owner and authorities in case of accident or damage</li>
            <li>Returning the item in the condition in which it was received</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-2">Owners' obligations</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provision of complete and accurate information about listed items</li>
            <li>Honoring confirmed bookings and ensuring item availability</li>
            <li>Tax responsibility for income generated from rentals</li>
            <li>Warranty that the item meets applicable safety standards</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-2">Sanctions</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Financial penalties for late item returns</li>
            <li>Coverage of repair or replacement costs in case of damage</li>
            <li>Account suspension or closure for repeated breaches</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "protectia-datelor",
    title: "Personal data protection",
    content: (
      <div className="space-y-3">
        <p>Rentli processes users' personal data in accordance with the <Link to="/politica-confidentialitate" className="text-primary hover:underline">Privacy Policy</Link>.</p>
        <p>Users have the right to access, rectify or request deletion of their personal data, in accordance with applicable data protection law (GDPR).</p>
      </div>
    ),
  },
  {
    id: "limitarea-raspunderii",
    title: "Limitation of liability",
    content: (
      <div className="space-y-3">
        <p>Rentli is not liable for damages caused by users or for technical issues that occur while using the platform. The platform acts solely as an intermediary.</p>
        <p>The platform cannot be held liable for indirect damages (loss of profit, business interruption) resulting from the use or non-use of the services.</p>
        <p>Rentli does not verify the authenticity of information provided by users and is not liable for the content listed by owners (descriptions, photos, etc.).</p>
        <p>In case of damage or loss of an item during the rental period, the renter bears the full cost. The owner must provide evidence.</p>
        <p>The platform is not liable for incidents, accidents or legal breaches that occur during the use of the items. Users are solely responsible.</p>
        <p>Rentli is not liable for the reviews and feedback posted by users, which represent their personal opinions.</p>
        <p>We work with trusted third-party providers, but we cannot be held liable for any issues caused by them.</p>
      </div>
    ),
  },
  {
    id: "litigii",
    title: "Disputes and applicable law",
    content: (
      <div className="space-y-3">
        <p><strong>Amicable resolution:</strong> In case of disputes, the parties agree to attempt amicable resolution within 30 days of the issue being raised.</p>
        <p><strong>Jurisdiction:</strong> These conditions are governed by Romanian law. Disputes not resolved amicably will be submitted to the competent courts in Romania.</p>
        <p><strong>Communications:</strong> Any notices regarding disputes must be sent in writing, to the email address associated with the account or to the platform's contact address.</p>
      </div>
    ),
  },
  {
    id: "forta-majora",
    title: "Force majeure",
    content: (
      <div className="space-y-3">
        <p>Force majeure includes events independent of the parties' will: natural disasters, restrictions imposed by authorities, pandemics or other exceptional situations preventing the normal operation of the platform.</p>
        <p>In such situations, Rentli will not be liable for delays or failure to fulfill obligations. Users may request refunds under the <Link to="/politica-anulare" className="text-primary hover:underline">cancellation policy</Link>.</p>
        <p>To benefit from solutions in case of force majeure, users must provide supporting documents within 24 hours of the event.</p>
      </div>
    ),
  },
  {
    id: "modificari",
    title: "Amendments and final provisions",
    content: (
      <div className="space-y-3">
        <p>Rentli reserves the right to update these conditions at any time. Users will be notified of significant changes, and continued use of the platform constitutes acceptance of the new terms.</p>
        <p>If any provision is found to be invalid, the remaining provisions remain in force.</p>
        <p>For questions or clarifications, please contact us via the <Link to="/suport" className="text-primary hover:underline">support page</Link>.</p>
      </div>
    ),
  },
];

const TermsAndConditions = () => {
  usePageSeo({
    title: "Termeni și condiții — Rentli",
    description: "Termenii și condițiile de utilizare a platformei Rentli.",
  });
  const { language } = useLanguage();
  const isEn = language === "en";
  return (
    <LegalPageLayout
      title={isEn ? "Terms and Conditions" : "Termeni și Condiții"}
      subtitle={isEn
        ? "These conditions govern the use of the Rentli platform and the relationship between the platform, owners and renters. By using the platform, you agree to these terms."
        : "Aceste condiții reglementează utilizarea platformei Rentli și relația dintre platformă, proprietari și chiriași. Prin utilizarea platformei, sunteți de acord cu acești termeni."}
      lastUpdated="28.02.2026"
      sections={isEn ? sectionsEn : sections}
    />
  );
};

export default TermsAndConditions;
