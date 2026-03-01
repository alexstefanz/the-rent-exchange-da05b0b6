import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, HelpCircle, Search, LifeBuoy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FaqItem[] = [
  // General
  {
    category: "General",
    question: "Ce este Rentli și cum funcționează?",
    answer:
      "Rentli este o platformă digitală care pune în legătură persoanele care dețin diverse obiecte cu cele care au nevoie să le folosească temporar. Aici poți închiria o gamă largă de bunuri — de la echipamente sportive și electronice, până la unelte, vehicule și multe altele. Platforma simplifică tot procesul: căutarea, rezervarea, comunicarea și plata.",
  },
  {
    category: "General",
    question: "Cum îmi creez un cont pe Rentli?",
    answer:
      "Crearea contului este rapidă și gratuită. Accesează pagina de înregistrare, completează adresa de email și alege o parolă. Vei primi un email de confirmare pentru activarea contului. După verificare, poți începe imediat să folosești platforma.",
  },
  {
    category: "General",
    question: "De ce este necesară verificarea identității?",
    answer:
      "Verificarea identității asigură un mediu sigur pentru toți utilizatorii. Acest proces ajută la prevenirea fraudelor, protejează bunurile proprietarilor și oferă încredere reciprocă între cei care închiriază și cei care oferă obiecte spre închiriere.",
  },
  // Închiriere
  {
    category: "Închiriere",
    question: "Cum găsesc obiectele pe care vreau să le închiriez?",
    answer:
      "Folosește bara de căutare de pe pagina principală sau navighează prin categoriile disponibile. Poți filtra rezultatele după locație, preț sau tip de obiect pentru a găsi exact ce ai nevoie.",
  },
  {
    category: "Închiriere",
    question: "Care sunt pașii pentru a face o rezervare?",
    answer:
      "Selectează obiectul dorit, alege perioada de închiriere, verifică disponibilitatea și trimite cererea de rezervare. Proprietarul va confirma sau va refuza cererea, iar tu vei fi notificat prin email și pe platformă.",
  },
  {
    category: "Închiriere",
    question: "Ce acte sau documente îmi trebuie pentru a închiria?",
    answer:
      "În general, este suficient un cont verificat pe platformă. Pentru anumite categorii de obiecte (de exemplu, vehicule), proprietarul poate solicita documente suplimentare precum act de identitate sau permis de conducere.",
  },
  {
    category: "Închiriere",
    question: "De unde ridic și unde returnez obiectul?",
    answer:
      "Locul de predare și returnare este stabilit de proprietar și afișat în anunț. De obicei, este la adresa indicată de proprietar. Detaliile exacte se discută prin mesageria platformei înainte de începerea închirierii.",
  },
  {
    category: "Închiriere",
    question: "În ce condiție trebuie să înapoiez obiectul?",
    answer:
      "Obiectul trebuie returnat în aceeași stare în care l-ai primit. Orice daună sau uzură excesivă care depășește utilizarea normală poate atrage costuri suplimentare, conform politicii platformei.",
  },
  {
    category: "Închiriere",
    question: "Pot să renunț la o rezervare? Cum obțin banii înapoi?",
    answer:
      'Da, poți anula o rezervare conform politicii noastre de anulare. Condițiile de rambursare depind de momentul anulării față de data de început a închirierii. Verifică pagina "Politica de anulare" pentru detalii complete.',
  },
  {
    category: "Închiriere",
    question: "Ce se întâmplă dacă nu returnez obiectul la timp?",
    answer:
      "Întârzierile pot genera costuri suplimentare. Este important să comunici cu proprietarul dacă întâmpini dificultăți în respectarea termenului. Platforma facilitează comunicarea pentru a rezolva eventualele situații.",
  },
  // Proprietari
  {
    category: "Proprietari",
    question: "Cum îmi public obiectele pentru închiriere?",
    answer:
      'Accesează secțiunea "Adaugă anunț" din contul tău, completează detaliile obiectului (titlu, descriere, fotografii, preț pe zi, locație) și publică anunțul. Acesta va fi vizibil imediat pe platformă.',
  },
  {
    category: "Proprietari",
    question: "De ce documente am nevoie pentru a lista obiecte?",
    answer:
      "Pentru a lista obiecte, ai nevoie de un cont verificat. În funcție de categoria obiectului, pot fi necesare documente suplimentare care atestă proprietatea sau dreptul de utilizare.",
  },
  {
    category: "Proprietari",
    question: "Cât pot câștiga din închirierea obiectelor mele?",
    answer:
      "Câștigurile depind de tipul obiectului, cererea din piață și prețul stabilit. Platforma percepe un comision din fiecare tranzacție, iar restul sumei îți revine integral. Poți consulta secțiunea de câștiguri din profilul tău.",
  },
  {
    category: "Proprietari",
    question: "Cum administrez cererile de rezervare?",
    answer:
      "Toate cererile de rezervare apar în panoul tău de control. Poți accepta sau refuza fiecare cerere, comunica cu chiriașul și urmări statusul fiecărei închirieri în timp real.",
  },
  {
    category: "Proprietari",
    question: "Am dreptul să refuz o cerere de rezervare?",
    answer:
      "Da, ca proprietar ai libertatea de a accepta sau refuza orice cerere. Totuși, un număr mare de refuzuri poate afecta vizibilitatea anunțului tău pe platformă.",
  },
  // Cont
  {
    category: "Cont",
    question: "Cum îmi verific contul și identitatea?",
    answer:
      "Accesează secțiunea de verificare din profilul tău și urmează pașii indicați. Procesul implică de obicei încărcarea unui document de identitate și, în unele cazuri, o verificare suplimentară.",
  },
  {
    category: "Cont",
    question: "Cum adaug sau modific metoda de plată?",
    answer:
      'Intră în setările contului, secțiunea "Plăți", și adaugă sau actualizează datele cardului sau ale metodei de plată preferate. Toate datele sunt criptate și securizate.',
  },
  {
    category: "Cont",
    question: "Cum îmi actualizez parola sau informațiile personale?",
    answer:
      "Din pagina de profil poți modifica parola, adresa de email, numărul de telefon și alte informații personale. Modificările sunt salvate imediat.",
  },
  {
    category: "Cont",
    question: "Am uitat parola. Ce pot face?",
    answer:
      'Pe pagina de autentificare, apasă pe "Am uitat parola". Vei primi un email cu un link de resetare. Urmează instrucțiunile pentru a seta o parolă nouă.',
  },
  // Plăți
  {
    category: "Plăți",
    question: "Ce taxe sau comisioane se aplică?",
    answer:
      "Platforma percepe un comision din fiecare tranzacție, care acoperă costurile de operare, suport și asigurare. Comisionul exact este afișat transparent înainte de confirmarea fiecărei rezervări.",
  },
  {
    category: "Plăți",
    question: "Cum funcționează garanția/depozitul de securitate?",
    answer:
      "Pentru anumite obiecte, poate fi solicitat un depozit de garanție care se blochează la momentul rezervării. Acesta se restituie integral după returnarea obiectului în bună stare.",
  },
  {
    category: "Plăți",
    question: "Când și cum primesc veniturile din închirieri?",
    answer:
      "Veniturile sunt transferate în contul tău bancar după finalizarea cu succes a fiecărei închirieri. Timpul de procesare poate varia în funcție de metoda de plată aleasă.",
  },
  {
    category: "Plăți",
    question: "Ce se întâmplă dacă chiriașul nu achită suma?",
    answer:
      "Platforma gestionează plățile în avans, deci proprietarul este protejat. Dacă apare o problemă cu plata, echipa de suport intervine pentru a rezolva situația.",
  },
  // Siguranță
  {
    category: "Siguranță",
    question: "Obiectele închiriate beneficiază de asigurare?",
    answer:
      "Platforma oferă un nivel de bază de protecție pentru obiectele închiriate. Pentru bunuri de valoare mare, recomandăm proprietarilor să verifice opțiunile suplimentare de asigurare disponibile.",
  },
  {
    category: "Siguranță",
    question: "Ce se întâmplă dacă obiectul este deteriorat în timpul utilizării?",
    answer:
      "În caz de deteriorare, chiriașul este responsabil pentru reparație sau înlocuire, conform termenilor acceptați la momentul rezervării. Platforma mediază procesul de rezolvare între părți.",
  },
  {
    category: "Siguranță",
    question: "Cum semnalizez o problemă cu un obiect sau utilizator?",
    answer:
      'Folosește butonul "Raportează" disponibil pe pagina obiectului sau profilul utilizatorului, ori contactează echipa de suport. Fiecare raportare este analizată cu prioritate.',
  },
  {
    category: "Siguranță",
    question: "Ce fac dacă obiectul este pierdut sau furat?",
    answer:
      "Contactează imediat echipa de suport și depune o plângere la autoritățile competente. Platforma va lucra cu ambele părți pentru a găsi o soluție echitabilă.",
  },
  {
    category: "Siguranță",
    question: "Cum pot verifica dacă un utilizator este de încredere?",
    answer:
      "Consultă profilul utilizatorului — verifică recenziile primite, badge-urile de verificare și istoricul pe platformă. Utilizatorii verificați au un indicator special pe profil.",
  },
  // Suport
  {
    category: "Suport",
    question: "Nu primesc notificări sau emailuri de la platformă",
    answer:
      "Verifică folderul de spam din căsuța de email. Asigură-te că notificările sunt activate în setările contului tău. Dacă problema persistă, contactează echipa de suport.",
  },
  {
    category: "Suport",
    question: "Platforma nu funcționează corect pe dispozitivul meu",
    answer:
      "Încearcă să actualizezi browserul sau să ștergi memoria cache. Platforma funcționează optim pe ultimele versiuni ale browserelor populare. Dacă problema persistă, contactează suportul.",
  },
  {
    category: "Suport",
    question: "Cum folosesc filtrele de căutare?",
    answer:
      "Pe pagina de căutare, ai la dispoziție filtre pentru categorie, locație și preț. Aplică filtrele dorite pentru a restrânge rezultatele la obiectele care te interesează.",
  },
  {
    category: "Suport",
    question: "Cum funcționează sistemul de mesagerie al platformei?",
    answer:
      "Mesageria integrată îți permite să comunici direct cu proprietarii sau chiriașii, fără a fi nevoie să partajezi date personale de contact. Toate mesajele sunt stocate în siguranță pe platformă.",
  },
  // Juridic
  {
    category: "Juridic",
    question: "Care sunt regulile de utilizare ale platformei?",
    answer:
      "Termenii și condițiile complete sunt disponibile pe pagina dedicată. Aceștia acoperă drepturile și obligațiile tuturor utilizatorilor, politicile de plată, anulare și protecția datelor.",
  },
  {
    category: "Juridic",
    question: "Cum sunt protejate datele mele personale?",
    answer:
      "Datele tale sunt prelucrate conform legislației GDPR și politicii noastre de confidențialitate. Folosim criptare și măsuri de securitate avansate pentru protecția informațiilor tale.",
  },
  {
    category: "Juridic",
    question: "Cum îmi șterg contul în mod definitiv?",
    answer:
      "Poți solicita ștergerea contului din setările profilului sau contactând echipa de suport. Toate datele tale vor fi eliminate definitiv conform politicii de confidențialitate.",
  },
];

