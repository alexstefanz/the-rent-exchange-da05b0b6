export interface Localitate {
  name: string;
}

export interface Judet {
  name: string;
  localitati: string[];
}

export const judete: Judet[] = [
  {
    name: "Alba",
    localitati: ["Alba Iulia", "Sebeș", "Aiud", "Blaj", "Cugir", "Câmpeni", "Ocna Mureș", "Zlatna", "Teiuș", "Abrud"]
  },
  {
    name: "Arad",
    localitati: ["Arad", "Lipova", "Ineu", "Curtici", "Sebiș", "Chișineu-Criș", "Pâncota", "Sântana", "Nădlac", "Pecica"]
  },
  {
    name: "Argeș",
    localitati: ["Pitești", "Câmpulung", "Curtea de Argeș", "Mioveni", "Costești", "Topoloveni", "Ștefănești"]
  },
  {
    name: "Bacău",
    localitati: ["Bacău", "Onești", "Moinești", "Comănești", "Buhuși", "Dărmănești", "Târgu Ocna", "Slănic Moldova"]
  },
  {
    name: "Bihor",
    localitati: ["Oradea", "Salonta", "Marghita", "Beiuș", "Aleșd", "Ștei", "Nucet", "Valea lui Mihai", "Săcueni"]
  },
  {
    name: "Bistrița-Năsăud",
    localitati: ["Bistrița", "Năsăud", "Beclean", "Sângeorz-Băi"]
  },
  {
    name: "Botoșani",
    localitati: ["Botoșani", "Dorohoi", "Darabani", "Săveni", "Flămânzi", "Ștefănești", "Bucecea"]
  },
  {
    name: "Brașov",
    localitati: ["Brașov", "Făgăraș", "Săcele", "Codlea", "Zărnești", "Victoria", "Râșnov", "Rupea", "Predeal", "Ghimbav"]
  },
  {
    name: "Brăila",
    localitati: ["Brăila", "Ianca", "Făurei", "Însurăței"]
  },
  {
    name: "București",
    localitati: ["Sector 1", "Sector 2", "Sector 3", "Sector 4", "Sector 5", "Sector 6"]
  },
  {
    name: "Buzău",
    localitati: ["Buzău", "Râmnicu Sărat", "Nehoiu", "Pogoanele", "Pătârlagele"]
  },
  {
    name: "Caraș-Severin",
    localitati: ["Reșița", "Caransebeș", "Bocșa", "Moldova Nouă", "Oravița", "Anina", "Băile Herculane", "Oțelu Roșu"]
  },
  {
    name: "Călărași",
    localitati: ["Călărași", "Oltenița", "Budești", "Fundulea", "Lehliu Gară"]
  },
  {
    name: "Cluj",
    localitati: ["Cluj-Napoca", "Turda", "Dej", "Câmpia Turzii", "Gherla", "Huedin"]
  },
  {
    name: "Constanța",
    localitati: ["Constanța", "Mangalia", "Medgidia", "Năvodari", "Cernavodă", "Eforie", "Techirghiol", "Hârșova", "Ovidiu", "Murfatlar"]
  },
  {
    name: "Covasna",
    localitati: ["Sfântu Gheorghe", "Târgu Secuiesc", "Covasna", "Baraolt", "Întorsura Buzăului"]
  },
  {
    name: "Dâmbovița",
    localitati: ["Târgoviște", "Moreni", "Pucioasa", "Găești", "Titu", "Fieni", "Răcari"]
  },
  {
    name: "Dolj",
    localitati: ["Craiova", "Băilești", "Calafat", "Filiași", "Segarcea", "Bechet", "Dăbuleni"]
  },
  {
    name: "Galați",
    localitati: ["Galați", "Tecuci", "Târgu Bujor", "Berești"]
  },
  {
    name: "Giurgiu",
    localitati: ["Giurgiu", "Bolintin-Vale", "Mihăilești"]
  },
  {
    name: "Gorj",
    localitati: ["Târgu Jiu", "Motru", "Rovinari", "Bumbești-Jiu", "Târgu Cărbunești", "Turceni", "Novaci", "Țicleni", "Tismana"]
  },
  {
    name: "Harghita",
    localitati: ["Miercurea Ciuc", "Odorheiu Secuiesc", "Gheorgheni", "Toplița", "Cristuru Secuiesc", "Bălan", "Borsec", "Vlăhița", "Băile Tușnad"]
  },
  {
    name: "Hunedoara",
    localitati: ["Deva", "Hunedoara", "Petroșani", "Lupeni", "Vulcan", "Orăștie", "Brad", "Petrila", "Simeria", "Hațeg", "Uricani", "Călan", "Geoagiu", "Aninoasa"]
  },
  {
    name: "Ialomița",
    localitati: ["Slobozia", "Fetești", "Urziceni", "Țăndărei", "Amara", "Fierbinți-Târg", "Căzănești"]
  },
  {
    name: "Iași",
    localitati: ["Iași", "Pașcani", "Târgu Frumos", "Hârlău", "Podu Iloaiei"]
  },
  {
    name: "Ilfov",
    localitati: ["Buftea", "Voluntari", "Pantelimon", "Popești-Leordeni", "Bragadiru", "Chitila", "Otopeni", "Măgurele"]
  },
  {
    name: "Maramureș",
    localitati: ["Baia Mare", "Sighetu Marmației", "Borșa", "Vișeu de Sus", "Baia Sprie", "Târgu Lăpuș", "Seini", "Șomcuta Mare", "Cavnic", "Ulmeni", "Tăuții-Măgherăuș", "Dragomirești"]
  },
  {
    name: "Mehedinți",
    localitati: ["Drobeta-Turnu Severin", "Orșova", "Strehaia", "Baia de Aramă", "Vânju Mare"]
  },
  {
    name: "Mureș",
    localitati: ["Târgu Mureș", "Reghin", "Sighișoara", "Târnăveni", "Luduș", "Sovata", "Iernut", "Ungheni", "Sângeorgiu de Pădure", "Miercurea Nirajului"]
  },
  {
    name: "Neamț",
    localitati: ["Piatra Neamț", "Roman", "Târgu Neamț", "Roznov", "Bicaz"]
  },
  {
    name: "Olt",
    localitati: ["Slatina", "Caracal", "Corabia", "Balș", "Scornicești", "Drăgănești-Olt", "Piatra-Olt"]
  },
  {
    name: "Prahova",
    localitati: ["Ploiești", "Câmpina", "Băicoi", "Breaza", "Comarnic", "Sinaia", "Bușteni", "Azuga", "Boldești-Scăeni", "Vălenii de Munte", "Mizil", "Slănic", "Urlați", "Plopeni"]
  },
  {
    name: "Satu Mare",
    localitati: ["Satu Mare", "Carei", "Negrești-Oaș", "Tășnad", "Ardud", "Livada"]
  },
  {
    name: "Sălaj",
    localitati: ["Zalău", "Șimleu Silvaniei", "Jibou", "Cehu Silvaniei"]
  },
  {
    name: "Sibiu",
    localitati: ["Sibiu", "Mediaș", "Cisnădie", "Avrig", "Agnita", "Dumbrăveni", "Copșa Mică", "Tălmaciu", "Ocna Sibiului", "Miercurea Sibiului"]
  },
  {
    name: "Suceava",
    localitati: ["Suceava", "Fălticeni", "Rădăuți", "Câmpulung Moldovenesc", "Vatra Dornei", "Gura Humorului", "Siret", "Solca", "Frasin", "Vicovu de Sus", "Dolhasca", "Cajvana", "Milișăuți", "Salcea"]
  },
  {
    name: "Teleorman",
    localitati: ["Alexandria", "Roșiori de Vede", "Turnu Măgurele", "Zimnicea", "Videle"]
  },
  {
    name: "Timiș",
    localitati: ["Timișoara", "Lugoj", "Sânnicolau Mare", "Jimbolia", "Făget", "Buziaș", "Deta", "Gătaia", "Recaș", "Ciacova"]
  },
  {
    name: "Tulcea",
    localitati: ["Tulcea", "Babadag", "Măcin", "Isaccea", "Sulina"]
  },
  {
    name: "Vaslui",
    localitati: ["Vaslui", "Bârlad", "Huși", "Negrești", "Murgeni"]
  },
  {
    name: "Vâlcea",
    localitati: ["Râmnicu Vâlcea", "Drăgășani", "Băile Govora", "Băile Olănești", "Brezoi", "Călimănești", "Horezu", "Bărbătești", "Berbești", "Ocnele Mari"]
  },
  {
    name: "Vrancea",
    localitati: ["Focșani", "Adjud", "Mărășești", "Panciu", "Odobești"]
  }
];
