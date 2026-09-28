import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageSeo } from "@/hooks/usePageSeo";

const Line = ({ w = "w-64" }: { w?: string }) => (
  <span className={`inline-block border-b border-foreground/50 align-baseline ${w}`} />
);

const Box = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-baseline gap-2">
    <span className="inline-block h-3.5 w-3.5 border border-foreground/60 align-middle" />
    <span>{children}</span>
  </span>
);

const ImageConsentForm = () => {
  usePageSeo({
    title: "Formular de consimțământ privind dreptul la propria imagine — Rentli",
    description:
      "Formular tipizat de consimțământ pentru prelucrarea fotografiilor și a materialelor video în care apar persoane vizate (GDPR, Codul Civil art. 73).",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 print:py-0">
      <div className="mb-8 flex items-center justify-between gap-4 print:hidden">
        <p className="text-sm text-muted-foreground">
          Tipărește formularul sau salvează-l ca PDF pentru semnare.
        </p>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Tipărește / Salvează PDF
        </Button>
      </div>

      <article className="space-y-6 rounded-2xl border border-border bg-card p-8 text-sm leading-relaxed text-foreground print:border-0 print:p-0">
        <header className="space-y-1 text-center">
          <h1 className="text-lg font-bold uppercase">
            Formular de consimțământ privind dreptul la propria imagine și prelucrarea datelor cu caracter personal
          </h1>
          <p className="text-xs text-muted-foreground">
            Operator: RENTLI 1 S.R.L., CUI 53914386, sat Valea Lupului, comuna Valea Lupului,
            str. Aleea cu Nuci nr. 42, județul Iași — platforma rentli.ro
          </p>
        </header>

        <section className="space-y-3">
          <p>
            Subsemnatul/a <Line w="w-80" />, CNP <Line w="w-52" />,
          </p>
          <p>
            domiciliat(ă) în <Line w="w-96" />,
          </p>
          <p>
            e-mail <Line w="w-64" />, telefon <Line w="w-48" />,
          </p>
          <p className="flex flex-wrap gap-6">
            în calitate de:
            <Box>Angajat / Colaborator</Box>
            <Box>Client / Utilizator</Box>
            <Box>Partener</Box>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">1. Obiectul consimțământului</h2>
          <p>
            Îmi exprim în mod liber, expres, informat și neechivoc acordul ca RENTLI 1 S.R.L. să
            colecteze, să înregistreze, să stocheze și să prelucreze imaginea mea (fotografii și/sau
            materiale video în care apar, inclusiv vocea, după caz).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">2. Scopul prelucrării (bifați ce se aplică)</h2>
          <ul className="space-y-2">
            <li><Box>Promovare pe canalele de social media Rentli (Facebook, Instagram, TikTok, LinkedIn, YouTube)</Box></li>
            <li><Box>Publicare pe website-ul https://rentli.ro și în materiale promoționale digitale sau tipărite</Box></li>
            <li><Box>Materiale interne, prezentări de companie, comunicate de presă</Box></li>
            <li><Box>Altele: <Line w="w-56" /></Box></li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">3. Durata</h2>
          <p>
            Consimțământul este acordat pentru o perioadă de <Line w="w-20" /> ani de la data
            semnării sau până la retragerea acestuia, oricare intervine prima.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">4. Drepturile persoanei vizate</h2>
          <p>
            Am luat la cunoștință că, potrivit Regulamentului (UE) 2016/679 (GDPR) și art. 73–74 din
            Codul Civil, am dreptul de acces, rectificare, ștergere, restricționare, opoziție și
            portabilitate, precum și dreptul de a-mi retrage oricând consimțământul printr-o
            solicitare scrisă la gdpr@rentli.ro. Retragerea produce efecte pentru viitor și nu
            afectează legalitatea prelucrării efectuate anterior. Am dreptul de a mă adresa
            A.N.S.P.D.C.P. (www.dataprotection.ro) și instanțelor de judecată.
          </p>
          <p>
            Prelucrarea nu este condiționată de acest acord: refuzul nu îmi afectează relația
            contractuală sau de muncă cu operatorul.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-8 pt-6">
          <p>Data: <Line w="w-36" /></p>
          <p>Semnătura: <Line w="w-36" /></p>
        </section>
      </article>
    </div>
  );
};

export default ImageConsentForm;
