/**
 * Unique, hand-written on-page copy for each top-level category.
 * Without it, category pages are near-duplicates of each other and get
 * indexed poorly. Rendered at the bottom of the category / subcategory pages.
 */

export interface CategoryFaq {
  q: string;
  qEn: string;
  a: string;
  aEn: string;
}

export interface CategoryContent {
  intro: string[];
  introEn: string[];
  faq: CategoryFaq[];
}

const common = (topic: string, topicEn: string): CategoryFaq[] => [
  {
    q: `Cât costă să închiriez ${topic}?`,
    qEn: `How much does it cost to rent ${topicEn}?`,
    a: `Prețul este stabilit de fiecare proprietar și este afișat pe zi în anunț. Vezi totalul exact, inclusiv comisionul Rentli, înainte de a confirma rezervarea.`,
    aEn: `Each owner sets their own price, shown per day in the listing. You see the exact total, including the Rentli fee, before confirming the booking.`,
  },
  {
    q: `Ce se întâmplă dacă ${topic} se strică în timpul închirierii?`,
    qEn: `What if ${topicEn} breaks during the rental?`,
    a: `La predare și la retur, ambele părți completează un proces verbal cu poze. Dacă apare o problemă, poți deschide o sesizare direct din pagina rezervării, iar echipa Rentli intervine.`,
    aEn: `At handover and return, both sides complete a photo-documented report. If something goes wrong, you can open a dispute from the booking page and the Rentli team steps in.`,
  },
  {
    q: `Cum se face plata?`,
    qEn: `How does payment work?`,
    a: `Plătești online cu cardul. Banii sunt blocați până la finalizarea închirierii și ajung la proprietar doar după confirmarea returului.`,
    aEn: `You pay online by card. The money is held until the rental ends and reaches the owner only after the return is confirmed.`,
  },
];

