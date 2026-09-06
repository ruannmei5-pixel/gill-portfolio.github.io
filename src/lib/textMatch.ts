/**
 * Gill AI — casual-input tolerance layer.
 *
 * Two small, dependency-free helpers that sit in front of the intent
 * matching in `src/lib/aiEngine.ts`:
 *
 *  1. `expandChatShorthand` — expands common Indonesian chat
 *     abbreviations ("yg" -> "yang", "gmn" -> "gimana", "udh" ->
 *     "udah", etc.) to the canonical word forms the keyword lists in
 *     `aiKnowledge`/`aiEngine` already expect, so a shortened message
 *     ("gill skrg lg belajar apa") matches the same intent as the
 *     full one ("gill sekarang lagi belajar apa").
 *  2. `fuzzyIncludesAny` — a drop-in replacement for a plain
 *     "does this text contain any of these words" check that also
 *     tolerates small typos (one or two edited characters) on
 *     single-word keywords via Levenshtein distance, so "mikrotic",
 *     "netwroking", or "skil" still match "mikrotik", "networking",
 *     "skill". Multi-word phrases are only matched exactly — fuzzing
 *     a whole phrase risks false positives, and the single-word
 *     fallback already covers most real typos.
 *
 * Nothing here changes meaning: it only widens *which spellings*
 * count as the same intent. It never adds, removes, or guesses any
 * fact about Gill — that stays entirely in `aiKnowledge.ts`.
 */

/** Common Indonesian chat/SMS-style shorthand -> canonical word. */
const CHAT_SHORTHAND: Record<string, string> = {
  yg: "yang",
  dmn: "dimana",
  dimn: "dimana",
  gmn: "gimana",
  gmna: "gimana",
  gimna: "gimana",
  bgt: "banget",
  udh: "udah",
  uda: "udah",
  blm: "belum",
  sm: "sama",
  dgn: "dengan",
  dr: "dari",
  utk: "untuk",
  tdk: "tidak",
  krn: "karena",
  jg: "juga",
  aj: "aja",
  gk: "ga",
  gak: "ga",
  kaga: "ga",
  nggak: "ga",
  enggak: "ga",
  engga: "ga",
  apaan: "apa",
  bs: "bisa",
  pnh: "pernah",
  prnh: "pernah",
  sklh: "sekolah",
  krja: "kerja",
  tp: "tapi",
  trs: "terus",
  trus: "terus",
  knp: "kenapa",
  napa: "kenapa",
  dpt: "dapat",
  dapet: "dapat",
  emg: "emang",
  emang: "memang",
  gmana: "gimana",
  msh: "masih",
  jgn: "jangan",
  skrg: "sekarang",
  klo: "kalau",
  kalo: "kalau",
  lg: "lagi",
  gmn2: "gimana",
  gitu2: "gitu",
  org: "orang",
  tmn: "teman",
  proj: "project",
  projek: "project",
  jaringn: "jaringan",
};

/**
 * Expands known shorthand tokens in place. Only touches whole tokens
 * (so "yang" stays "yang", "gapapa" is untouched even though it
 * starts with "ga") — it splits on non-alphanumeric characters and
 * rejoins, so punctuation/spacing is otherwise preserved.
 */
export function expandChatShorthand(text: string): string {
  return text.replace(/[a-z0-9]+/gi, (word) => {
    const lower = word.toLowerCase();
    return CHAT_SHORTHAND[lower] ?? word;
  });
}

/** Classic iterative Levenshtein edit distance between two short strings. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      );
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }
  return prev[b.length];
}

/** How many edited characters count as "probably a typo" for a word of this length. Short words are never fuzzed — the false-positive risk outweighs the benefit. */
function typoBudget(wordLength: number): number {
  if (wordLength <= 4) return 0;
  if (wordLength <= 7) return 1;
  return 2;
}

/**
 * True if `text` contains any of `phrases`, either verbatim or (for
 * single-word phrases only) within a small typo budget. `text` is
 * expected to already be lowercased/trimmed by the caller.
 */
export function fuzzyIncludesAny(text: string, phrases: string[]): boolean {
  for (const phrase of phrases) {
    if (text.includes(phrase)) return true;
  }

  const tokens = text.split(/[^a-z0-9]+/).filter(Boolean);
  if (!tokens.length) return false;

  for (const phrase of phrases) {
    if (phrase.includes(" ")) continue; // only single words are typo-tolerant
    const budget = typoBudget(phrase.length);
    if (budget === 0) continue;
    for (const token of tokens) {
      if (Math.abs(token.length - phrase.length) > budget) continue;
      if (levenshtein(token, phrase) <= budget) return true;
    }
  }
  return false;
}
