/**
 * Hand-written, unique SEO copy per top-level category.
 * Keeps category pages from sharing a near-duplicate meta description.
 * Descriptions stay under ~155 characters.
 */

export interface CategorySeoCopy {
  /** Short keyword phrase used in the <title>, in Romanian. */
  titleKeyword: string;
  titleKeywordEn: string;
  description: string;
  descriptionEn: string;
}

export const categorySeoCopy: Record<string, CategorySeoCopy> = {
  unelte: {
    titleKeyword: "Unelte și scule",
    titleKeywordEn: "Tools & power tools",
    description:
      "Bormașini, rotopercutoare, betoniere, lasere de nivel și aspiratoare industriale de închiriat în București, Cluj, Timișoara și restul țării.",
    descriptionEn:
      "Rent drills, hammer drills, concrete mixers, laser levels and industrial vacuums in Bucharest, Cluj, Timisoara and across Romania.",
  },
  evenimente: {
    titleKeyword: "Echipamente pentru evenimente",
    titleKeywordEn: "Event equipment",
    description:
      "Mese și scaune, corturi, sonorizare, lumini decorative și aparate de popcorn sau vată de zahăr, închiriate direct de la organizatori locali.",
    descriptionEn:
      "Tables and chairs, tents, sound systems, decorative lighting, popcorn and cotton candy machines — rented straight from local hosts.",
  },
  electronice: {
    titleKeyword: "Electronice",
    titleKeywordEn: "Electronics",
    description:
      "Laptopuri, proiectoare, console și VR, camere DSLR, drone și boxe de închiriat pe zile. Plată securizată și predare documentată cu poze.",
    descriptionEn:
      "Laptops, projectors, consoles and VR, DSLR cameras, drones and speakers to rent by the day. Secure payment and photo-documented handover.",
  },
  gradinarit: {
    titleKeyword: "Echipamente de grădinărit",
    titleKeywordEn: "Gardening equipment",
    description:
      "Mașini de tuns gazon, motocoase, motosape, motofierăstraie și sisteme de irigații de închiriat de la vecini verificați, pe zile sau weekend.",
    descriptionEn:
      "Lawn mowers, brush cutters, tillers, chainsaws and irrigation systems to rent from verified neighbours, by the day or for the weekend.",
  },
  outdoor: {
    titleKeyword: "Echipament de drumeție și camping",
    titleKeywordEn: "Hiking & camping gear",
    description:
      "Corturi, saci de dormit, rucsaci, bocanci, caiace, SUP-uri și grătare portabile pentru următoarea ta ieșire în natură. Testează înainte să cumperi.",
    descriptionEn:
      "Tents, sleeping bags, backpacks, boots, kayaks, SUPs and portable grills for your next trip outdoors. Try the gear before you buy it.",
  },
  "jucarii-petrecere-copii": {
    titleKeyword: "Jucării și petreceri pentru copii",
    titleKeywordEn: "Kids toys & party gear",
    description:
      "Castele gonflabile, tobogane, mese de joacă, decor tematic și jucării mari pentru zile de naștere, închiriate pentru câteva zile, nu cumpărate.",
    descriptionEn:
      "Bouncy castles, slides, play tables, themed decor and large toys for birthday parties — rented for a few days instead of bought.",
  },
  sport: {
    titleKeyword: "Echipament sportiv",
    titleKeywordEn: "Sports equipment",
    description:
      "Biciclete, schiuri și snowboard, aparate fitness, echipament de tenis sau fotbal, închiriate pe zile de la sportivi din orașul tău.",
    descriptionEn:
      "Bikes, skis and snowboards, fitness machines, tennis and football gear rented by the day from athletes in your city.",
  },
  travel: {
    titleKeyword: "Accesorii de călătorie",
    titleKeywordEn: "Travel gear",
    description:
      "Valize, scaune auto pentru copii, cărucioare, rucsaci de voiaj și adaptoare — tot ce îți trebuie pentru o vacanță, fără să cumperi nimic.",
    descriptionEn:
      "Suitcases, child car seats, strollers, travel backpacks and adapters — everything you need for a trip, without buying any of it.",
  },
  "transport-utilitare": {
    titleKeyword: "Remorci și transport",
    titleKeywordEn: "Trailers & transport",
    description:
      "Remorci, portbagaje de plafon, cărucioare de transport, rampe și chingi de închiriat pentru mutări sau transport de marfă, pe zile.",
    descriptionEn:
      "Trailers, roof racks, hand trucks, ramps and straps to rent by the day for moving house or hauling cargo.",
  },
  "haine-recuzita": {
    titleKeyword: "Costume și recuzită",
    titleKeywordEn: "Costumes & props",
    description:
      "Costume de epocă și tematice, ținute de ocazie, accesorii și recuzită pentru ședințe foto, teatru sau petreceri costumate.",
    descriptionEn:
      "Vintage and themed costumes, formal outfits, accessories and props for photo shoots, theatre or costume parties.",
  },
  utilaje: {
    titleKeyword: "Utilaje pentru construcții",
    titleKeywordEn: "Heavy equipment",
    description:
      "Mini-excavatoare, generatoare, schele, placi compactoare și nacele de închiriat de la firme și proprietari verificați din România.",
    descriptionEn:
      "Mini excavators, generators, scaffolding, plate compactors and lifts to rent from verified companies and owners across Romania.",
  },
  diverse: {
    titleKeyword: "Diverse obiecte",
    titleKeywordEn: "Miscellaneous items",
    description:
      "Obiecte care nu intră în alte categorii: aparate de nișă, instrumente, echipamente ocazionale — închiriate pentru cât ai nevoie de ele.",
    descriptionEn:
      "Items that fit nowhere else: niche devices, instruments and occasional-use equipment — rented for exactly as long as you need them.",
  },
};

export const getCategorySeoCopy = (slug: string | undefined): CategorySeoCopy | null =>
  (slug && categorySeoCopy[slug]) || null;
