import { Link } from "react-router-dom";
import LegalPageLayout from "./LegalPageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageSeo } from "@/hooks/usePageSeo";

const sectionsRo = [
  {
    id: "anulare-chiriasi",
    title: "Politica de anulare pentru chiriași",
    content: (
      <div className="space-y-4">
        <p>Chiriașii pot anula o rezervare <strong>doar înainte de predarea produsului</strong> (semnarea procesului verbal de predare). După predare, anularea nu mai este posibilă — există doar opțiunea de deschidere a unei dispute sau contactarea echipei de suport.</p>
        <p>Eligibilitatea pentru rambursare depinde de momentul anulării raportat la ora de start a rezervării:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg">
            <thead>
              <tr className="bg-secondary/50">
                <th className="text-left p-3 font-semibold border-b border-border">Momentul anulării</th>
                <th className="text-left p-3 font-semibold border-b border-border">Rambursare</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="p-3">Cu 24 de ore sau mai mult înainte de începere</td>
                <td className="p-3 text-green-600 font-medium">Rambursare integrală (subtotal + comision platformă)</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3">Cu mai puțin de 24h înainte de începere</td>
                <td className="p-3 text-amber-600 font-medium">Rambursare = subtotal − 1 zi − comisionul platformei</td>
              </tr>
              <tr>
                <td className="p-3">După predarea produsului (semnarea PV de predare)</td>
                <td className="p-3 text-destructive font-medium">Anulare blocată — folosește dispută sau contactează suportul</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm"><strong>Excepție:</strong> se acordă rambursare integrală dacă bunul nu corespunde descrierii sau prezintă defecte majore. Chiriașul trebuie să notifice proprietarul și platforma în maximum 30 de minute de la preluare, furnizând dovezi (fotografii, video, descriere detaliată).</p>
        <p className="text-sm"><strong>Returnare anticipată:</strong> momentan opțiunea de returnare anticipată este suspendată. După predare, închirierea continuă conform termenului convenit. Pentru situații excepționale, contactează echipa de suport.</p>
      </div>
    ),
  },
  {
    id: "forta-majora-chiriasi",
    title: "Circumstanțe excepționale (forță majoră) — chiriași",
    content: (
      <div className="space-y-3">
        <p>În situații neprevăzute, chiriașii pot solicita rambursare integrală chiar și cu mai puțin de 24 de ore înainte. Situații acceptate:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Probleme medicale grave (accident, spitalizare, boală gravă)</li>
          <li>Dezastre naturale care afectează zona de preluare sau destinația</li>
          <li>Restricții de deplasare impuse de autorități (carantină, interdicții de circulație)</li>
        </ul>
        <p>Cererea trebuie transmisă în maximum 24 de ore de la eveniment, însoțită de documente justificative (certificat medical, dovadă a restricțiilor etc.), prin <Link to="/suport" className="text-primary hover:underline">pagina de suport</Link>.</p>
      </div>
    ),
  },
  {
    id: "anulare-proprietari",
    title: "Politica de anulare pentru proprietari",
    content: (
      <div className="space-y-4">
        <p>Proprietarii sunt obligați să respecte toate rezervările confirmate. Anulările repetate afectează reputația și vizibilitatea anunțurilor.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg">
            <thead>
              <tr className="bg-secondary/50">
                <th className="text-left p-3 font-semibold border-b border-border">Rata de anulare</th>
                <th className="text-left p-3 font-semibold border-b border-border">Penalitate</th>
                <th className="text-left p-3 font-semibold border-b border-border">Impact vizibilitate</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="p-3">Sub 4%</td>
                <td className="p-3 text-green-600">Fără penalitate</td>
                <td className="p-3">Fără impact</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3">4% – 6%</td>
                <td className="p-3 text-amber-600">125 RON per anulare</td>
                <td className="p-3">Reducere ușoară</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3">6% – 10%</td>
                <td className="p-3 text-amber-600">250 RON per anulare</td>
                <td className="p-3">Reducere semnificativă</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3">Peste 10%</td>
                <td className="p-3 text-destructive">Suspendare 30 zile + 250 RON/anulare</td>
                <td className="p-3">Anunțul nu mai apare</td>
              </tr>
              <tr>
                <td className="p-3">Peste 20%</td>
                <td className="p-3 text-destructive">Eliminare permanentă</td>
                <td className="p-3">Cont dezactivat</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm">Dacă proprietarul anulează în prima oră de la efectuarea rezervării, nu i se aplică penalități.</p>
        <div>
          <h4 className="font-semibold text-foreground mb-2">Situații excepționale (fără penalizare):</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Bunul a fost avariat și nu mai poate fi utilizat</li>
            <li>Probleme grave de sănătate ale proprietarului</li>
            <li>Evenimente de forță majoră</li>
          </ul>
          <p className="mt-2 text-sm">Dovezile trebuie furnizate în 24 de ore prin <Link to="/suport" className="text-primary hover:underline">pagina de suport</Link>.</p>
        </div>
      </div>
    ),
  },
  {
    id: "proces-rambursare",
    title: "Procesul de rambursare",
    content: (
      <div className="space-y-3">
        <p>Dacă sunteți eligibil pentru rambursare, suma va fi returnată în contul dumneavoastră în 3–5 zile lucrătoare de la confirmarea anulării. În funcție de banca dumneavoastră, tranzacția poate apărea în extras în maximum 10 zile lucrătoare.</p>
        <p>Dacă rambursarea nu este vizibilă după această perioadă, vă recomandăm să contactați banca. Pentru probleme suplimentare, accesați <Link to="/suport" className="text-primary hover:underline">pagina de suport</Link>.</p>
        <p className="text-sm italic">Penalitățile și sumele aferente se aplică conform politicilor platformei, care pot fi actualizate periodic. Prin utilizarea platformei, acceptați acest proces.</p>
      </div>
    ),
  },
  {
    id: "taxe",
    title: "Taxele platformei",
    content: (
      <p>Comisioanele percepute de platformă nu sunt rambursabile, cu excepția situațiilor în care anularea este cauzată de o problemă majoră din partea proprietarului sau de un eveniment de forță majoră. În aceste cazuri, comisioanele pot fi returnate integral sau parțial.</p>
    ),
  },
  {
    id: "contact",
    title: "Contact și asistență",
    content: (
      <div className="space-y-3">
        <p>Înainte de a ne contacta, vă recomandăm să consultați <Link to="/intrebari-frecvente" className="text-primary hover:underline">întrebările frecvente</Link>.</p>
        <p>Pentru solicitări directe, accesați <Link to="/suport" className="text-primary hover:underline">pagina de suport</Link> unde puteți trimite un mesaj echipei noastre.</p>
      </div>
    ),
  },
];

