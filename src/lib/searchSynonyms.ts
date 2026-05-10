// Synonym & abbreviation expansion for product search.
// When the user types "TV", we also search for "Televizor", "OLED", etc.
// Each inner array is a synonym group: matching ANY entry expands to ALL.

const SYNONYM_GROUPS: string[][] = [
  ["tv", "televizor", "televizoare", "smart tv", "oled", "qled", "led tv"],
  ["bici", "bike", "bicicleta", "bicicleta", "biciclete", "mtb", "mountain bike"],
  ["ps", "ps4", "ps5", "playstation", "consola", "consola jocuri"],
  ["xbox", "xbox series", "consola xbox"],
  ["nintendo", "switch", "nintendo switch"],
  ["frigi", "frigider", "combina frigorifica", "frigidere"],
  ["masina spalat", "masina de spalat", "spalatorie", "washing machine"],
  ["aspi", "aspirator", "vacuum", "aspiratoare"],
  ["foto", "aparat foto", "camera foto", "dslr", "mirrorless", "canon", "nikon", "sony alpha"],
  ["video", "camera video", "camcorder", "gopro", "go pro", "action cam"],
  ["drona", "drone", "uav", "quadcopter", "dji"],
  ["boxa", "boxe", "speaker", "difuzor", "soundbar", "sound system"],
  ["laptop", "notebook", "macbook", "ultrabook"],
  ["tableta", "ipad", "tablet"],
  ["telefon", "smartphone", "iphone", "mobil"],
  ["proiector", "videoproiector", "projector", "video proiector"],
  ["cort", "tent", "camping"],
  ["rulota", "caravan", "trailer", "autorulota"],
  ["drujba", "motofierastrau", "chainsaw"],
  ["bormasina", "drill", "masina gaurit"],
  ["polizor", "flex", "angle grinder"],
  ["motocoasa", "trimmer", "masina tuns iarba", "weed eater"],
  ["masina tuns", "masina de tuns", "lawn mower"],
  ["generator", "agregat curent"],
  ["compresor", "compressor"],
  ["roaba", "carucior transport"],
  ["scara", "stairs ladder", "scara aluminiu"],
  ["schiuri", "ski", "snowboard"],
  ["caiac", "kayak", "canoe"],
  ["sup", "paddle board", "stand up paddle"],
  ["microfon", "mic", "microphone"],
  ["mixer", "consola mixaj", "dj"],
  ["lumini", "lights", "moving head", "par led"],
  ["masa", "scaune", "set masa scaune", "mobilier evenimente"],
];

// Strip diacritics + lowercase.
const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

// Pre-normalized index: each group with normalized variants.
const INDEX = SYNONYM_GROUPS.map((group) => ({
  variants: group,
  normVariants: group.map(norm),
}));

const MAX_TERMS = 12;

/**
 * Expand a search query to include synonyms.
 * Always returns the original query as the first element.
 *
 * Examples:
 *   expandSearchTerms("TV")           → ["TV", "tv", "televizor", "smart tv", ...]
 *   expandSearchTerms("ps5 nou")      → ["ps5 nou", "ps", "ps4", "ps5", "playstation", ...]
 *   expandSearchTerms("rochie")       → ["rochie"]   (no group matched)
 */
export function expandSearchTerms(query: string): string[] {
  const original = query.trim();
  if (!original) return [];
  const normQuery = ` ${norm(original)} `;

  const out: string[] = [original];
  const seen = new Set([norm(original)]);

  for (const group of INDEX) {
    const matched = group.normVariants.some((v) => normQuery.includes(` ${v} `) || normQuery.includes(v));
    if (!matched) continue;
    for (const variant of group.variants) {
      const key = norm(variant);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(variant);
        if (out.length >= MAX_TERMS) return out;
      }
    }
  }

  return out;
}

/**
 * Returns ONLY the synonyms added (excludes the original query).
 * Useful for showing a "we also searched for…" hint in the UI.
 */
export function getAddedSynonyms(query: string): string[] {
  const all = expandSearchTerms(query);
  return all.slice(1);
}