export const categoryContent: Record<string, CategoryContent> = {
  unelte: {
    intro: [
      "O bormașină profesională, un rotopercutor sau o betonieră sunt folosite de cele mai multe ori câteva zile pe an. Închirierea costă o fracțiune din prețul de achiziție și îți lasă spațiu liber în garaj.",
      "Pe Rentli găsești scule electrice și manuale, echipamente de construcții, aparate de măsurare și nivelare, puse la închiriat de meșteri și firme din orașul tău. Fiecare anunț arată starea sculei, accesoriile incluse și zona de ridicare.",
    ],
    introEn: [
      "A professional drill, a rotary hammer or a concrete mixer usually gets used a few days a year. Renting costs a fraction of buying and keeps your garage free.",
      "On Rentli you will find power and hand tools, construction equipment and measuring gear listed by tradespeople and companies in your city. Every listing shows the condition, the included accessories and the pickup area.",
    ],
    faq: common("o unealtă", "a tool"),
  },
  evenimente: {
    intro: [
      "Pentru o nuntă, o aniversare sau o petrecere în curte ai nevoie de mese, scaune, corturi și sonorizare doar pentru câteva zile. Cumpărarea nu are sens, iar firmele de evenimente cer adesea pachete întregi.",
      "Aici închiriezi exact ce îți trebuie, direct de la organizatori și proprietari locali: mobilier, corturi, lumini decorative, sisteme audio sau aparate de popcorn și vată de zahăr.",
    ],
    introEn: [
      "A wedding, a birthday or a garden party needs tables, chairs, tents and sound gear for a couple of days only. Buying makes no sense and event companies often push full packages.",
      "Here you rent exactly what you need, straight from local hosts and owners: furniture, tents, decorative lighting, audio systems, popcorn and cotton candy machines.",
    ],
    faq: common("echipament pentru evenimente", "event equipment"),
  },
  electronice: {
    intro: [
      "Un proiector pentru o prezentare, o cameră DSLR pentru un weekend sau o consolă pentru o vacanță în familie: electronicele se învechesc repede, iar închirierea te scutește de o investiție care se depreciază.",
      "Găsești laptopuri, proiectoare, camere foto și video, drone, console și căști VR, boxe și microfoane, toate de la proprietari verificați, cu predare documentată prin poze.",
    ],
    introEn: [
      "A projector for one presentation, a DSLR for a weekend, a console for a family holiday: electronics age fast, and renting saves you an investment that loses value.",
      "You will find laptops, projectors, photo and video cameras, drones, consoles and VR headsets, speakers and microphones, all from verified owners with photo-documented handover.",
    ],
    faq: common("un aparat electronic", "an electronic device"),
  },
  gradinarit: {
    intro: [
      "Grădina cere utilaje folosite sezonier: o mașină de tuns gazon primăvara, o motocoasă vara, un tocător de crengi toamna. Închirierea le face accesibile fără să le depozitezi tot anul.",
      "Pe Rentli închiriezi mașini de tuns, motocoase, motosape, motofierăstraie și sisteme de irigații de la vecini și grădinari din zona ta, pe zile sau pentru weekend.",
    ],
    introEn: [
      "Gardens need seasonal machines: a mower in spring, a brush cutter in summer, a shredder in autumn. Renting makes them affordable without storing them all year.",
      "On Rentli you rent mowers, brush cutters, tillers, chainsaws and irrigation kits from neighbours and gardeners nearby, by the day or for the weekend.",
    ],
    faq: common("un utilaj de grădină", "garden equipment"),
  },
  outdoor: {
    intro: [
      "Înainte să cumperi un cort de munte sau un caiac, poți testa exact modelul care te interesează pe teren, într-o ieșire reală.",
      "Închiriază corturi, saci de dormit, rucsaci, bocanci, caiace, plăci SUP și grătare portabile de la oameni care le folosesc constant și îți pot spune ce merită.",
    ],
    introEn: [
      "Before buying a mountain tent or a kayak, you can try the exact model you are considering on a real trip.",
      "Rent tents, sleeping bags, backpacks, boots, kayaks, SUP boards and portable grills from people who use them regularly and can tell you what is worth it.",
    ],
    faq: common("echipament outdoor", "outdoor gear"),
  },
  "jucarii-petrecere-copii": {
    intro: [
      "Un castel gonflabil sau un tobogan mare țin o după-amiază de petrecere, dar ocupă loc tot anul. Copiii se plictisesc de jucăriile mari mult mai repede decât se amortizează prețul lor.",
      "Închiriază castele gonflabile, tobogane, mese de joacă, decor tematic și jucării de exterior pentru zile de naștere și petreceri, de la familii din orașul tău.",
    ],
    introEn: [
      "A bouncy castle or a big slide lasts one party afternoon but takes up space all year. Kids outgrow large toys long before their price pays off.",
      "Rent bouncy castles, slides, play tables, themed decor and outdoor toys for birthdays and parties, from families in your city.",
    ],
    faq: common("o jucărie mare", "a large toy"),
  },
  sport: {
    intro: [
      "Schiuri pentru o săptămână la munte, o bicicletă pentru un city break, un aparat de fitness pentru o lună de antrenament acasă: echipamentul sportiv se pretează perfect la închiriere.",
      "Găsești biciclete, schiuri și snowboarduri, aparate fitness, echipament de tenis, fotbal sau sporturi nautice, închiriate pe zile de la sportivi din zona ta.",
    ],
    introEn: [
      "Skis for a week in the mountains, a bike for a city break, a fitness machine for a month of home training: sports gear is made for renting.",
      "You will find bikes, skis and snowboards, fitness machines, tennis, football and water sports equipment, rented by the day from athletes nearby.",
    ],
    faq: common("echipament sportiv", "sports equipment"),
  },
  travel: {
    intro: [
      "O valiză mare, un scaun auto pentru copil sau un cărucior de voiaj sunt necesare doar în vacanțe. Restul anului stau în debara.",
      "Închiriază valize, scaune auto, cărucioare, rucsaci de voiaj și accesorii de călătorie pentru exact zilele în care pleci, fără să le cumperi.",
    ],
    introEn: [
      "A large suitcase, a child car seat or a travel stroller are only needed on holidays. The rest of the year they sit in a closet.",
      "Rent suitcases, car seats, strollers, travel backpacks and accessories for exactly the days you travel, instead of buying them.",
    ],
    faq: common("un accesoriu de călătorie", "travel gear"),
  },
  "transport-utilitare": {
    intro: [
      "O mutare, un transport de materiale sau o vacanță cu bagaj mult cer o remorcă sau un portbagaj de plafon pentru câteva zile.",
      "Aici închiriezi remorci, portbagaje de plafon, cărucioare de transport, rampe și chingi de la proprietari verificați, cu preluare din orașul tău.",
    ],
    introEn: [
      "A house move, a materials run or a holiday with heavy luggage needs a trailer or a roof rack for a few days.",
      "Here you rent trailers, roof racks, hand trucks, ramps and straps from verified owners, picked up in your own city.",
    ],
    faq: common("o remorcă", "a trailer"),
  },
  "haine-recuzita": {
    intro: [
      "Un costum de epocă, o ținută de ocazie sau recuzita pentru o ședință foto se poartă o dată. Închirierea îți dă acces la piese pe care nu le-ai cumpăra niciodată.",
      "Găsești costume tematice, ținute de eveniment, accesorii și recuzită pentru teatru, filmări, petreceri costumate sau sesiuni foto.",
    ],
    introEn: [
      "A vintage costume, a formal outfit or props for a photo shoot get worn once. Renting gives you access to pieces you would never buy.",
      "You will find themed costumes, event outfits, accessories and props for theatre, filming, costume parties or photo sessions.",
    ],
    faq: common("un costum", "a costume"),
  },
  utilaje: {
    intro: [
      "Utilajele grele sunt cea mai scumpă categorie de cumpărat și cea mai rentabilă de închiriat. Un mini-excavator sau o nacelă se folosesc câteva zile pe șantier și apoi stau.",
      "Pe Rentli închiriezi mini-excavatoare, generatoare, schele, plăci compactoare și nacele de la firme și proprietari verificați din toată țara.",
    ],
    introEn: [
      "Heavy equipment is the most expensive category to buy and the most worthwhile to rent. A mini excavator or a lift works a few days on site and then sits idle.",
      "On Rentli you rent mini excavators, generators, scaffolding, plate compactors and lifts from verified companies and owners across Romania.",
    ],
    faq: common("un utilaj", "heavy equipment"),
  },
  diverse: {
    intro: [
      "Unele obiecte nu se încadrează nicăieri, dar sunt exact ce cauți: un aparat de nișă, un instrument muzical, un echipament folosit o dată pe an.",
      "Aici găsești obiectele care nu intră în celelalte categorii, listate de oameni din toată țara și închiriate pentru exact perioada de care ai nevoie.",
    ],
    introEn: [
      "Some items fit nowhere else but are exactly what you are looking for: a niche device, a musical instrument, equipment used once a year.",
      "Here you find the items that do not fit the other categories, listed by people across the country and rented for exactly as long as you need.",
    ],
    faq: common("un obiect", "an item"),
  },
};

export const getCategoryContent = (slug: string | undefined): CategoryContent | null =>
  (slug && categoryContent[slug]) || null;
