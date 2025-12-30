export interface Subcategory {
  id: string;
  name: string;
  description: string;
  image: string;
}

export interface Category {
  id: number;
  name: string;
  subcategories: Subcategory[];
  icon: string;
}

export const categories: Category[] = [
  {
    id: 1,
    name: "OUTDOOR & AVENTURĂ",
    icon: "🚴",
    subcategories: [
      { id: "1-1", name: "Biciclete", description: "Biciclete pentru toate tipurile de trasee și activități", image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&q=80" },
      { id: "1-2", name: "MTB / Downhill", description: "Biciclete de munte pentru trasee off-road", image: "https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=400&q=80" },
      { id: "1-3", name: "Trotinete electrice", description: "Trotinete electrice pentru mobilitate urbană", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
      { id: "1-4", name: "ATV-uri", description: "Vehicule all-terrain pentru aventuri extreme", image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&q=80" },
      { id: "1-5", name: "Scutere", description: "Scutere pentru deplasări rapide și convenabile", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80" },
      { id: "1-6", name: "E-bike", description: "Biciclete electrice cu asistență la pedalare", image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&q=80" },
      { id: "1-7", name: "Role / patine", description: "Echipament pentru patinaj și role", image: "https://images.unsplash.com/photo-1593786267440-e3d5e0fd47d1?w=400&q=80" },
      { id: "1-8", name: "Caiace", description: "Caiace pentru aventuri pe apă", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80" },
      { id: "1-9", name: "Canoe", description: "Canoe pentru excursii pe râuri și lacuri", image: "https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=400&q=80" },
      { id: "1-10", name: "SUP boards", description: "Plăci stand-up paddle pentru relaxare pe apă", image: "https://images.unsplash.com/photo-1499260662818-9c4c01d7cf6f?w=400&q=80" },
      { id: "1-11", name: "Bărci / ambarcațiuni mici", description: "Bărci și ambarcațiuni pentru activități nautice", image: "https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=400&q=80" },
      { id: "1-12", name: "Echipament pescuit", description: "Unelte și accesorii complete pentru pescuit", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80" },
    ],
  },
  {
    id: 2,
    name: "CAMPING & DRUMEȚII",
    icon: "⛺",
    subcategories: [
      { id: "2-1", name: "Corturi 1–8 persoane", description: "Corturi pentru grupuri mici și medii", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&q=80" },
      { id: "2-2", name: "Corturi mari evenimente", description: "Corturi spațioase pentru evenimente în aer liber", image: "https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=400&q=80" },
      { id: "2-3", name: "Saltele + saci de dormit", description: "Echipament confortabil pentru noapte", image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&q=80" },
      { id: "2-4", name: "Mese + scaune camping", description: "Mobilier portabil pentru camping", image: "https://images.unsplash.com/photo-1517824806704-9040b037703b?w=400&q=80" },
      { id: "2-5", name: "Rucsacuri trekking", description: "Rucsacuri durabile pentru drumeții lungi", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80" },
      { id: "2-6", name: "Arzătoare & seturi gătit", description: "Echipament pentru gătit în natură", image: "https://images.unsplash.com/photo-1510672981848-a1c4f1cb5ccf?w=400&q=80" },
      { id: "2-7", name: "Hamace", description: "Hamace confortabile pentru relaxare", image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80" },
      { id: "2-8", name: "Lanterne / frontale", description: "Iluminat portabil pentru aventuri nocturne", image: "https://images.unsplash.com/photo-1493673272479-a20888bcee10?w=400&q=80" },
      { id: "2-9", name: "Bocanci / rachete zăpadă", description: "Încălțăminte și echipament pentru zăpadă", image: "https://images.unsplash.com/photo-1520201163981-8cc95007dd2a?w=400&q=80" },
    ],
  },
  {
    id: 3,
    name: "SPORTURI DE IARNĂ",
    icon: "🎿",
    subcategories: [
      { id: "3-1", name: "Sănii", description: "Sănii pentru distracție pe zăpadă", image: "https://images.unsplash.com/photo-1482005253821-5d6a2c685879?w=400&q=80" },
      { id: "3-2", name: "Schiuri", description: "Schiuri pentru toate nivelurile de experiență", image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&q=80" },
      { id: "3-3", name: "Snowboard", description: "Plăci snowboard pentru iubitorii de adrenalină", image: "https://images.unsplash.com/photo-1478700485868-972b69dc3fc4?w=400&q=80" },
      { id: "3-4", name: "Boots", description: "Încălțăminte specializată pentru sporturi de iarnă", image: "https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=400&q=80" },
      { id: "3-5", name: "Căști & protecții", description: "Echipament de siguranță pentru schi și snowboard", image: "https://images.unsplash.com/photo-1565992441121-4367c2967103?w=400&q=80" },
      { id: "3-6", name: "Set complet schi", description: "Pachete complete cu tot echipamentul necesar", image: "https://images.unsplash.com/photo-1486915309851-b0cc1f8a0084?w=400&q=80" },
    ],
  },
  {
    id: 4,
    name: "SCULE, UNELTE & CONSTRUCȚII",
    icon: "🔧",
    subcategories: [
      { id: "4-1", name: "Scule electrice", description: "Bormașini, rotopercutoare, polizoare, freze", image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80" },
      { id: "4-2", name: "Echipamente profesionale", description: "Compresoare, generatoare, laser nivelare, sudură", image: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400&q=80" },
      { id: "4-3", name: "Scule grădină", description: "Mașini tuns gazon, trimmere, foarfeci electrice", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80" },
      { id: "4-4", name: "Unelte auto", description: "Cric, chei dinamometrice, tachelaj auto", image: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&q=80" },
      { id: "4-5", name: "Aspiratoare", description: "Simple, industriale, cu apă, injecție-extracție", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&q=80" },
      { id: "4-6", name: "Betoniere electrice", description: "Betoniere pentru proiecte de construcție", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80" },
      { id: "4-7", name: "Plăci compactoare", description: "Echipament pentru compactare sol", image: "https://images.unsplash.com/photo-1541123603104-512919d6a96c?w=400&q=80" },
      { id: "4-8", name: "Lift panouri", description: "Lifturi pentru manipulare panouri grele", image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80" },
      { id: "4-9", name: "Scări 5–12 m", description: "Scări extensibile pentru lucru la înălțime", image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80" },
      { id: "4-10", name: "Ciocan demolator", description: "Ciocane demolatoare profesionale", image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&q=80" },
      { id: "4-11", name: "Generator mare", description: "Generatoare de putere mare", image: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=400&q=80" },
      { id: "4-12", name: "Pompe de apă", description: "Submersibile, suprafață, drenaj, hidrofoare", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80" },
      { id: "4-13", name: "Sisteme irigații", description: "Sisteme complete de irigații", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80" },
      { id: "4-14", name: "Aspersoare profesionale", description: "Aspersoare pentru grădini și terenuri", image: "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=400&q=80" },
    ],
  },
  {
    id: 5,
    name: "JUCĂRII GONFLABILE & COPII",
    icon: "🎈",
    subcategories: [
      { id: "5-1", name: "Castele gonflabile", description: "Castele gonflabile pentru petreceri copii", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
      { id: "5-2", name: "Piscine gonflabile", description: "Piscine gonflabile de diverse dimensiuni", image: "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=400&q=80" },
      { id: "5-3", name: "Tobogane gonflabile", description: "Tobogane distractive pentru copii", image: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400&q=80" },
      { id: "5-4", name: "Mini-parcuri gonflabile", description: "Parcuri complete de joacă gonflabile", image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&q=80" },
      { id: "5-5", name: "Mașinuțe electrice", description: "Mașinuțe electrice pentru copii", image: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=400&q=80" },
      { id: "5-6", name: "Triciclete / trotinete copii", description: "Vehicule pentru copii de toate vârstele", image: "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=400&q=80" },
      { id: "5-7", name: "Seturi petreceri", description: "Seturi complete pentru petreceri tematice", image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80" },
    ],
  },
  {
    id: 6,
    name: "GAMING & ELECTRONICE",
    icon: "🎮",
    subcategories: [
      { id: "6-1", name: "Console PlayStation", description: "Console PlayStation pentru gaming", image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&q=80" },
      { id: "6-2", name: "Xbox", description: "Console Xbox pentru jocuri video", image: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400&q=80" },
      { id: "6-3", name: "Nintendo Switch / Wii", description: "Console Nintendo pentru distracție", image: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&q=80" },
      { id: "6-4", name: "Jocuri console", description: "Colecție de jocuri pentru toate consolele", image: "/jocuri-console.png" },
      { id: "6-5", name: "VR headset", description: "Căști de realitate virtuală", image: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=400&q=80" },
      { id: "6-6", name: "Laptopuri gaming", description: "Laptopuri performante pentru gaming", image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&q=80" },
      { id: "6-7", name: "Proiectoare", description: "Proiectoare pentru home cinema", image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80" },
      { id: "6-8", name: "Boxe portabile", description: "Boxe portabile de calitate", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80" },
    ],
  },
  {
    id: 7,
    name: "FOTO & VIDEO",
    icon: "📷",
    subcategories: [
      { id: "7-1", name: "Dronă", description: "Drone pentru fotografie și videografie aeriană", image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&q=80" },
      { id: "7-2", name: "GoPro", description: "Camere de acțiune pentru aventuri", image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&q=80" },
      { id: "7-3", name: "Gimbal", description: "Stabilizatoare pentru filmări fluide", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80" },
      { id: "7-4", name: "DSLR / Mirrorless", description: "Camere profesionale foto și video", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80" },
      { id: "7-5", name: "Lumini studio", description: "Echipament de iluminare pentru studio", image: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400&q=80" },
      { id: "7-6", name: "Trepiede", description: "Trepiede stabile pentru orice cameră", image: "https://images.unsplash.com/photo-1585753402928-97a0399f5b43?w=400&q=80" },
      { id: "7-7", name: "Kit vlogging", description: "Seturi complete pentru vlogging", image: "https://images.unsplash.com/photo-1597423498219-04418210827d?w=400&q=80" },
    ],
  },
  {
    id: 8,
    name: "MOBILITATE URBANĂ",
    icon: "🛴",
    subcategories: [
      { id: "8-1", name: "Trotinete electrice", description: "Trotinete pentru transport urban rapid", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
      { id: "8-2", name: "Biciclete electrice", description: "E-bikes pentru naveta zilnică", image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&q=80" },
      { id: "8-3", name: "Scutere / mopede", description: "Scutere pentru deplasări în oraș", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80" },
      { id: "8-4", name: "Monocicluri electrice", description: "Monocicluri electrice pentru transport alternativ", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
    ],
  },
  {
    id: 9,
    name: "EVENIMENTE & HOBBY",
    icon: "🎉",
    subcategories: [
      { id: "9-1", name: "Corturi mari", description: "Corturi pentru evenimente mari", image: "https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=400&q=80" },
      { id: "9-2", name: "Generatoare", description: "Generatoare electrice pentru orice locație", image: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=400&q=80" },
      { id: "9-3", name: "Mașini fum", description: "Mașini de fum pentru efecte speciale", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80" },
      { id: "9-4", name: "Mașini bubble", description: "Mașini de bule pentru petreceri", image: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=400&q=80" },
      { id: "9-5", name: "Mașini gheață", description: "Mașini pentru gheață artificială", image: "https://images.unsplash.com/photo-1543007631-283050bb3e8c?w=400&q=80" },
      { id: "9-6", name: "Sonorizare", description: "Sisteme de sonorizare profesionale", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80" },
      { id: "9-7", name: "Grătare", description: "Grătare pentru evenimente outdoor", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80" },
      { id: "9-8", name: "Grătare profesionale", description: "Grătare de capacitate mare", image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80" },
      { id: "9-9", name: "Lămpi decorative", description: "Iluminat decorativ pentru evenimente", image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&q=80" },
      { id: "9-10", name: "Aparat popcorn", description: "Aparate pentru popcorn proaspăt", image: "https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400&q=80" },
      { id: "9-11", name: "Aparat vată de zahăr", description: "Aparate pentru vată de zahăr", image: "https://images.unsplash.com/photo-1567400358593-9595e6127df4?w=400&q=80" },
    ],
  },
  {
    id: 10,
    name: "INSTRUMENTE MUZICALE & DJ",
    icon: "🎸",
    subcategories: [
      { id: "10-1", name: "Mixere DJ", description: "Mixere profesionale pentru DJ", image: "https://images.unsplash.com/photo-1571935441003-93cdc0c13e49?w=400&q=80" },
      { id: "10-2", name: "Boxe profesionale", description: "Sisteme audio de înaltă calitate", image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&q=80" },
      { id: "10-3", name: "Microfoane", description: "Microfoane pentru studio și live", image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80" },
      { id: "10-4", name: "Karaoke set", description: "Seturi complete pentru karaoke", image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&q=80" },
      { id: "10-5", name: "Chitare", description: "Chitare acustice și electrice", image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&q=80" },
      { id: "10-6", name: "Tastaturi", description: "Piane și sintetizatoare", image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&q=80" },
      { id: "10-7", name: "Amplificatoare", description: "Amplificatoare pentru instrumente", image: "https://images.unsplash.com/photo-1558584673-90de4b16eb95?w=400&q=80" },
      { id: "10-8", name: "Seturi DJ", description: "Echipament complet pentru DJ", image: "https://images.unsplash.com/photo-1571935441003-93cdc0c13e49?w=400&q=80" },
    ],
  },
  {
    id: 11,
    name: "FITNESS & WELLNESS",
    icon: "💪",
    subcategories: [
      { id: "11-1", name: "Benzi alergare", description: "Benzi de alergat pentru antrenamente acasă", image: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&q=80" },
      { id: "11-2", name: "Biciclete indoor", description: "Biciclete de spinning și fitness", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80" },
      { id: "11-3", name: "Greutăți", description: "Gantere și haltere pentru antrenamente", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80" },
      { id: "11-4", name: "Stepper", description: "Steppere pentru cardio acasă", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80" },
      { id: "11-5", name: "Trambuline", description: "Trambuline pentru fitness și distracție", image: "https://images.unsplash.com/photo-1626447857058-2ba6a8f6f29c?w=400&q=80" },
      { id: "11-6", name: "Aparate masaj", description: "Aparate de masaj pentru relaxare", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80" },
      { id: "11-7", name: "Presoterapie", description: "Aparate de presoterapie", image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80" },
      { id: "11-8", name: "Kit yoga", description: "Seturi complete pentru yoga", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80" },
    ],
  },
  {
    id: 12,
    name: "ECHIPAMENTE MEDICALE & RECUPERARE",
    icon: "🏥",
    subcategories: [
      { id: "12-1", name: "Cărucioare", description: "Cărucioare cu rotile pentru mobilitate", image: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=400&q=80" },
      { id: "12-2", name: "Cârje", description: "Cârje pentru recuperare", image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&q=80" },
      { id: "12-3", name: "Cadre mers", description: "Cadre pentru asistență la mers", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80" },
      { id: "12-4", name: "Scaun WC mobil", description: "Scaune WC mobile pentru confort", image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&q=80" },
      { id: "12-5", name: "Paturi medicale", description: "Paturi medicale reglabile", image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80" },
      { id: "12-6", name: "Saltele antiescare", description: "Saltele speciale pentru prevenire escare", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80" },
      { id: "12-7", name: "Nebulizator", description: "Nebulizatoare pentru tratamente respiratorii", image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&q=80" },
      { id: "12-8", name: "Aparat tensiune", description: "Aparate pentru măsurare tensiune", image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80" },
      { id: "12-9", name: "Lift pacient", description: "Lifturi pentru transfer pacienți", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80" },
      { id: "12-10", name: "Orteze", description: "Orteze și suporturi ortopedice", image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&q=80" },
      { id: "12-11", name: "Rampe scări", description: "Rampe pentru accesibilitate", image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80" },
      { id: "12-12", name: "Proteze temporare", description: "Proteze pentru recuperare temporară", image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&q=80" },
    ],
  },
  {
    id: 13,
    name: "ANIMALE DE COMPANIE",
    icon: "🐾",
    subcategories: [
      { id: "13-1", name: "Cuști transport", description: "Cuști S–XL, boxe auto, trolere, rucsacuri", image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&q=80" },
      { id: "13-2", name: "Țarcuri și garduri", description: "Țarcuri, paturi ortopedice, ansambluri pisici", image: "https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=400&q=80" },
      { id: "13-3", name: "Grooming", description: "Mașini tuns, aspiratoare blană, blower", image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&q=80" },
      { id: "13-4", name: "Dresaj", description: "Zgărzi smart, clicker, ultrasunete, agility", image: "https://images.unsplash.com/photo-1558929996-da64ba858215?w=400&q=80" },
      { id: "13-5", name: "Camping animale", description: "Corturi, paturi, cutii termoizolate", image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80" },
    ],
  },
  {
    id: 14,
    name: "REMORCI & TRANSPORT",
    icon: "🚚",
    subcategories: [
      { id: "14-1", name: "Remorci mici", description: "Remorci mici pentru transport diverse", image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&q=80" },
      { id: "14-2", name: "Transport auto", description: "Remorci pentru transport auto", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
      { id: "14-3", name: "Remorci motociclete", description: "Remorci pentru motociclete", image: "https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=400&q=80" },
      { id: "14-4", name: "Remorci închise", description: "Remorci închise pentru securitate", image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&q=80" },
      { id: "14-5", name: "Remorci utilitare", description: "Remorci pentru uz general", image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&q=80" },
      { id: "14-6", name: "Remorci agricole mici", description: "Remorci pentru uz agricol", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80" },
    ],
  },
  {
    id: 15,
    name: "BEBE & FAMILY RENTALS",
    icon: "👶",
    subcategories: [
      { id: "15-1", name: "Cărucioare premium", description: "Cărucioare de calitate pentru bebeluși", image: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=400&q=80" },
      { id: "15-2", name: "Scoici auto", description: "Scoici auto pentru nou-născuți", image: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=400&q=80" },
      { id: "15-3", name: "Scaune auto", description: "Scaune auto pentru copii", image: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=400&q=80" },
      { id: "15-4", name: "Leagăne automate", description: "Leagăne electrice pentru bebeluși", image: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=400&q=80" },
      { id: "15-5", name: "Pătuțuri portabile", description: "Pătuțuri pliabile pentru călătorii", image: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=400&q=80" },
      { id: "15-6", name: "Sterilizatoare", description: "Sterilizatoare pentru biberoane", image: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=400&q=80" },
      { id: "15-7", name: "Baby monitor", description: "Monitoare audio și video pentru bebeluși", image: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=400&q=80" },
    ],
  },
  {
    id: 16,
    name: "IMPRIMANTE 3D & CNC",
    icon: "🖨️",
    subcategories: [
      { id: "16-1", name: "Imprimante 3D", description: "Imprimante 3D pentru prototipare", image: "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=400&q=80" },
      { id: "16-2", name: "Filamente", description: "Filamente diverse pentru printare 3D", image: "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=400&q=80" },
      { id: "16-3", name: "Mini CNC", description: "Mașini CNC pentru gravură și frezare", image: "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=400&q=80" },
      { id: "16-4", name: "Gravură laser", description: "Echipament pentru gravură laser", image: "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=400&q=80" },
      { id: "16-5", name: "Kit electronică", description: "Kituri pentru proiecte electronice", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80" },
    ],
  },
  {
    id: 17,
    name: "TELESCOP & OBSERVAȚIE",
    icon: "🔭",
    subcategories: [
      { id: "17-1", name: "Telescoape", description: "Telescoape pentru observații astronomice", image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80" },
      { id: "17-2", name: "Lunete", description: "Lunete pentru observații", image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80" },
      { id: "17-3", name: "Binocluri profesionale", description: "Binocluri de calitate superioară", image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80" },
      { id: "17-4", name: "Accesorii astronomie", description: "Accesorii pentru observații astronomice", image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&q=80" },
    ],
  },
  {
    id: 19,
    name: "NUNȚI & EVENIMENTE PREMIUM",
    icon: "💒",
    subcategories: [
      { id: "19-1", name: "Arcade florale", description: "Arcade decorative pentru ceremonii", image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80" },
      { id: "19-2", name: "Decoruri mari", description: "Decorațiuni impresionante pentru evenimente", image: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&q=80" },
      { id: "19-3", name: "Lămpi industriale", description: "Iluminat industrial decorativ", image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&q=80" },
      { id: "19-4", name: "Mese / scaune elegante", description: "Mobilier elegant pentru evenimente", image: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&q=80" },
      { id: "19-5", name: "Photo booth", description: "Photo booth pentru amintiri speciale", image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&q=80" },
      { id: "19-6", name: "Proiectoare lumini", description: "Efecte de lumină pentru petreceri", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80" },
    ],
  },
  {
    id: 20,
    name: "COSTUME & RECUZITĂ",
    icon: "🎭",
    subcategories: [
      { id: "20-1", name: "Costume copii", description: "Costume pentru copii de toate vârstele", image: "https://images.unsplash.com/photo-1509909756405-be0199881695?w=400&q=80" },
      { id: "20-2", name: "Mascote", description: "Costume mascote pentru evenimente", image: "https://images.unsplash.com/photo-1509909756405-be0199881695?w=400&q=80" },
      { id: "20-3", name: "Costume teatru / film", description: "Costume profesionale pentru producții", image: "https://images.unsplash.com/photo-1509909756405-be0199881695?w=400&q=80" },
      { id: "20-4", name: "Costume tematice", description: "Costume pentru petreceri tematice", image: "https://images.unsplash.com/photo-1509909756405-be0199881695?w=400&q=80" },
      { id: "20-5", name: "Recuzită foto/video", description: "Accesorii pentru ședințe foto/video", image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&q=80" },
    ],
  },
  {
    id: 21,
    name: "INDUSTRIAL CLEANING",
    icon: "🧹",
    subcategories: [
      { id: "21-1", name: "Monodisc profesional", description: "Mașini monodisc pentru curățenie", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&q=80" },
      { id: "21-2", name: "Mașină spălat pardoseli", description: "Mașini profesionale pentru pardoseli", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&q=80" },
      { id: "21-3", name: "Aparat aburi industrial", description: "Curățare cu aburi la nivel industrial", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&q=80" },
      { id: "21-4", name: "Aparat spălat geamuri telescopic", description: "Curățare geamuri la înălțime", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&q=80" },
      { id: "21-5", name: "Aspiratoare industriale", description: "Aspiratoare de capacitate mare", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&q=80" },
    ],
  },
  {
    id: 22,
    name: "RULOTE & CAMPERVAN-URI",
    icon: "🚐",
    subcategories: [
      { id: "22-1", name: "Rulotă", description: "Rulote pentru vacanțe în natură", image: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=400&q=80" },
      { id: "22-2", name: "Campervan", description: "Campervan-uri complet echipate", image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=400&q=80" },
      { id: "22-3", name: "Remorcă cort", description: "Remorci cu cort integrat", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&q=80" },
      { id: "22-4", name: "Remorcă offroad camping", description: "Remorci pentru camping offroad", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&q=80" },
    ],
  },
];

export const getAllSubcategories = () => {
  return categories.flatMap((cat) =>
    cat.subcategories.map((sub) => ({
      ...sub,
      categoryId: cat.id,
      categoryName: cat.name,
    }))
  );
};

export const getCategoryById = (id: number) => {
  return categories.find((cat) => cat.id === id);
};

export const searchCategories = (query: string) => {
  const lowerQuery = query.toLowerCase();
  
  const matchingCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(lowerQuery)
  );
  
  const matchingSubcategories = getAllSubcategories().filter(
    (sub) =>
      sub.name.toLowerCase().includes(lowerQuery) ||
      sub.description.toLowerCase().includes(lowerQuery)
  );
  
  return { matchingCategories, matchingSubcategories };
};
