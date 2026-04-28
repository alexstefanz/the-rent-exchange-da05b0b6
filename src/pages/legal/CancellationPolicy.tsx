import { Link } from "react-router-dom";
import LegalPageLayout from "./LegalPageLayout";

const sections = [
  {
    id: "anulare-chiriasi",
    title: "Politica de anulare pentru chiriași",
    content: (
      <div className="space-y-4">
        <p>Chiriașii pot anula o rezervare în orice moment. Eligibilitatea pentru rambursare depinde de momentul anulării raportat la ora de start a rezervării:</p>
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
                <td className="p-3">În prima oră de la efectuarea rezervării</td>
                <td className="p-3 text-green-600 font-medium">Rambursare integrală</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3">Cu 48 de ore sau mai mult înainte de începere</td>
                <td className="p-3 text-green-600 font-medium">Rambursare integrală</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3">Cu mai puțin de 48 de ore înainte</td>
                <td className="p-3 text-amber-600 font-medium">Rambursare 50%</td>
              </tr>
              <tr>
                <td className="p-3">După începerea perioadei de închiriere</td>
                <td className="p-3 text-destructive font-medium">Fără rambursare</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm"><strong>Excepție:</strong> se acordă rambursare integrală dacă bunul nu corespunde descrierii sau prezintă defecte majore. Chiriașul trebuie să notifice proprietarul și platforma în maximum 30 de minute de la preluare, furnizând dovezi (fotografii, videoclipuri, descriere detaliată a problemelor).</p>
      </div>
    ),
  },
  {
    id: "forta-majora-chiriasi",
    title: "Circumstanțe excepționale (forță majoră) — chiriași",
    content: (
      <div className="space-y-3">
        <p>În situații neprevăzute, chiriașii pot solicita rambursare integrală chiar și cu mai puțin de 48 de ore înainte. Situații acceptate:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Probleme medicale grave (accident, spitalizare, boală gravă)</li>
          <li>Dezastre naturale care afectează zona de preluare sau destinația</li>
          <li>Restricții de deplasare impuse de autorități (carantină, interdicții de circulație)</li>
        </ul>
        <p>Cererea trebuie transmisă în maximum 24 de ore de la eveniment, însoțită de documente justificative (certificat medical, dovadă a restricțiilor etc.), prin <Link to="/centru-asistenta" className="text-primary hover:underline">pagina de suport</Link>.</p>
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
          <p className="mt-2 text-sm">Dovezile trebuie furnizate în 24 de ore prin <Link to="/centru-asistenta" className="text-primary hover:underline">pagina de suport</Link>.</p>
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
        <p>Dacă rambursarea nu este vizibilă după această perioadă, vă recomandăm să contactați banca. Pentru probleme suplimentare, accesați <Link to="/centru-asistenta" className="text-primary hover:underline">pagina de suport</Link>.</p>
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
        <p>Înainte de a ne contacta, vă recomandăm să consultați <Link to="/centru-asistenta" className="text-primary hover:underline">centrul de asistență</Link> pentru răspunsuri la cele mai frecvente întrebări.</p>
        <p>Pentru solicitări directe, accesați <Link to="/suport" className="text-primary hover:underline">pagina de suport</Link> unde puteți trimite un mesaj echipei noastre.</p>
      </div>
    ),
  },
];

const CancellationPolicy = () => (
  <LegalPageLayout
    title="Politica de Anulare și Rambursare"
    subtitle="Această politică reglementează condițiile de anulare și rambursare pentru utilizatorii platformei Rentli, atât pentru chiriași, cât și pentru proprietari."
    lastUpdated="28.02.2026"
    sections={sections}
  />
);

export default CancellationPolicy;
