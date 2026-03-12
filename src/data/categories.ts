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
    slug: "outdoor-aventura",
    name: "OUTDOOR & AVENTURĂ",
    nameEn: "OUTDOOR & ADVENTURE",
    icon: "🚴",
    subcategories: [
      { id: "1-1", name: "Biciclete", nameEn: "Bicycles", description: "Biciclete pentru toate tipurile de trasee și activități", descriptionEn: "Bicycles for all types of trails and activities", image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&q=80" },
      { id: "1-2", name: "MTB / Downhill", nameEn: "MTB / Downhill", description: "Biciclete de munte pentru trasee off-road", descriptionEn: "Mountain bikes for off-road trails", image: "https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=400&q=80" },
      { id: "1-3", name: "Trotinete electrice", nameEn: "Electric scooters", description: "Trotinete electrice pentru mobilitate urbană", descriptionEn: "Electric scooters for urban mobility", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
      { id: "1-4", name: "ATV-uri", nameEn: "ATVs", description: "Vehicule all-terrain pentru aventuri extreme", descriptionEn: "All-terrain vehicles for extreme adventures", image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&q=80" },
      { id: "1-5", name: "Scutere", nameEn: "Scooters", description: "Scutere pentru deplasări rapide și convenabile", descriptionEn: "Scooters for quick and convenient trips", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80" },
      { id: "1-6", name: "E-bike", nameEn: "E-bike", description: "Biciclete electrice cu asistență la pedalare", descriptionEn: "Electric bikes with pedal assist", image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&q=80" },
      { id: "1-7", name: "Role / patine", nameEn: "Rollerblades / skates", description: "Echipament pentru patinaj și role", descriptionEn: "Skating and rollerblading equipment", image: "https://images.unsplash.com/photo-1593786267440-e3d5e0fd47d1?w=400&q=80" },
      { id: "1-8", name: "Caiace", nameEn: "Kayaks", description: "Caiace pentru aventuri pe apă", descriptionEn: "Kayaks for water adventures", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80" },
      { id: "1-9", name: "Canoe", nameEn: "Canoes", description: "Canoe pentru excursii pe râuri și lacuri", descriptionEn: "Canoes for river and lake trips", image: "https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=400&q=80" },
      { id: "1-10", name: "SUP boards", nameEn: "SUP boards", description: "Plăci stand-up paddle pentru relaxare pe apă", descriptionEn: "Stand-up paddle boards for water relaxation", image: "https://images.unsplash.com/photo-1499260662818-9c4c01d7cf6f?w=400&q=80" },
      { id: "1-11", name: "Bărci / ambarcațiuni mici", nameEn: "Boats / small watercraft", description: "Bărci și ambarcațiuni pentru activități nautice", descriptionEn: "Boats and watercraft for nautical activities", image: "https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=400&q=80" },
      { id: "1-12", name: "Echipament pescuit", nameEn: "Fishing equipment", description: "Unelte și accesorii complete pentru pescuit", descriptionEn: "Complete fishing tools and accessories", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80" },
    ],
  },
  {
    id: 2,
    slug: "camping-drumetii",
    name: "CAMPING & DRUMEȚII",
    nameEn: "CAMPING & HIKING",
    icon: "⛺",
    subcategories: [
      { id: "2-1", name: "Corturi 1–8 persoane", nameEn: "Tents 1–8 persons", description: "Corturi pentru grupuri mici și medii", descriptionEn: "Tents for small and medium groups", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&q=80" },
      { id: "2-2", name: "Corturi mari evenimente", nameEn: "Large event tents", description: "Corturi spațioase pentru evenimente în aer liber", descriptionEn: "Spacious tents for outdoor events", image: "https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=400&q=80" },
      { id: "2-3", name: "Saltele + saci de dormit", nameEn: "Mattresses + sleeping bags", description: "Echipament confortabil pentru noapte", descriptionEn: "Comfortable overnight equipment", image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&q=80" },
      { id: "2-4", name: "Mese + scaune camping", nameEn: "Camping tables + chairs", description: "Mobilier portabil pentru camping", descriptionEn: "Portable furniture for camping", image: "https://images.unsplash.com/photo-1517824806704-9040b037703b?w=400&q=80" },
      { id: "2-5", name: "Rucsacuri trekking", nameEn: "Trekking backpacks", description: "Rucsacuri durabile pentru drumeții lungi", descriptionEn: "Durable backpacks for long hikes", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80" },
      { id: "2-6", name: "Arzătoare & seturi gătit", nameEn: "Stoves & cooking sets", description: "Echipament pentru gătit în natură", descriptionEn: "Equipment for cooking in nature", image: "https://images.unsplash.com/photo-1510672981848-a1c4f1cb5ccf?w=400&q=80" },
      { id: "2-7", name: "Hamace", nameEn: "Hammocks", description: "Hamace confortabile pentru relaxare", descriptionEn: "Comfortable hammocks for relaxation", image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80" },
      { id: "2-8", name: "Lanterne / frontale", nameEn: "Lanterns / headlamps", description: "Iluminat portabil pentru aventuri nocturne", descriptionEn: "Portable lighting for night adventures", image: "https://images.unsplash.com/photo-1493673272479-a20888bcee10?w=400&q=80" },
      { id: "2-9", name: "Bocanci / rachete zăpadă", nameEn: "Boots / snowshoes", description: "Încălțăminte și echipament pentru zăpadă", descriptionEn: "Footwear and equipment for snow", image: "https://images.unsplash.com/photo-1520201163981-8cc95007dd2a?w=400&q=80" },
    ],
  },
  {
    id: 3,
    slug: "sporturi-iarna",
    name: "SPORTURI DE IARNĂ",
    nameEn: "WINTER SPORTS",
    icon: "🎿",
    subcategories: [
      { id: "3-1", name: "Sănii", nameEn: "Sleds", description: "Sănii pentru distracție pe zăpadă", descriptionEn: "Sleds for snow fun", image: "https://images.unsplash.com/photo-1482005253821-5d6a2c685879?w=400&q=80" },
      { id: "3-2", name: "Schiuri", nameEn: "Skis", description: "Schiuri pentru toate nivelurile de experiență", descriptionEn: "Skis for all experience levels", image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&q=80" },
      { id: "3-3", name: "Snowboard", nameEn: "Snowboard", description: "Plăci snowboard pentru iubitorii de adrenalină", descriptionEn: "Snowboards for adrenaline lovers", image: "https://images.unsplash.com/photo-1478700485868-972b69dc3fc4?w=400&q=80" },
      { id: "3-4", name: "Boots", nameEn: "Boots", description: "Încălțăminte specializată pentru sporturi de iarnă", descriptionEn: "Specialized footwear for winter sports", image: "https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=400&q=80" },
      { id: "3-5", name: "Căști & protecții", nameEn: "Helmets & protection", description: "Echipament de siguranță pentru schi și snowboard", descriptionEn: "Safety equipment for skiing and snowboarding", image: "https://images.unsplash.com/photo-1565992441121-4367c2967103?w=400&q=80" },
      { id: "3-6", name: "Set complet schi", nameEn: "Complete ski set", description: "Pachete complete cu tot echipamentul necesar", descriptionEn: "Complete packages with all necessary equipment", image: "https://images.unsplash.com/photo-1486915309851-b0cc1f8a0084?w=400&q=80" },
    ],
  },
  {
    id: 4,
    slug: "scule-unelte-constructii",
    name: "SCULE, UNELTE & CONSTRUCȚII",
    nameEn: "TOOLS & CONSTRUCTION",
    icon: "🔧",
    subcategories: [
      { id: "4-1", name: "Scule electrice", nameEn: "Power tools", description: "Bormașini, rotopercutoare, polizoare, freze", descriptionEn: "Drills, hammer drills, grinders, routers", image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80" },
      { id: "4-2", name: "Echipamente profesionale", nameEn: "Professional equipment", description: "Compresoare, generatoare, laser nivelare, sudură", descriptionEn: "Compressors, generators, laser levels, welding", image: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400&q=80" },
      { id: "4-3", name: "Scule grădină", nameEn: "Garden tools", description: "Mașini tuns gazon, trimmere, foarfeci electrice", descriptionEn: "Lawn mowers, trimmers, electric shears", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80" },
      { id: "4-4", name: "Unelte auto", nameEn: "Auto tools", description: "Cric, chei dinamometrice, tachelaj auto", descriptionEn: "Jacks, torque wrenches, auto rigging", image: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&q=80" },
      { id: "4-5", name: "Aspiratoare", nameEn: "Vacuum cleaners", description: "Simple, industriale, cu apă, injecție-extracție", descriptionEn: "Simple, industrial, water, injection-extraction", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&q=80" },
      { id: "4-6", name: "Betoniere electrice", nameEn: "Electric concrete mixers", description: "Betoniere pentru proiecte de construcție", descriptionEn: "Concrete mixers for construction projects", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80" },
      { id: "4-7", name: "Plăci compactoare", nameEn: "Compactor plates", description: "Echipament pentru compactare sol", descriptionEn: "Soil compaction equipment", image: "https://images.unsplash.com/photo-1541123603104-512919d6a96c?w=400&q=80" },
      { id: "4-8", name: "Lift panouri", nameEn: "Panel lifts", description: "Lifturi pentru manipulare panouri grele", descriptionEn: "Lifts for handling heavy panels", image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80" },
      { id: "4-9", name: "Scări 5–12 m", nameEn: "Ladders 5–12 m", description: "Scări extensibile pentru lucru la înălțime", descriptionEn: "Extension ladders for working at height", image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80" },
      { id: "4-10", name: "Ciocan demolator", nameEn: "Demolition hammer", description: "Ciocane demolatoare profesionale", descriptionEn: "Professional demolition hammers", image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&q=80" },
      { id: "4-11", name: "Generator mare", nameEn: "Large generator", description: "Generatoare de putere mare", descriptionEn: "High-power generators", image: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=400&q=80" },
      { id: "4-12", name: "Pompe de apă", nameEn: "Water pumps", description: "Submersibile, suprafață, drenaj, hidrofoare", descriptionEn: "Submersible, surface, drainage, hydrophore", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80" },
      { id: "4-13", name: "Sisteme irigații", nameEn: "Irrigation systems", description: "Sisteme complete de irigații", descriptionEn: "Complete irrigation systems", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80" },
      { id: "4-14", name: "Aspersoare profesionale", nameEn: "Professional sprinklers", description: "Aspersoare pentru grădini și terenuri", descriptionEn: "Sprinklers for gardens and fields", image: "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=400&q=80" },
    ],
  },
  {
    id: 5,
    slug: "jucarii-gonflabile-copii",
    name: "JUCĂRII GONFLABILE & COPII",
    nameEn: "INFLATABLES & KIDS",
    icon: "🎈",
    subcategories: [
      { id: "5-1", name: "Castele gonflabile", nameEn: "Bouncy castles", description: "Castele gonflabile pentru petreceri copii", descriptionEn: "Bouncy castles for kids' parties", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
      { id: "5-2", name: "Piscine gonflabile", nameEn: "Inflatable pools", description: "Piscine gonflabile de diverse dimensiuni", descriptionEn: "Inflatable pools of various sizes", image: "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=400&q=80" },
      { id: "5-3", name: "Tobogane gonflabile", nameEn: "Inflatable slides", description: "Tobogane distractive pentru copii", descriptionEn: "Fun slides for kids", image: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400&q=80" },
      { id: "5-4", name: "Mini-parcuri gonflabile", nameEn: "Inflatable mini parks", description: "Parcuri complete de joacă gonflabile", descriptionEn: "Complete inflatable playgrounds", image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&q=80" },
      { id: "5-5", name: "Mașinuțe electrice", nameEn: "Electric toy cars", description: "Mașinuțe electrice pentru copii", descriptionEn: "Electric toy cars for kids", image: "https://images.unsplash.com/photo-1594787318286-3d000a50f0dc?w=400&q=80" },
      { id: "5-6", name: "Triciclete / trotinete copii", nameEn: "Kids' tricycles / scooters", description: "Vehicule pentru copii de toate vârstele", descriptionEn: "Vehicles for kids of all ages", image: "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=400&q=80" },
      { id: "5-7", name: "Seturi petreceri", nameEn: "Party sets", description: "Seturi complete pentru petreceri tematice", descriptionEn: "Complete sets for themed parties", image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80" },
    ],
  },
  {
    id: 6,
    slug: "gaming-electronice",
    name: "GAMING & ELECTRONICE",
    nameEn: "GAMING & ELECTRONICS",
    icon: "🎮",
    subcategories: [
      { id: "6-1", name: "Console PlayStation", nameEn: "PlayStation consoles", description: "Console PlayStation pentru gaming", descriptionEn: "PlayStation consoles for gaming", image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&q=80" },
      { id: "6-2", name: "Xbox", nameEn: "Xbox", description: "Console Xbox pentru jocuri video", descriptionEn: "Xbox consoles for video games", image: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400&q=80" },
      { id: "6-3", name: "Nintendo Switch / Wii", nameEn: "Nintendo Switch / Wii", description: "Console Nintendo pentru distracție", descriptionEn: "Nintendo consoles for fun", image: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&q=80" },
      { id: "6-4", name: "Jocuri console", nameEn: "Console games", description: "Colecție de jocuri pentru toate consolele", descriptionEn: "Game collection for all consoles", image: "/jocuri-console.png" },
      { id: "6-5", name: "VR headset", nameEn: "VR headset", description: "Căști de realitate virtuală", descriptionEn: "Virtual reality headsets", image: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=400&q=80" },
      { id: "6-6", name: "Laptopuri gaming", nameEn: "Gaming laptops", description: "Laptopuri performante pentru gaming", descriptionEn: "High-performance gaming laptops", image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&q=80" },
      { id: "6-7", name: "Proiectoare", nameEn: "Projectors", description: "Proiectoare pentru home cinema", descriptionEn: "Projectors for home cinema", image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80" },
      { id: "6-8", name: "Boxe portabile", nameEn: "Portable speakers", description: "Boxe portabile de calitate", descriptionEn: "Quality portable speakers", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80" },
    ],
  },
  {
    id: 7,
    slug: "foto-video",
    name: "FOTO & VIDEO",
    nameEn: "PHOTO & VIDEO",
    icon: "📷",
    subcategories: [
      { id: "7-1", name: "Dronă", nameEn: "Drone", description: "Drone pentru fotografie și videografie aeriană", descriptionEn: "Drones for aerial photography and videography", image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&q=80" },
      { id: "7-2", name: "GoPro", nameEn: "GoPro", description: "Camere de acțiune pentru aventuri", descriptionEn: "Action cameras for adventures", image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&q=80" },
      { id: "7-3", name: "Gimbal", nameEn: "Gimbal", description: "Stabilizatoare pentru filmări fluide", descriptionEn: "Stabilizers for smooth filming", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80" },
      { id: "7-4", name: "DSLR / Mirrorless", nameEn: "DSLR / Mirrorless", description: "Camere profesionale foto și video", descriptionEn: "Professional photo and video cameras", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80" },
      { id: "7-5", name: "Lumini studio", nameEn: "Studio lights", description: "Echipament de iluminare pentru studio", descriptionEn: "Studio lighting equipment", image: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400&q=80" },
      { id: "7-6", name: "Trepiede", nameEn: "Tripods", description: "Trepiede stabile pentru orice cameră", descriptionEn: "Stable tripods for any camera", image: "https://images.unsplash.com/photo-1585753402928-97a0399f5b43?w=400&q=80" },
      { id: "7-7", name: "Kit vlogging", nameEn: "Vlogging kit", description: "Seturi complete pentru vlogging", descriptionEn: "Complete vlogging sets", image: "https://images.unsplash.com/photo-1597423498219-04418210827d?w=400&q=80" },
    ],
  },
  {
    id: 8,
    slug: "mobilitate-urbana",
    name: "MOBILITATE URBANĂ",
    nameEn: "URBAN MOBILITY",
    icon: "🛴",
    subcategories: [
      { id: "8-1", name: "Trotinete electrice", nameEn: "Electric scooters", description: "Trotinete pentru transport urban rapid", descriptionEn: "Scooters for fast urban transport", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
      { id: "8-2", name: "Biciclete electrice", nameEn: "Electric bicycles", description: "E-bikes pentru naveta zilnică", descriptionEn: "E-bikes for daily commute", image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&q=80" },
      { id: "8-3", name: "Scutere / mopede", nameEn: "Scooters / mopeds", description: "Scutere pentru deplasări în oraș", descriptionEn: "Scooters for city travel", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80" },
      { id: "8-4", name: "Monocicluri electrice", nameEn: "Electric unicycles", description: "Monocicluri electrice pentru transport alternativ", descriptionEn: "Electric unicycles for alternative transport", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
    ],
  },
  {
    id: 9,
    slug: "evenimente-hobby",
    name: "EVENIMENTE & HOBBY",
    nameEn: "EVENTS & HOBBY",
    icon: "🎉",
    subcategories: [
      { id: "9-1", name: "Corturi mari", nameEn: "Large tents", description: "Corturi pentru evenimente mari", descriptionEn: "Tents for large events", image: "https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=400&q=80" },
      { id: "9-2", name: "Generatoare", nameEn: "Generators", description: "Generatoare electrice pentru orice locație", descriptionEn: "Electric generators for any location", image: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=400&q=80" },
      { id: "9-3", name: "Mașini fum", nameEn: "Fog machines", description: "Mașini de fum pentru efecte speciale", descriptionEn: "Fog machines for special effects", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80" },
      { id: "9-4", name: "Mașini bubble", nameEn: "Bubble machines", description: "Mașini de bule pentru petreceri", descriptionEn: "Bubble machines for parties", image: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=400&q=80" },
      { id: "9-5", name: "Mașini gheață", nameEn: "Ice machines", description: "Mașini pentru gheață artificială", descriptionEn: "Machines for artificial ice", image: "https://images.unsplash.com/photo-1543007631-283050bb3e8c?w=400&q=80" },
      { id: "9-6", name: "Sonorizare", nameEn: "Sound systems", description: "Sisteme de sonorizare profesionale", descriptionEn: "Professional sound systems", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80" },
      { id: "9-7", name: "Grătare", nameEn: "Grills", description: "Grătare pentru evenimente outdoor", descriptionEn: "Grills for outdoor events", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80" },
      { id: "9-8", name: "Grătare profesionale", nameEn: "Professional grills", description: "Grătare de capacitate mare", descriptionEn: "High-capacity grills", image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80" },
      { id: "9-9", name: "Lămpi decorative", nameEn: "Decorative lamps", description: "Iluminat decorativ pentru evenimente", descriptionEn: "Decorative lighting for events", image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&q=80" },
      { id: "9-10", name: "Aparat popcorn", nameEn: "Popcorn machine", description: "Aparate pentru popcorn proaspăt", descriptionEn: "Machines for fresh popcorn", image: "https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400&q=80" },
      { id: "9-11", name: "Aparat vată de zahăr", nameEn: "Cotton candy machine", description: "Aparate pentru vată de zahăr", descriptionEn: "Machines for cotton candy", image: "https://images.unsplash.com/photo-1567400358593-9595e6127df4?w=400&q=80" },
    ],
  },
  {
    id: 10,
    slug: "instrumente-muzicale-dj",
    name: "INSTRUMENTE MUZICALE & DJ",
    nameEn: "MUSICAL INSTRUMENTS & DJ",
    icon: "🎸",
    subcategories: [
      { id: "10-1", name: "Mixere DJ", nameEn: "DJ mixers", description: "Mixere profesionale pentru DJ", descriptionEn: "Professional DJ mixers", image: "https://images.unsplash.com/photo-1571935441003-93cdc0c13e49?w=400&q=80" },
      { id: "10-2", name: "Boxe profesionale", nameEn: "Professional speakers", description: "Sisteme audio de înaltă calitate", descriptionEn: "High-quality audio systems", image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&q=80" },
      { id: "10-3", name: "Microfoane", nameEn: "Microphones", description: "Microfoane pentru studio și live", descriptionEn: "Microphones for studio and live", image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80" },
      { id: "10-4", name: "Karaoke set", nameEn: "Karaoke set", description: "Seturi complete pentru karaoke", descriptionEn: "Complete karaoke sets", image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&q=80" },
      { id: "10-5", name: "Chitare", nameEn: "Guitars", description: "Chitare acustice și electrice", descriptionEn: "Acoustic and electric guitars", image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&q=80" },
      { id: "10-6", name: "Tastaturi", nameEn: "Keyboards", description: "Piane și sintetizatoare", descriptionEn: "Pianos and synthesizers", image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&q=80" },
      { id: "10-7", name: "Amplificatoare", nameEn: "Amplifiers", description: "Amplificatoare pentru instrumente", descriptionEn: "Amplifiers for instruments", image: "https://images.unsplash.com/photo-1558584673-90de4b16eb95?w=400&q=80" },
      { id: "10-8", name: "Seturi DJ", nameEn: "DJ sets", description: "Echipament complet pentru DJ", descriptionEn: "Complete DJ equipment", image: "https://images.unsplash.com/photo-1571935441003-93cdc0c13e49?w=400&q=80" },
    ],
  },
  {
    id: 11,
    slug: "fitness-wellness",
    name: "FITNESS & WELLNESS",
    nameEn: "FITNESS & WELLNESS",
    icon: "💪",
    subcategories: [
      { id: "11-1", name: "Benzi alergare", nameEn: "Treadmills", description: "Benzi de alergat pentru antrenamente acasă", descriptionEn: "Treadmills for home workouts", image: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&q=80" },
      { id: "11-2", name: "Biciclete indoor", nameEn: "Indoor bikes", description: "Biciclete de spinning și fitness", descriptionEn: "Spinning and fitness bikes", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80" },
      { id: "11-3", name: "Greutăți", nameEn: "Weights", description: "Gantere și haltere pentru antrenamente", descriptionEn: "Dumbbells and barbells for workouts", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80" },
      { id: "11-4", name: "Stepper", nameEn: "Stepper", description: "Steppere pentru cardio acasă", descriptionEn: "Steppers for home cardio", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80" },
      { id: "11-5", name: "Trambuline", nameEn: "Trampolines", description: "Trambuline pentru fitness și distracție", descriptionEn: "Trampolines for fitness and fun", image: "https://images.unsplash.com/photo-1626447857058-2ba6a8f6f29c?w=400&q=80" },
      { id: "11-6", name: "Aparate masaj", nameEn: "Massage devices", description: "Aparate de masaj pentru relaxare", descriptionEn: "Massage devices for relaxation", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80" },
      { id: "11-7", name: "Presoterapie", nameEn: "Pressotherapy", description: "Aparate de presoterapie", descriptionEn: "Pressotherapy devices", image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80" },
      { id: "11-8", name: "Kit yoga", nameEn: "Yoga kit", description: "Seturi complete pentru yoga", descriptionEn: "Complete yoga sets", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80" },
    ],
  },
  {
    id: 12,
    slug: "echipamente-medicale-recuperare",
    name: "ECHIPAMENTE MEDICALE & RECUPERARE",
    nameEn: "MEDICAL EQUIPMENT & RECOVERY",
    icon: "🏥",
    subcategories: [
      { id: "12-1", name: "Cărucioare", nameEn: "Wheelchairs", description: "Cărucioare cu rotile pentru mobilitate", descriptionEn: "Wheelchairs for mobility", image: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=400&q=80" },
      { id: "12-2", name: "Cârje", nameEn: "Crutches", description: "Cârje pentru recuperare", descriptionEn: "Crutches for recovery", image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&q=80" },
      { id: "12-3", name: "Cadre mers", nameEn: "Walking frames", description: "Cadre pentru asistență la mers", descriptionEn: "Frames for walking assistance", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80" },
      { id: "12-4", name: "Scaun WC mobil", nameEn: "Mobile toilet chair", description: "Scaune WC mobile pentru confort", descriptionEn: "Mobile toilet chairs for comfort", image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&q=80" },
      { id: "12-5", name: "Paturi medicale", nameEn: "Medical beds", description: "Paturi medicale reglabile", descriptionEn: "Adjustable medical beds", image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80" },
      { id: "12-6", name: "Saltele antiescare", nameEn: "Anti-bedsore mattresses", description: "Saltele speciale pentru prevenire escare", descriptionEn: "Special mattresses for bedsore prevention", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80" },
      { id: "12-7", name: "Nebulizator", nameEn: "Nebulizer", description: "Nebulizatoare pentru tratamente respiratorii", descriptionEn: "Nebulizers for respiratory treatments", image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&q=80" },
      { id: "12-8", name: "Aparat tensiune", nameEn: "Blood pressure monitor", description: "Aparate pentru măsurare tensiune", descriptionEn: "Blood pressure measuring devices", image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80" },
      { id: "12-9", name: "Lift pacient", nameEn: "Patient lift", description: "Lifturi pentru transfer pacienți", descriptionEn: "Lifts for patient transfer", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80" },
      { id: "12-10", name: "Orteze", nameEn: "Orthoses", description: "Orteze și suporturi ortopedice", descriptionEn: "Orthoses and orthopedic supports", image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&q=80" },
      { id: "12-11", name: "Rampe scări", nameEn: "Stair ramps", description: "Rampe pentru accesibilitate", descriptionEn: "Ramps for accessibility", image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80" },
      { id: "12-12", name: "Proteze temporare", nameEn: "Temporary prostheses", description: "Proteze pentru recuperare temporară", descriptionEn: "Prostheses for temporary recovery", image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&q=80" },
    ],
  },
  {
    id: 13,
    slug: "animale-companie",
    name: "ANIMALE DE COMPANIE",
    nameEn: "PETS",
    icon: "🐾",
    subcategories: [
      { id: "13-1", name: "Cuști transport", nameEn: "Transport crates", description: "Cuști S–XL, boxe auto, trolere, rucsacuri", descriptionEn: "Crates S–XL, car boxes, trolleys, backpacks", image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&q=80" },
      { id: "13-2", name: "Țarcuri și garduri", nameEn: "Pens and fences", description: "Țarcuri, paturi ortopedice, ansambluri pisici", descriptionEn: "Pens, orthopedic beds, cat assemblies", image: "https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=400&q=80" },
      { id: "13-3", name: "Grooming", nameEn: "Grooming", description: "Mașini tuns, aspiratoare blană, blower", descriptionEn: "Clippers, fur vacuums, blowers", image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&q=80" },
      { id: "13-4", name: "Dresaj", nameEn: "Training", description: "Zgărzi smart, clicker, ultrasunete, agility", descriptionEn: "Smart collars, clickers, ultrasound, agility", image: "https://images.unsplash.com/photo-1558929996-da64ba858215?w=400&q=80" },
      { id: "13-5", name: "Camping animale", nameEn: "Pet camping", description: "Corturi, paturi, cutii termoizolate", descriptionEn: "Tents, beds, insulated boxes", image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80" },
    ],
  },
  {
    id: 14,
    slug: "remorci-transport",
    name: "REMORCI & TRANSPORT",
    nameEn: "TRAILERS & TRANSPORT",
    icon: "🚚",
    subcategories: [
      { id: "14-1", name: "Remorci mici", nameEn: "Small trailers", description: "Remorci mici pentru transport diverse", descriptionEn: "Small trailers for various transport", image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&q=80" },
      { id: "14-2", name: "Transport auto", nameEn: "Car transport", description: "Remorci pentru transport auto", descriptionEn: "Trailers for car transport", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
      { id: "14-3", name: "Remorci motociclete", nameEn: "Motorcycle trailers", description: "Remorci pentru motociclete", descriptionEn: "Trailers for motorcycles", image: "https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=400&q=80" },
      { id: "14-4", name: "Remorci închise", nameEn: "Enclosed trailers", description: "Remorci închise pentru securitate", descriptionEn: "Enclosed trailers for security", image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&q=80" },
      { id: "14-5", name: "Remorci utilitare", nameEn: "Utility trailers", description: "Remorci pentru uz general", descriptionEn: "Trailers for general use", image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&q=80" },
      { id: "14-6", name: "Remorci agricole mici", nameEn: "Small farm trailers", description: "Remorci pentru uz agricol", descriptionEn: "Trailers for agricultural use", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80" },
    ],
  },
  {
    id: 15,
    slug: "bebe-family-rentals",
    name: "BEBE & FAMILY RENTALS",
    nameEn: "BABY & FAMILY RENTALS",
    icon: "👶",
    subcategories: [
      { id: "15-1", name: "Cărucioare premium", nameEn: "Premium strollers", description: "Cărucioare de calitate pentru bebeluși", descriptionEn: "Quality strollers for babies", image: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=400&q=80" },
      { id: "15-2", name: "Scoici auto", nameEn: "Car seats (infant)", description: "Scoici auto pentru nou-născuți", descriptionEn: "Car seats for newborns", image: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=400&q=80" },
      { id: "15-3", name: "Scaune auto", nameEn: "Car seats", description: "Scaune auto pentru copii", descriptionEn: "Car seats for children", image: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=400&q=80" },
      { id: "15-4", name: "Leagăne automate", nameEn: "Automatic swings", description: "Leagăne electrice pentru bebeluși", descriptionEn: "Electric swings for babies", image: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=400&q=80" },
      { id: "15-5", name: "Pătuțuri portabile", nameEn: "Portable cribs", description: "Pătuțuri pliabile pentru călătorii", descriptionEn: "Foldable cribs for travel", image: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=400&q=80" },
      { id: "15-6", name: "Sterilizatoare", nameEn: "Sterilizers", description: "Sterilizatoare pentru biberoane", descriptionEn: "Sterilizers for baby bottles", image: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=400&q=80" },
      { id: "15-7", name: "Baby monitor", nameEn: "Baby monitor", description: "Monitoare audio și video pentru bebeluși", descriptionEn: "Audio and video baby monitors", image: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=400&q=80" },
    ],
  },
  {
    id: 16,
    slug: "imprimante-3d-cnc",
    name: "IMPRIMANTE 3D & CNC",
    nameEn: "3D PRINTERS & CNC",
    icon: "🖨️",
    subcategories: [
      { id: "16-1", name: "Imprimante 3D", nameEn: "3D printers", description: "Imprimante 3D pentru prototipare", descriptionEn: "3D printers for prototyping", image: "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=400&q=80" },
      { id: "16-2", name: "Filamente", nameEn: "Filaments", description: "Filamente diverse pentru printare 3D", descriptionEn: "Various filaments for 3D printing", image: "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=400&q=80" },
      { id: "16-3", name: "Mini CNC", nameEn: "Mini CNC", description: "Mașini CNC pentru gravură și frezare", descriptionEn: "CNC machines for engraving and milling", image: "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=400&q=80" },
      { id: "16-4", name: "Gravură laser", nameEn: "Laser engraving", description: "Echipament pentru gravură laser", descriptionEn: "Laser engraving equipment", image: "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=400&q=80" },
      { id: "16-5", name: "Kit electronică", nameEn: "Electronics kit", description: "Kituri pentru proiecte electronice", descriptionEn: "Kits for electronic projects", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80" },
    ],
  },
  {
    id: 17,
    slug: "telescop-observatie",
    name: "TELESCOP & OBSERVAȚIE",
    nameEn: "TELESCOPES & OBSERVATION",
    icon: "🔭",
    subcategories: [
      { id: "17-1", name: "Telescoape", nameEn: "Telescopes", description: "Telescoape pentru observații astronomice", descriptionEn: "Telescopes for astronomical observations", image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80" },
      { id: "17-2", name: "Lunete", nameEn: "Spotting scopes", description: "Lunete pentru observații", descriptionEn: "Spotting scopes for observations", image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80" },
      { id: "17-3", name: "Binocluri profesionale", nameEn: "Professional binoculars", description: "Binocluri de calitate superioară", descriptionEn: "Superior quality binoculars", image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80" },
      { id: "17-4", name: "Accesorii astronomie", nameEn: "Astronomy accessories", description: "Accesorii pentru observații astronomice", descriptionEn: "Accessories for astronomical observations", image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&q=80" },
    ],
  },
  {
    id: 19,
    slug: "nunti-evenimente-premium",
    name: "NUNȚI & EVENIMENTE PREMIUM",
    nameEn: "WEDDINGS & PREMIUM EVENTS",
    icon: "💒",
    subcategories: [
      { id: "19-1", name: "Arcade florale", nameEn: "Floral arches", description: "Arcade decorative pentru ceremonii", descriptionEn: "Decorative arches for ceremonies", image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80" },
      { id: "19-2", name: "Decoruri mari", nameEn: "Large décor", description: "Decorațiuni impresionante pentru evenimente", descriptionEn: "Impressive decorations for events", image: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&q=80" },
      { id: "19-3", name: "Lămpi industriale", nameEn: "Industrial lamps", description: "Iluminat industrial decorativ", descriptionEn: "Decorative industrial lighting", image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&q=80" },
      { id: "19-4", name: "Mese / scaune elegante", nameEn: "Elegant tables / chairs", description: "Mobilier elegant pentru evenimente", descriptionEn: "Elegant furniture for events", image: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&q=80" },
      { id: "19-5", name: "Photo booth", nameEn: "Photo booth", description: "Photo booth pentru amintiri speciale", descriptionEn: "Photo booth for special memories", image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&q=80" },
      { id: "19-6", name: "Proiectoare lumini", nameEn: "Light projectors", description: "Efecte de lumină pentru petreceri", descriptionEn: "Light effects for parties", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80" },
    ],
  },
  {
    id: 20,
    slug: "costume-recuzita",
    name: "COSTUME & RECUZITĂ",
    nameEn: "COSTUMES & PROPS",
    icon: "🎭",
    subcategories: [
      { id: "20-1", name: "Costume copii", nameEn: "Kids' costumes", description: "Costume pentru copii de toate vârstele", descriptionEn: "Costumes for kids of all ages", image: "https://images.unsplash.com/photo-1509909756405-be0199881695?w=400&q=80" },
      { id: "20-2", name: "Mascote", nameEn: "Mascots", description: "Costume mascote pentru evenimente", descriptionEn: "Mascot costumes for events", image: "https://images.unsplash.com/photo-1509909756405-be0199881695?w=400&q=80" },
      { id: "20-3", name: "Costume teatru / film", nameEn: "Theater / film costumes", description: "Costume profesionale pentru producții", descriptionEn: "Professional costumes for productions", image: "https://images.unsplash.com/photo-1509909756405-be0199881695?w=400&q=80" },
      { id: "20-4", name: "Costume tematice", nameEn: "Themed costumes", description: "Costume pentru petreceri tematice", descriptionEn: "Costumes for themed parties", image: "https://images.unsplash.com/photo-1509909756405-be0199881695?w=400&q=80" },
      { id: "20-5", name: "Recuzită foto/video", nameEn: "Photo/video props", description: "Accesorii pentru ședințe foto/video", descriptionEn: "Accessories for photo/video sessions", image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&q=80" },
    ],
  },
  {
    id: 21,
    name: "INDUSTRIAL CLEANING",
    nameEn: "INDUSTRIAL CLEANING",
    icon: "🧹",
    subcategories: [
      { id: "21-1", name: "Monodisc profesional", nameEn: "Professional rotary machine", description: "Mașini monodisc pentru curățenie", descriptionEn: "Rotary machines for cleaning", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&q=80" },
      { id: "21-2", name: "Mașină spălat pardoseli", nameEn: "Floor scrubber", description: "Mașini profesionale pentru pardoseli", descriptionEn: "Professional floor scrubbing machines", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&q=80" },
      { id: "21-3", name: "Aparat aburi industrial", nameEn: "Industrial steam cleaner", description: "Curățare cu aburi la nivel industrial", descriptionEn: "Industrial-level steam cleaning", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&q=80" },
      { id: "21-4", name: "Aparat spălat geamuri telescopic", nameEn: "Telescopic window cleaner", description: "Curățare geamuri la înălțime", descriptionEn: "Window cleaning at height", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&q=80" },
      { id: "21-5", name: "Aspiratoare industriale", nameEn: "Industrial vacuums", description: "Aspiratoare de capacitate mare", descriptionEn: "High-capacity vacuum cleaners", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&q=80" },
    ],
  },
  {
    id: 22,
    name: "RULOTE & CAMPERVAN-URI",
    nameEn: "RVs & CAMPERVANS",
    icon: "🚐",
    subcategories: [
      { id: "22-1", name: "Rulotă", nameEn: "Caravan", description: "Rulote pentru vacanțe în natură", descriptionEn: "Caravans for nature vacations", image: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=400&q=80" },
      { id: "22-2", name: "Campervan", nameEn: "Campervan", description: "Campervan-uri complet echipate", descriptionEn: "Fully equipped campervans", image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=400&q=80" },
      { id: "22-3", name: "Remorcă cort", nameEn: "Tent trailer", description: "Remorci cu cort integrat", descriptionEn: "Trailers with integrated tent", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&q=80" },
      { id: "22-4", name: "Remorcă offroad camping", nameEn: "Offroad camping trailer", description: "Remorci pentru camping offroad", descriptionEn: "Trailers for offroad camping", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&q=80" },
    ],
  },
];

export const getAllSubcategories = () => {
  return categories.flatMap((cat) =>
    cat.subcategories.map((sub) => ({
      ...sub,
      categoryId: cat.id,
      categoryName: cat.name,
      categoryNameEn: cat.nameEn,
    }))
  );
};

export const getCategoryById = (id: number) => {
  return categories.find((cat) => cat.id === id);
};

export const searchCategories = (query: string) => {
  const lowerQuery = query.toLowerCase();
  
  const matchingCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(lowerQuery) || cat.nameEn.toLowerCase().includes(lowerQuery)
  );
  
  const matchingSubcategories = getAllSubcategories().filter(
    (sub) =>
      sub.name.toLowerCase().includes(lowerQuery) ||
      sub.nameEn.toLowerCase().includes(lowerQuery) ||
      sub.description.toLowerCase().includes(lowerQuery) ||
      sub.descriptionEn.toLowerCase().includes(lowerQuery)
  );
  
  return { matchingCategories, matchingSubcategories };
};
