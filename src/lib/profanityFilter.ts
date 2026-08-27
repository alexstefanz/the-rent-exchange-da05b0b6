// Profanity filter (RO + EN). Keep in sync with public.check_message_profanity DB trigger.
const BAD_WORDS: string[] = [
  // Romanian
  "pula","pizda","pizdamatii","muie","muiest","futui","futute","futai","fut",
  "cacat","curva","curve","boule","prost","proasta","idiot","idioata",
  "cretin","cretina","dobitoc","dobitoaca","tampit","tampita","jegos","jegoasa",
  "pulamea","tarfa","tarfe","nesimtit","nesimtita",
  "handicapat","retardat","retardata","futumati","futinetamati","matiitifutu",
  "panarama","labagiu","labagioaica","cocalar","tigan","tiganca","jidan",
  "teomor","teamenit","teameninti",
  // Romanian — extra (variante ofuscate + injurii cu „ma-tii")
  "pwla","poola","puwla","pule","pulele","pulet",
  "sugi","sugio","sugiopula","sugimi","sugepula","sugepulamea","sugipula",
  "mortiimati","mortiimatii","mortiitai","mortiitaiii",
  "cruceamati","cruceamatii","bisericamati","bisericamatii",
  "dumnezeulmatii","dumnezeumatii","dumnezeumati",
  "pastelemati","pastelematii","familiamatii","neamulmatii","mamatii",
  "mamadracului","ducetevadracului","ducetenpula",
  "bagmiapula","bagmiapizda","bagpula","tragipula","linsemiapula","lapula",
  "pizdamasii","pizdamuii","futumama","futumamata","futiomama","futiomortii",
  "futinematii","futinemortii","futiocrucea",
  // Familiale (variante)
  "mata","matii",
  // English
  "fuck","fucker","fucking","motherfucker","shit","bullshit","bitch","bitches",
  "asshole","pussy","cunt","whore","slut","retard","retarded",
  "faggot","nigger","kike",
];

const DIACRITICS_MAP: Record<string, string> = {
  ă: "a", â: "a", î: "i", ș: "s", ş: "s", ț: "t", ţ: "t",
  Ă: "a", Â: "a", Î: "i", Ș: "s", Ş: "s", Ț: "t", Ţ: "t",
};

// Common leetspeak/obfuscation substitutions applied before non-alphanumeric strip.
const LEET_MAP: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t",
  "@": "a", "$": "s",
};

export function normalizeForProfanity(input: string): string {
  if (!input) return "";
  let s = "";
  for (const ch of input) {
    const noDia = DIACRITICS_MAP[ch] ?? ch;
    s += LEET_MAP[noDia] ?? noDia;
  }
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function containsProfanity(text: string): { hit: boolean; word?: string } {
  if (!text) return { hit: false };
  const norm = normalizeForProfanity(text);
  for (const w of BAD_WORDS) {
    if (norm.includes(w)) return { hit: true, word: w };
  }
  return { hit: false };
}

/**
 * Word-aware profanity check for long-form text (support tickets).
 * Avoids the false positives of the collapsed-substring check, where innocent
 * words like "automată" ("mata") or "populez" ("pule") were flagged.
 * - each word is normalized and matched exactly against the blocklist;
 * - the fully collapsed text is only matched against long (>= 8 chars)
 *   compound insults, to still catch obfuscated spacing.
 */
const LONG_BAD_WORDS = BAD_WORDS.filter((w) => w.length >= 8);

export function containsProfanityWords(text: string): { hit: boolean; word?: string } {
  if (!text) return { hit: false };

  for (const raw of text.split(/[^\p{L}\p{N}@$]+/u)) {
    const token = normalizeForProfanity(raw);
    if (!token) continue;
    if (BAD_WORDS.includes(token)) return { hit: true, word: token };
  }

  const norm = normalizeForProfanity(text);
  for (const w of LONG_BAD_WORDS) {
    if (norm.includes(w)) return { hit: true, word: w };
  }
  return { hit: false };
}
