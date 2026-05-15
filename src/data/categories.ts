export interface Subcategory {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  image: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  nameEn: string;
  subcategories: Subcategory[];
  icon: string;
}

export const categories: Category[] = [
  {
    id: 1,
    slug: "unelte",
    name: "Unelte",
    nameEn: "Tools",
    icon: "🔧",
    subcategories: [
      { id: "1-1", name: "Scule electrice", nameEn: "Power Tools", description: "Bormașini, rotopercutoare, polizoare", descriptionEn: "Drills, hammer drills, grinders", image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80" },
      { id: "1-2", name: "Scule manuale", nameEn: "Hand Tools", description: "Chei, șurubelnițe, clești, truse", descriptionEn: "Wrenches, screwdrivers, pliers, kits", image: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400&q=80" },
      { id: "1-3", name: "Construcții", nameEn: "Construction", description: "Betoniere, compactoare, buldoexcavatoare", descriptionEn: "Concrete mixers, compactors, excavators", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80" },
      { id: "1-4", name: "Măsurare și nivelare", nameEn: "Measuring & Leveling", description: "Lasere, niveluri, rulete profesionale", descriptionEn: "Lasers, levels, professional tape measures", image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&q=80" },
      { id: "1-5", name: "Curățenie industrială", nameEn: "Industrial Cleaning", description: "Aspiratoare industriale, mașini de curățat", descriptionEn: "Industrial vacuums, cleaning machines", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&q=80" },
      { id: "1-99", name: "Altele", nameEn: "Others", description: "Alte unelte și echipamente", descriptionEn: "Other tools and equipment", image: "" },
    ],
  },
  {
    id: 2,
    slug: "evenimente",
    name: "Evenimente",
    nameEn: "Events",
    icon: "🎉",
    subcategories: [
      { id: "2-1", name: "Mobilier evenimente", nameEn: "Event Furniture", description: "Mese, scaune, podiumuri pentru evenimente", descriptionEn: "Tables, chairs, podiums for events", image: "https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=400&q=80" },
      { id: "2-2", name: "Decor și lighting", nameEn: "Decor & Lighting", description: "Arcade, aranjamente, lumini decorative", descriptionEn: "Arches, arrangements, decorative lights", image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&q=80" },
      { id: "2-3", name: "Echipamente audio-video", nameEn: "Audio-Video Equipment", description: "Boxe, microfoane, proiectoare", descriptionEn: "Speakers, microphones, projectors", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80" },
      { id: "2-4", name: "Corturi și pavilioane", nameEn: "Tents & Pavilions", description: "Corturi mari, pavilioane pentru evenimente", descriptionEn: "Large tents, pavilions for events", image: "https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=400&q=80" },
      { id: "2-5", name: "Catering și servire", nameEn: "Catering & Serving", description: "Aparate popcorn, vată de zahăr, grătare", descriptionEn: "Popcorn machines, cotton candy, grills", image: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&q=80" },
      { id: "2-6", name: "Echipamente speciale", nameEn: "Special Equipment", description: "Mașini de fum, bule, zăpadă artificială", descriptionEn: "Fog, bubble, artificial snow machines", image: "https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=400&q=80" },
      { id: "2-99", name: "Altele", nameEn: "Others", description: "Alte echipamente pentru evenimente", descriptionEn: "Other event equipment", image: "" },
    ],
  },
  {
    id: 3,
    slug: "electronice",
    name: "Electronice",
    nameEn: "Electronics",
    icon: "💻",
    subcategories: [
      { id: "3-1", name: "Electrocasnice mici", nameEn: "Small Appliances", description: "Aparate de uz casnic portabile", descriptionEn: "Portable household appliances", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80" },
      { id: "3-2", name: "Laptopuri și PC", nameEn: "Laptops & PC", description: "Laptopuri, calculatoare, accesorii", descriptionEn: "Laptops, computers, accessories", image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&q=80" },
      { id: "3-3", name: "TV și proiectoare", nameEn: "TV & Projectors", description: "Televizoare, proiectoare, ecrane", descriptionEn: "TVs, projectors, screens", image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80" },
      { id: "3-4", name: "Audio", nameEn: "Audio", description: "Boxe, căști, echipamente audio", descriptionEn: "Speakers, headphones, audio equipment", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80" },
      { id: "3-5", name: "Gaming", nameEn: "Gaming", description: "Console, VR, controllere, jocuri", descriptionEn: "Consoles, VR, controllers, games", image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&q=80" },
      { id: "3-6", name: "Foto și video", nameEn: "Photo & Video", description: "Camere DSLR, drone, gimbaluri", descriptionEn: "DSLR cameras, drones, gimbals", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80" },
      { id: "3-7", name: "Tablete", nameEn: "Tablets", description: "Tablete și accesorii", descriptionEn: "Tablets and accessories", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80" },
      { id: "3-99", name: "Altele", nameEn: "Others", description: "Alte electronice", descriptionEn: "Other electronics", image: "" },
    ],
  },
  {
    id: 4,
    slug: "gradinarit",
    name: "Grădinărit",
    nameEn: "Gardening",
    icon: "🌱",
    subcategories: [
      { id: "4-1", name: "Unelte grădină", nameEn: "Garden Tools", description: "Greble, lopeti, foarfeci de grădină", descriptionEn: "Rakes, shovels, garden shears", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80" },
      { id: "4-2", name: "Mașini de tuns gazon", nameEn: "Lawn Mowers", description: "Mașini de tuns iarba manuale și electrice", descriptionEn: "Manual and electric lawn mowers", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80" },
      { id: "4-3", name: "Sisteme de irigații", nameEn: "Irrigation Systems", description: "Aspersoare, furtunuri, sisteme automate", descriptionEn: "Sprinklers, hoses, automatic systems", image: "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=400&q=80" },
      { id: "4-4", name: "Motounelte", nameEn: "Power Garden Tools", description: "Motosape, motocoase, motofierăstraie", descriptionEn: "Tillers, brush cutters, chainsaws", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80" },
      { id: "4-99", name: "Altele", nameEn: "Others", description: "Alte echipamente de grădinărit", descriptionEn: "Other gardening equipment", image: "" },
    ],
  },
  {
    id: 5,
    slug: "outdoor",
    name: "Drumeții & Natură",
    nameEn: "Outdoor",
    icon: "🏕️",
    subcategories: [
      { id: "5-1", name: "Camping", nameEn: "Camping", description: "Corturi, saltele, saci de dormit", descriptionEn: "Tents, mattresses, sleeping bags", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&q=80" },
      { id: "5-2", name: "Echipament Drumeții", nameEn: "Hiking Equipment", description: "Rucsaci, bocanci, bastoane", descriptionEn: "Backpacks, boots, trekking poles", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80" },
      { id: "5-3", name: "Grătare", nameEn: "Grills", description: "Grătare portabile și profesionale", descriptionEn: "Portable and professional grills", image: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&q=80" },
      { id: "5-4", name: "Echipamente de aventură", nameEn: "Adventure Equipment", description: "Caiace, SUP-uri, escaladă", descriptionEn: "Kayaks, SUPs, climbing gear", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80" },
      { id: "5-99", name: "Altele", nameEn: "Others", description: "Alte echipamente outdoor", descriptionEn: "Other outdoor equipment", image: "" },
    ],
  },
  {
    id: 6,
    slug: "jucarii-petrecere-copii",
    name: "Jucării și Petrecere Copii",
    nameEn: "Kids Toys & Party",
    icon: "🎈",
    subcategories: [
      { id: "6-1", name: "Tobogane și gonflabile", nameEn: "Slides & Inflatables", description: "Castele, tobogane și piscine gonflabile", descriptionEn: "Bouncy castles, slides and inflatable pools", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
      { id: "6-2", name: "Jocuri interactive", nameEn: "Interactive Games", description: "Jocuri interactive pentru petreceri", descriptionEn: "Interactive games for parties", image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&q=80" },
      { id: "6-3", name: "Costume copii", nameEn: "Kids Costumes", description: "Costume tematice pentru copii", descriptionEn: "Themed costumes for kids", image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80" },
      { id: "6-4", name: "Decor", nameEn: "Decorations", description: "Decoruri pentru petreceri copii", descriptionEn: "Decorations for kids' parties", image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80" },
      { id: "6-99", name: "Altele", nameEn: "Others", description: "Alte jucării și articole petrecere", descriptionEn: "Other toys and party items", image: "" },
    ],
  },
  {
    id: 7,
    slug: "sport",
    name: "Sport",
    nameEn: "Sports",
    icon: "⚽",
    subcategories: [
      { id: "7-1", name: "Fitness", nameEn: "Fitness", description: "Benzi alergare, biciclete indoor, greutăți", descriptionEn: "Treadmills, indoor bikes, weights", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80" },
      { id: "7-2", name: "Sporturi de echipă", nameEn: "Team Sports", description: "Echipament fotbal, baschet, volei", descriptionEn: "Football, basketball, volleyball equipment", image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80" },
      { id: "7-3", name: "Biciclete și accesorii", nameEn: "Bicycles & Accessories", description: "Biciclete, căști, accesorii ciclism", descriptionEn: "Bicycles, helmets, cycling accessories", image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&q=80" },
      { id: "7-4", name: "Sporturi de iarnă", nameEn: "Winter Sports", description: "Schiuri, snowboard, sănii, echipament", descriptionEn: "Skis, snowboards, sleds, equipment", image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&q=80" },
      { id: "7-5", name: "Sporturi de apă", nameEn: "Water Sports", description: "SUP, caiace, echipament scufundări", descriptionEn: "SUP, kayaks, diving equipment", image: "https://images.unsplash.com/photo-1499260662818-9c4c01d7cf6f?w=400&q=80" },
      { id: "7-6", name: "Recuperare și wellness", nameEn: "Recovery & Wellness", description: "Masaj, presoterapie, yoga", descriptionEn: "Massage, pressotherapy, yoga", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80" },
      { id: "7-99", name: "Altele", nameEn: "Others", description: "Alte echipamente sportive", descriptionEn: "Other sports equipment", image: "" },
    ],
  },
  {
    id: 8,
    slug: "travel",
    name: "Călătorii",
    nameEn: "Travel",
    icon: "🧳",
    subcategories: [
      { id: "8-1", name: "Valize și trolere", nameEn: "Suitcases & Trolleys", description: "Valize de diverse dimensiuni", descriptionEn: "Suitcases of various sizes", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80" },
      { id: "8-2", name: "Rucsaci travel", nameEn: "Travel Backpacks", description: "Rucsaci pentru călătorii", descriptionEn: "Backpacks for travel", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80" },
      { id: "8-3", name: "Accesorii călătorie", nameEn: "Travel Accessories", description: "Adaptoare, perne, organizatoare", descriptionEn: "Adapters, pillows, organizers", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80" },
      { id: "8-4", name: "Cuști și transport animale", nameEn: "Pet Carriers & Transport", description: "Cuști și genți transport animale", descriptionEn: "Pet carriers and transport bags", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80" },
      { id: "8-99", name: "Altele", nameEn: "Others", description: "Alte accesorii de călătorie", descriptionEn: "Other travel accessories", image: "" },
    ],
  },
  {
    id: 9,
    slug: "transport-utilitare",
    name: "Transport și Utilitare",
    nameEn: "Transport & Utility",
    icon: "🚛",
    subcategories: [
      { id: "9-1", name: "Remorci", nameEn: "Trailers", description: "Remorci auto de diverse dimensiuni", descriptionEn: "Car trailers of various sizes", image: "/images/categories/transport-utilitare.jpg" },
      { id: "9-2", name: "Platforme auto", nameEn: "Car Platforms", description: "Platforme pentru transport auto", descriptionEn: "Platforms for car transport", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80" },
      { id: "9-3", name: "ATV și off-road", nameEn: "ATV & Off-Road", description: "ATV-uri și vehicule off-road", descriptionEn: "ATVs and off-road vehicles", image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&q=80" },
      { id: "9-4", name: "Motociclete și scutere", nameEn: "Motorcycles & Scooters", description: "Motociclete și scutere de închiriat", descriptionEn: "Motorcycles and scooters for rent", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80" },
      { id: "9-5", name: "Transport marfă", nameEn: "Cargo Transport", description: "Vehicule și echipamente transport marfă", descriptionEn: "Cargo transport vehicles and equipment", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80" },
      { id: "9-6", name: "Echipamente transport", nameEn: "Transport Equipment", description: "Portbagaje, boxe transfer, suporturi", descriptionEn: "Roof racks, cargo boxes, mounts", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80" },
      { id: "9-7", name: "Trotinete", nameEn: "Scooters", description: "Trotinete electrice și clasice", descriptionEn: "Electric and classic scooters", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
      { id: "9-99", name: "Altele", nameEn: "Others", description: "Alte echipamente de transport", descriptionEn: "Other transport equipment", image: "" },
    ],
  },
  {
    id: 10,
    slug: "haine-recuzita",
    name: "Haine și Recuzită",
    nameEn: "Costumes & Props",
    icon: "👔",
    subcategories: [
      { id: "10-1", name: "Costume tematice", nameEn: "Themed Costumes", description: "Costume pentru diverse ocazii tematice", descriptionEn: "Costumes for various themed occasions", image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80" },
      { id: "10-2", name: "Ținute elegante", nameEn: "Elegant Outfits", description: "Rochii de seară, costume bărbătești", descriptionEn: "Evening dresses, men's suits", image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80" },
      { id: "10-3", name: "Costume Halloween", nameEn: "Halloween Costumes", description: "Costume și măști de Halloween", descriptionEn: "Halloween costumes and masks", image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80" },
      { id: "10-99", name: "Altele", nameEn: "Others", description: "Alte haine și recuzită", descriptionEn: "Other costumes and props", image: "" },
    ],
  },
  {
    id: 11,
    slug: "utilaje",
    name: "Echipamente Agricole",
    nameEn: "Agricultural Equipment",
    icon: "🚜",
    subcategories: [
      { id: "11-1", name: "Tractoare și mini-tractoare", nameEn: "Tractors & Mini-Tractors", description: "Tractoare pentru lucrări agricole", descriptionEn: "Tractors for agricultural work", image: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&q=80" },
      { id: "11-2", name: "Utilaje de prelucrare sol", nameEn: "Soil Processing Machinery", description: "Pluguri, grape, freze de sol", descriptionEn: "Plows, harrows, soil tillers", image: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&q=80" },
      { id: "11-3", name: "Semănat și plantat", nameEn: "Seeding & Planting", description: "Semănătoare, plantătoare", descriptionEn: "Seeders, planters", image: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&q=80" },
      { id: "11-4", name: "Irigare agricolă", nameEn: "Agricultural Irrigation", description: "Sisteme de irigație pentru agricultură", descriptionEn: "Irrigation systems for agriculture", image: "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=400&q=80" },
      { id: "11-5", name: "Recoltare", nameEn: "Harvesting", description: "Combine, secerătoare, echipament recoltare", descriptionEn: "Combines, harvesters, harvesting equipment", image: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&q=80" },
      { id: "11-6", name: "Atașamente și accesorii", nameEn: "Attachments & Accessories", description: "Atașamente pentru utilaje agricole", descriptionEn: "Attachments for agricultural machinery", image: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&q=80" },
      { id: "11-7", name: "Buldoexcavator", nameEn: "Backhoe Loader", description: "Buldoexcavatoare pentru construcții", descriptionEn: "Backhoe loaders for construction", image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&q=80" },
      { id: "11-8", name: "Excavator", nameEn: "Excavator", description: "Excavatoare de diverse capacități", descriptionEn: "Excavators of various capacities", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80" },
      { id: "11-9", name: "Cilindru Compactor", nameEn: "Road Roller", description: "Cilindri compactori pentru asfalt și sol", descriptionEn: "Road rollers for asphalt and soil compaction", image: "https://images.unsplash.com/photo-1517089152318-42ec560349c0?w=400&q=80" },
      { id: "11-10", name: "Macara", nameEn: "Crane", description: "Macarale pentru ridicări grele", descriptionEn: "Cranes for heavy lifting", image: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=400&q=80" },
      { id: "11-11", name: "Nacelă Articulată", nameEn: "Articulated Boom Lift", description: "Nacele articulate pentru lucrări la înălțime", descriptionEn: "Articulated boom lifts for high-altitude work", image: "https://images.unsplash.com/photo-1590496793929-36417d3117de?w=400&q=80" },
      { id: "11-12", name: "Nacelă Foarfecă", nameEn: "Scissor Lift", description: "Nacele tip foarfecă pentru platforme de lucru", descriptionEn: "Scissor lifts for elevated work platforms", image: "https://images.unsplash.com/photo-1590496794008-383c8070b257?w=400&q=80" },
      { id: "11-13", name: "Încărcător Frontal", nameEn: "Front Loader", description: "Încărcătoare frontale pentru materiale", descriptionEn: "Front loaders for material handling", image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&q=80" },
      { id: "11-99", name: "Altele", nameEn: "Others", description: "Alte echipamente agricole", descriptionEn: "Other agricultural equipment", image: "" },
    ],
  },
  {
    id: 12,
    slug: "diverse",
    name: "Diverse",
    nameEn: "Miscellaneous",
    icon: "📦",
    subcategories: [
      { id: "12-99", name: "Altele", nameEn: "Others", description: "Alte produse diverse", descriptionEn: "Other miscellaneous items", image: "" },
    ],
  },
];

export const getCategoryBySlug = (slug: string): Category | undefined => {
  return categories.find((cat) => cat.slug === slug);
};

export const getCategoryById = (id: number): Category | undefined => {
  return categories.find((cat) => cat.id === id);
};

export const getAllSubcategories = (): (Subcategory & { categoryId: number; categoryName: string })[] => {
  return categories.flatMap((cat) =>
    cat.subcategories.map((sub) => ({
      ...sub,
      categoryId: cat.id,
      categoryName: cat.name,
    }))
  );
};

export const getSubcategoryById = (subcategoryId: string): { category: Category; subcategory: Subcategory } | undefined => {
  for (const category of categories) {
    const subcategory = category.subcategories.find((sub) => sub.id === subcategoryId);
    if (subcategory) {
      return { category, subcategory };
    }
  }
  return undefined;
};