const categoryList = [
  "Toate",
  "General",
  "Închiriere",
  "Proprietari",
  "Cont",
  "Plăți",
  "Siguranță",
  "Suport",
  "Juridic",
];

const FAQ = () => {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("Toate");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = faqData.filter((item) => {
    const matchesCategory =
      activeCategory === "Toate" || item.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (cat: string) =>
    cat === "Toate"
      ? faqData.length
      : faqData.filter((f) => f.category === cat).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border-b border-border">
        <div className="container py-10 md:py-16">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground transition-colors">
              {t("Acasă", "Home")}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">
              {t("Întrebări frecvente", "FAQ")}
            </span>
          </div>
          <div className="flex items-start gap-4">
            <div className="hidden md:flex h-14 w-14 rounded-2xl bg-primary/10 items-center justify-center shrink-0">
              <HelpCircle className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-heading font-bold text-foreground">
                {t("Întrebări frecvente", "Frequently Asked Questions")}
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                {t(
                  "Găsește rapid răspunsurile la cele mai frecvente întrebări despre platforma noastră",
                  "Quickly find answers to the most common questions about our platform"
                )}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="mt-6 max-w-lg relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("Caută în întrebări...", "Search questions...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8 md:py-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar categories */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <Card className="p-4">
                <h3 className="font-heading font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">
                  {t("Categorii", "Categories")}
                </h3>
                <nav className="space-y-1">
                  {categoryList.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`w-full text-left text-sm py-2 px-3 rounded-md transition-colors flex items-center justify-between ${
                        activeCategory === cat
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <span>{cat}</span>
                      <Badge variant="secondary" className="text-xs h-5 min-w-[24px] justify-center">
                        {getCategoryCount(cat)}
                      </Badge>
                    </button>
                  ))}
                </nav>
              </Card>
            </div>
          </aside>

          {/* Mobile category pills */}
          <div className="flex flex-wrap gap-2 lg:hidden">
            {categoryList.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {cat} ({getCategoryCount(cat)})
              </button>
            ))}
          </div>

          {/* FAQ accordion */}
          <div>
            {activeCategory !== "Toate" && (
              <h2 className="text-lg font-heading font-semibold mb-4">
                {activeCategory}
              </h2>
            )}

            {filtered.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  {t(
                    "Nu am găsit rezultate. Încearcă alte cuvinte cheie.",
                    "No results found. Try different keywords."
                  )}
                </p>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {filtered.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="border rounded-lg px-5 bg-card"
                  >
                    <AccordionTrigger className="hover:no-underline text-left">
                      <span className="flex items-center gap-3">
                        {activeCategory === "Toate" && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {item.category}
                          </Badge>
                        )}
                        <span className="font-medium text-sm">
                          {item.question}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-sm">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}

            {/* CTA */}
            <Card className="mt-10 p-6 md:p-8 text-center bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
              <LifeBuoy className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-heading font-semibold mb-2">
                {t("Ai nevoie de ajutor suplimentar?", "Need more help?")}
              </h3>
              <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                {t(
                  "Nu ai găsit răspunsul pe care îl căutai? Echipa noastră de suport este aici pentru tine.",
                  "Couldn't find your answer? Our support team is here for you."
                )}
              </p>
              <Button asChild>
                <Link to="/suport">
                  {t("Contactează suportul", "Contact Support")}
                </Link>
              </Button>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FAQ;
