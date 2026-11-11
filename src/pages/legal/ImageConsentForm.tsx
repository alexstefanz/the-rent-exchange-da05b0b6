import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();
  usePageSeo({
    title: t("Formular de consimțământ privind dreptul la propria imagine — Rentli", "Consent form regarding the right to one's own image — Rentli"),
    description: t(
      "Formular tipizat de consimțământ pentru prelucrarea fotografiilor și a materialelor video în care apar persoane vizate (GDPR, Codul Civil art. 73).", "Standard consent form for processing photos and videos featuring data subjects (GDPR, Romanian Civil Code art. 73)."),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 print:py-0">
      <div className="mb-8 flex items-center justify-between gap-4 print:hidden">
        <p className="text-sm text-muted-foreground">
          {t("Tip\u0103re\u0219te formularul sau salveaz\u0103-l ca PDF pentru semnare.", "Print the form or save it as PDF for signing.")}
        </p>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          {t("Tip\u0103re\u0219te / Salveaz\u0103 PDF", "Print / Save PDF")}
        </Button>
      </div>

      <article className="space-y-6 rounded-2xl border border-border bg-card p-8 text-sm leading-relaxed text-foreground print:border-0 print:p-0">
        <header className="space-y-1 text-center">
          <h1 className="text-lg font-bold uppercase">
            {t("Formular de consim\u021b\u0103m\u00e2nt privind dreptul la propria imagine \u0219i prelucrarea datelor cu caracter personal", "Consent form regarding the right to one's own image and the processing of personal data")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t("Operator: RENTLI 1 S.R.L., CUI 53914386, sat Valea Lupului, comuna Valea Lupului,\n            str. Aleea cu Nuci nr. 42, jude\u021bul Ia\u0219i \u2014 platforma rentli.ro", "Controller: RENTLI 1 S.R.L., CUI 53914386, Valea Lupului village, Valea Lupului commune, 42 Aleea cu Nuci St., Ia\u0219i County \u2014 rentli.ro platform")}
          </p>
        </header>

        <section className="space-y-3">
          <p>
            {t("Subsemnatul/a", "I, the undersigned")} <Line w="w-80" />, {t("CNP", "Personal ID no.")} <Line w="w-52" />,
          </p>
          <p>
            {t("domiciliat(ă) în", "residing at")} <Line w="w-96" />,
          </p>
          <p>
            e-mail <Line w="w-64" />, {t("telefon", "phone")} <Line w="w-48" />,
          </p>
          <p className="flex flex-wrap gap-6">
            {t("în calitate de:", "acting as:")}
            <Box>{t("Angajat / Colaborator", "Employee / Collaborator")}</Box>
            <Box>{t("Client / Utilizator", "Customer / User")}</Box>
            <Box>{t("Partener", "Partner")}</Box>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">{t("1. Obiectul consim\u021b\u0103m\u00e2ntului", "1. Subject of consent")}</h2>
          <p>
            {t("\u00cemi exprim \u00een mod liber, expres, informat \u0219i neechivoc acordul ca RENTLI 1 S.R.L. s\u0103\n            colecteze, s\u0103 \u00eenregistreze, s\u0103 stocheze \u0219i s\u0103 prelucreze imaginea mea (fotografii \u0219i/sau\n            materiale video \u00een care apar, inclusiv vocea, dup\u0103 caz).", "I freely, expressly, knowingly and unambiguously agree that RENTLI 1 S.R.L. may collect, record, store and process my image (photos and/or videos in which I appear, including my voice, where applicable).")}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">{t("2. Scopul prelucr\u0103rii (bifa\u021bi ce se aplic\u0103)", "2. Purpose of processing (tick as applicable)")}</h2>
          <ul className="space-y-2">
            <li><Box>{t("Promovare pe canalele de social media Rentli (Facebook, Instagram, TikTok, LinkedIn, YouTube)", "Promotion on Rentli social media channels (Facebook, Instagram, TikTok, LinkedIn, YouTube)")}</Box></li>
            <li><Box>{t("Publicare pe website-ul https://rentli.ro \u0219i \u00een materiale promo\u021bionale digitale sau tip\u0103rite", "Publication on the https://rentli.ro website and in digital or printed promotional materials")}</Box></li>
            <li><Box>{t("Materiale interne, prezent\u0103ri de companie, comunicate de pres\u0103", "Internal materials, company presentations, press releases")}</Box></li>
            <li><Box>{t("Altele:", "Other:")} <Line w="w-56" /></Box></li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">{t("3. Durata", "3. Duration")}</h2>
          <p>
            {t("Consimțământul este acordat pentru o perioadă de", "Consent is given for a period of")} <Line w="w-20" /> {t("ani de la data semnării sau până la retragerea acestuia, oricare intervine prima.", "years from the date of signing or until withdrawn, whichever comes first.")}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">{t("4. Drepturile persoanei vizate", "4. Rights of the data subject")}</h2>
          <p>
            {t("Am luat la cuno\u0219tin\u021b\u0103 c\u0103, potrivit Regulamentului (UE) 2016/679 (GDPR) \u0219i art. 73\u201374 din\n            Codul Civil, am dreptul de acces, rectificare, \u0219tergere, restric\u021bionare, opozi\u021bie \u0219i\n            portabilitate, precum \u0219i dreptul de a-mi retrage oric\u00e2nd consim\u021b\u0103m\u00e2ntul printr-o\n            solicitare scris\u0103 la gdpr@rentli.ro. Retragerea produce efecte pentru viitor \u0219i nu\n            afecteaz\u0103 legalitatea prelucr\u0103rii efectuate anterior. Am dreptul de a m\u0103 adresa\n            A.N.S.P.D.C.P. (www.dataprotection.ro) \u0219i instan\u021belor de judecat\u0103.", "I acknowledge that, under Regulation (EU) 2016/679 (GDPR) and art. 73\u201374 of the Romanian Civil Code, I have the right of access, rectification, erasure, restriction, objection and portability, as well as the right to withdraw my consent at any time by written request to gdpr@rentli.ro. Withdrawal takes effect for the future and does not affect the lawfulness of prior processing. I have the right to complain to the A.N.S.P.D.C.P. (www.dataprotection.ro) and to go to court.")}
          </p>
          <p>
            {t("Prelucrarea nu este condi\u021bionat\u0103 de acest acord: refuzul nu \u00eemi afecteaz\u0103 rela\u021bia\n            contractual\u0103 sau de munc\u0103 cu operatorul.", "My contractual or employment relationship with the controller is not conditional on this consent: refusal does not affect it.")}
          </p>
        </section>

        <section className="grid grid-cols-2 gap-8 pt-6">
          <p>{t("Data:", "Date:")} <Line w="w-36" /></p>
          <p>{t("Semnătura:", "Signature:")} <Line w="w-36" /></p>
        </section>
      </article>
    </div>
  );
};

export default ImageConsentForm;