const sectionsEn = [
  {
    id: "anulare-chiriasi",
    title: "Cancellation policy for renters",
    content: (
      <div className="space-y-4">
        <p>Renters can cancel a booking <strong>only before the item is handed over</strong> (handover PV signed). After handover, cancellation is no longer available — only opening a dispute or contacting support.</p>
        <p>Refund eligibility depends on when the cancellation is made relative to the booking start time:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg">
            <thead>
              <tr className="bg-secondary/50">
                <th className="text-left p-3 font-semibold border-b border-border">Cancellation timing</th>
                <th className="text-left p-3 font-semibold border-b border-border">Refund</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="p-3">24 hours or more before start</td>
                <td className="p-3 text-green-600 font-medium">Full refund (subtotal + platform fee)</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3">Less than 24h before start</td>
                <td className="p-3 text-amber-600 font-medium">Refund = subtotal − 1 day − platform fee</td>
              </tr>
              <tr>
                <td className="p-3">After the item is handed over (handover PV signed)</td>
                <td className="p-3 text-destructive font-medium">Cancellation locked — use dispute or contact support</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm"><strong>Exception:</strong> a full refund is granted if the item does not match the description or has major defects. The renter must notify the owner and the platform within 30 minutes of pickup, providing evidence (photos, videos, detailed description).</p>
        <p className="text-sm"><strong>Early return:</strong> this option is currently suspended. After handover, the rental continues as agreed. For exceptional situations, contact the support team.</p>
      </div>
    ),
  },
  {
    id: "forta-majora-chiriasi",
    title: "Exceptional circumstances (force majeure) — renters",
    content: (
      <div className="space-y-3">
        <p>In unforeseen situations, renters may request a full refund even with less than 24 hours notice. Accepted situations:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Serious medical issues (accident, hospitalization, severe illness)</li>
          <li>Natural disasters affecting the pickup area or destination</li>
          <li>Travel restrictions imposed by authorities (quarantine, movement bans)</li>
        </ul>
        <p>The request must be submitted within 24 hours of the event, accompanied by supporting documents (medical certificate, proof of restrictions, etc.), via the <Link to="/suport" className="text-primary hover:underline">support page</Link>.</p>
      </div>
    ),
  },
  {
    id: "anulare-proprietari",
    title: "Cancellation policy for owners",
    content: (
      <div className="space-y-4">
        <p>Owners are required to honor all confirmed bookings. Repeated cancellations affect the reputation and visibility of listings.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg">
            <thead>
              <tr className="bg-secondary/50">
                <th className="text-left p-3 font-semibold border-b border-border">Cancellation rate</th>
                <th className="text-left p-3 font-semibold border-b border-border">Penalty</th>
                <th className="text-left p-3 font-semibold border-b border-border">Visibility impact</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="p-3">Below 4%</td>
                <td className="p-3 text-green-600">No penalty</td>
                <td className="p-3">No impact</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3">4% – 6%</td>
                <td className="p-3 text-amber-600">125 RON per cancellation</td>
                <td className="p-3">Slight reduction</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3">6% – 10%</td>
                <td className="p-3 text-amber-600">250 RON per cancellation</td>
                <td className="p-3">Significant reduction</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3">Above 10%</td>
                <td className="p-3 text-destructive">30-day suspension + 250 RON/cancellation</td>
                <td className="p-3">Listing no longer shown</td>
              </tr>
              <tr>
                <td className="p-3">Above 20%</td>
                <td className="p-3 text-destructive">Permanent removal</td>
                <td className="p-3">Account deactivated</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm">If the owner cancels within the first hour after the booking is made, no penalty applies.</p>
        <div>
          <h4 className="font-semibold text-foreground mb-2">Exceptional situations (no penalty):</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>The item has been damaged and can no longer be used</li>
            <li>Serious health problems of the owner</li>
            <li>Force majeure events</li>
          </ul>
          <p className="mt-2 text-sm">Evidence must be provided within 24 hours via the <Link to="/suport" className="text-primary hover:underline">support page</Link>.</p>
        </div>
      </div>
    ),
  },
  {
    id: "proces-rambursare",
    title: "Refund process",
    content: (
      <div className="space-y-3">
        <p>If you are eligible for a refund, the amount will be returned to your account within 3–5 business days from the cancellation confirmation. Depending on your bank, the transaction may appear in your statement within up to 10 business days.</p>
        <p>If the refund is not visible after this period, we recommend contacting your bank. For further issues, visit the <Link to="/suport" className="text-primary hover:underline">support page</Link>.</p>
        <p className="text-sm italic">Penalties and related amounts apply according to the platform's policies, which may be updated periodically. By using the platform, you accept this process.</p>
      </div>
    ),
  },
  {
    id: "taxe",
    title: "Platform fees",
    content: (
      <p>Fees charged by the platform are non-refundable, except in cases where the cancellation is caused by a major issue on the owner's side or by a force majeure event. In those cases, fees may be refunded in full or in part.</p>
    ),
  },
  {
    id: "contact",
    title: "Contact and support",
    content: (
      <div className="space-y-3">
        <p>Before contacting us, we recommend checking the <Link to="/intrebari-frecvente" className="text-primary hover:underline">frequently asked questions</Link>.</p>
        <p>For direct requests, visit the <Link to="/suport" className="text-primary hover:underline">support page</Link> where you can send a message to our team.</p>
      </div>
    ),
  },
];

const CancellationPolicy = () => {
  usePageSeo({
    title: "Politica de anulare — Rentli",
    description: "Regulile de anulare și rambursare pentru rezervările făcute pe Rentli.",
  });
  const { language } = useLanguage();
  const isEn = language === "en";
  return (
    <LegalPageLayout
      title={isEn ? "Cancellation and Refund Policy" : "Politica de Anulare și Rambursare"}
      subtitle={isEn
        ? "This policy governs the cancellation and refund conditions for users of the Rentli platform, both renters and owners."
        : "Această politică reglementează condițiile de anulare și rambursare pentru utilizatorii platformei Rentli, atât pentru chiriași, cât și pentru proprietari."}
      lastUpdated="28.02.2026"
      sections={isEn ? sectionsEn : sectionsRo}
    />
  );
};

export default CancellationPolicy;
