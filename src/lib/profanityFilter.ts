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
  // English
  "fuck","fucker","fucking","motherfucker","shit","bullshit","bitch","bitches",
  "asshole","pussy","cunt","whore","slut","retard","retarded",
  "faggot","nigger","kike",
];

const DIACRITICS_MAP: Record<string, string> = {
  ă: "a", â: "a", î: "i", ș: "s", ş: "s", ț: "t", ţ: "t",
  Ă: "a", Â: "a", Î: "i", Ș: "s", Ş: "s", Ț: "t", Ţ: "t",
};

export function normalizeForProfanity(input: string): string {
  if (!input) return "";
  let s = "";
  for (const ch of input) s += DIACRITICS_MAP[ch] ?? ch;
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
