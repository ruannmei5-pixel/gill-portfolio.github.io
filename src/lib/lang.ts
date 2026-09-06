export type Lang = "id" | "en";

/**
 * Phase 12 — Gill AI multilingual support.
 *
 * A deliberately small, dependency-free heuristic — no translation
 * library, no external API call (per PROJECT_CONTEXT.md's "keep the
 * site lightweight" constraint). It only has to decide between the
 * two languages this portfolio's answers are actually written in
 * (English / Bahasa Indonesia); it is not a general-purpose language
 * detector.
 *
 * Approach: count how many *strong* Indonesian-only marker words
 * appear versus strong English-only marker words. Common function
 * words that exist in both informal registers ("ok", "oke", "info")
 * are deliberately excluded from both lists so they don't bias the
 * result. Ties (including "no strong signal either way", e.g. a bare
 * proper noun like "MikroTik?") fall back to whatever language the
 * conversation was already in, and default to English for the very
 * first turn — matching the brief's "don't force everything into
 * Bahasa Indonesia" instruction.
 */

const ID_MARKERS = [
  "apa aja", "apa saja", "bisa apa", "gimana", "bagaimana", "kenapa",
  "gak", "ga ", "nggak", "engga", "enggak", "tidak", "belum", "udah",
  "sudah", "pernah", "lagi", "banget", "jago", "ngerti", "paham",
  "bikin", "dibikin", "buat apa", "siapa", "dimana", "di mana",
  "kapan", "kok", "dong", "deh", "sih", "nih", "tuh", "yuk", "ya udah",
  "terus", "trus", "lanjut", "coba", "tolong", "mohon", "kerja",
  "kuliah", "sekolah", "belajar", "mengerti", "punya", "sama",
  "dengan", "dari mana", "asalnya", "sekarang", "masih", "cerita",
  "ceritain", "jelasin", "jelaskan", "tentang", "yang", "itu",
  "ini apa", "apakah", "adalah", "projectnya", "projeknya", "skillnya",
  "orangnya", "dirinya", "keahlian", "kemampuan", "pengalaman",
];

const EN_MARKERS = [
  "what", "who", "where", "when", "why", "how", "does he", "did he",
  "has he", "is he", "can he", "his ", "he's", "him ", "about him",
  "tell me", "does gill", "did gill", "study", "studies", "work",
  "working", "built", "build", "project", "skills", "experience",
  "learn", "learning", "background", "journey", "achievement",
  "contact", "reach", "explain", "please",
];

function countMatches(text: string, markers: string[]): number {
  let count = 0;
  for (const marker of markers) {
    if (text.includes(marker)) count += 1;
  }
  return count;
}

/**
 * Detects whether a raw message reads as Bahasa Indonesia or English.
 * `previous` is the language the conversation was in on the prior
 * turn, used only as a tiebreaker for ambiguous/very short input
 * (mixed-language messages are allowed to lean whichever way has the
 * stronger signal — see PROMPT 15 section 2, "campuran secara
 * natural").
 */
export function detectLanguage(rawInput: string, previous?: Lang): Lang {
  const text = ` ${rawInput.toLowerCase().trim()} `;
  const idScore = countMatches(text, ID_MARKERS);
  const enScore = countMatches(text, EN_MARKERS);

  if (idScore > enScore) return "id";
  if (enScore > idScore) return "en";
  return previous ?? "en";
}
