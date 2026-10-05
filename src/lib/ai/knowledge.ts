import { skillCategories } from "@data/skills";
import { achievements } from "@data/achievements";
import type { Achievement } from "@/types";
import {
  getWhoIsGill,
  getJourney,
  getEducation,
  getSkills,
  getCurrentlyLearning,
  getLinuxAnswer,
  getNetworkingAnswer,
  getExperience,
  getProjectsOverview,
  getProjectDetailById,
  getSmartLabDeployment,
  getAchievements,
  getAchievementRankFollowUp,
  getContact,
  getEmployerFallback,
  getPklFallback,
} from "@data/aiKnowledge";
import { expandChatShorthand, fuzzyIncludesAny } from "@/lib/textMatch";

/**
 * Gill AI — Knowledge Retrieval V1
 * =================================
 *
 * This module is the ONLY place `POST /api/chat` (src/pages/api/chat.ts)
 * pulls portfolio grounding from before calling the AI provider. It does
 * not introduce a new source of truth: every `KnowledgeItem.content`
 * below is produced by calling the exact same bilingual `get*()` functions
 * `src/lib/localAiEngine.ts` already uses, which in turn read directly
 * from `src/data/*.ts`. Nothing about Gill is duplicated or invented
 * here — this file only assembles and *scopes* the existing knowledge so
 * a request doesn't have to ship the entire portfolio every time.
 *
 * Pipeline (current, V1):
 *
 *   Portfolio Data (src/data/*.ts)
 *        -> aiKnowledge.ts get*() functions (existing, unchanged)
 *        -> KnowledgeItem[] (this file — normalized, keyword-tagged)
 *        -> retrieveGillKnowledge(query, history) — simple keyword/synonym match
 *        -> top-N relevant items
 *        -> AI system prompt (src/pages/api/chat.ts)
 *        -> AI model
 *        -> Answer
 *
 * This is deliberately NOT semantic search: no embeddings, no vector
 * database, no new dependency. It's a bounded keyword/synonym scorer,
 * good enough to pick the right 3-6 items out of a small, well-labeled
 * portfolio. See "FUTURE UPGRADE PATH" at the bottom of this file for
 * how this slots into a real RAG pipeline later without changing the
 * call site in `chat.ts`.
 */

export type KnowledgeCategory =
  | "profile"
  | "journey"
  | "education"
  | "skill"
  | "experience"
  | "project"
  | "achievement"
  | "contact";

export interface KnowledgeItem {
  id: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
  keywords: string[];
}

export interface RetrievalResult {
  items: KnowledgeItem[];
  categories: KnowledgeCategory[];
  confidence: "high" | "medium" | "low" | "none";
}

// --------------------------------------------------------------------
// 1. Normalize portfolio data into a consistent internal shape
// --------------------------------------------------------------------

function findSkill(id: string) {
  return skillCategories.find((c) => c.id === id);
}

/** Plain formatting straight off `SkillCategory` — no invented facts, just the existing fields laid out as a sentence (same style as `aiKnowledge.ts`'s other skill helpers). */
function skillCategoryContent(id: string): string {
  const c = findSkill(id);
  if (!c) return "";
  return `${c.label} — status: ${c.status}${c.primary ? " (primary focus area)" : ""}. ${c.description} Tools: ${c.skills.join(", ")}.`;
}

/** Plain one-line formatting of a single `Achievement` record — same fields `getAchievements()` in aiKnowledge.ts already renders, just scoped to one entry instead of the whole list. No fact beyond what's on the record. */
function achievementContent(a: Achievement): string {
  const head = `${a.title}${a.subtitle ? ` — ${a.subtitle}` : ""}${a.period ? ` (${a.period})` : ""}.`;
  return `${head} ${a.description}`;
}

/**
 * Per-achievement keyword tags, so retrieval can tell a MikroTik
 * certificate apart from the MikroTik national competition apart from
 * an unrelated school medal — see the `achievement-*` items below.
 * Kept small and additive, same spirit as the `SYNONYMS` map above.
 */
const ACHIEVEMENT_KEYWORDS: Record<string, string[]> = {
  "mikrotik-certificate": ["mikrotik certificate", "mikrotik cert", "sertifikat mikrotik", "mikrotik", "certificate", "certification", "sertifikat"],
  "mikrotik-olympiad": ["mikrotik national competition", "mikrotik competition", "national", "nasional", "lomba mikrotik", "lomba nasional", "competition", "kompetisi", "olympiad", "olimpiade", "mikrotik"],
  "network-fundamental": ["network fundamental", "networking certificate", "certificate", "certification", "sertifikat"],
  "mikrotik-participant-2026": ["mikrotik participant", "mikrotik 2026", "participant 2026", "mikrotik", "certificate", "sertifikat"],
  "medal-pancasila": ["pancasila", "silver medal", "medal", "medali"],
  "medal-biology": ["biology", "biologi", "bronze medal", "medal", "medali"],
};

/**
 * The full knowledge base, broken into small, independently-retrievable
 * items. Built fresh per call (cheap — it's ~18 short string
 * concatenations over data already in memory) so it can never go stale
 * relative to `src/data/*.ts`.
 */
function buildKnowledgeItems(): KnowledgeItem[] {
  const items: KnowledgeItem[] = [
    {
      id: "profile",
      category: "profile",
      title: "Profile",
      content: getWhoIsGill("en"),
      keywords: [
        "gill", "who is gill", "about gill", "profile", "introduce", "introduce gill",
        "role", "status", "tagline", "focus area", "focus areas", "siapa gill", "tentang gill",
        "kenalin gill", "gill itu siapa", "gill siapa",
      ],
    },
    {
      id: "journey",
      category: "journey",
      title: "Journey",
      content: getJourney("en"),
      keywords: [
        "journey", "story", "background", "from minus", "minus to peak", "milestone", "path",
        "perjalanan", "cerita", "kisah", "latar belakang", "asal usul",
      ],
    },
    {
      id: "education",
      category: "education",
      title: "Education",
      content: getEducation("en"),
      keywords: [
        "education", "school", "study", "studying", "major", "tjkt", "smkn", "grade",
        "sekolah", "kuliah", "pendidikan", "jurusan", "belajar dimana", "sma", "smk",
      ],
    },
    {
      id: "skills-overview",
      category: "skill",
      title: "Skills overview",
      content: getSkills("en"),
      keywords: [
        "skill", "skills", "technology", "tech stack", "stack", "tools", "framework",
        "programming language", "good at", "capable", "strength", "strengths", "excel at",
        "jago", "keahlian", "kemampuan", "bisa apa", "menguasai", "bisa ngapain", "kelebihan", "keunggulan",
      ],
    },
    {
      id: "skills-currently-learning",
      category: "skill",
      title: "Currently learning",
      content: getCurrentlyLearning("en"),
      keywords: [
        "currently learning", "learning now", "these days", "right now", "exploring", "belajar",
        "sedang belajar", "lagi belajar", "lagi dalami", "mendalami", "eksplor",
      ],
    },
    {
      id: "skill-linux",
      category: "skill",
      title: "Linux & Server skill",
      content: getLinuxAnswer("en"),
      keywords: ["linux", "debian", "server", "nginx", "apache", "virtualbox", "troubleshooting"],
    },
    {
      id: "skill-networking",
      category: "skill",
      title: "Networking skill",
      content: getNetworkingAnswer("en"),
      keywords: ["networking", "network", "mikrotik", "tcp/ip", "topology", "ftth", "jaringan"],
    },
    {
      id: "skill-web",
      category: "skill",
      title: "Web Development skill",
      content: skillCategoryContent("web"),
      keywords: ["web development", "website", "laravel", "filament", "astro", "php", "html", "css", "javascript", "typescript"],
    },
    {
      id: "skill-ai",
      category: "skill",
      title: "AI skill",
      content: skillCategoryContent("ai"),
      keywords: ["ai", "artificial intelligence", "ai tools", "ai-assisted", "gill ai"],
    },
    {
      id: "skill-embedded",
      category: "skill",
      title: "Embedded / IoT skill",
      content: skillCategoryContent("embedded"),
      keywords: ["embedded", "iot", "arduino", "esp32", "sensor", "servo", "rfid"],
    },
    {
      id: "experience",
      category: "experience",
      title: "Hands-on experience",
      content: getExperience("en"),
      keywords: [
        "experience", "hands-on", "hands on", "beyond the classroom", "technical experience",
        "pengalaman", "praktik",
      ],
    },
    {
      id: "employer-status",
      category: "experience",
      title: "Employment status",
      content: getEmployerFallback("en"),
      keywords: [
        "employer", "company", "work for", "workplace", "job", "is he employed", "employed",
        "kerja di", "kerja dimana", "perusahaan apa", "kantor gill", "gill kerja",
      ],
    },
    {
      id: "pkl-status",
      category: "education",
      title: "PKL / internship status",
      content: getPklFallback("en"),
      keywords: ["pkl", "internship", "intern", "magang"],
    },
    {
      id: "projects-overview",
      category: "project",
      title: "Projects overview",
      content: getProjectsOverview("en"),
      keywords: ["project", "projects", "built", "build", "portfolio work", "karya", "project apa", "pernah bikin", "pernah buat"],
    },
    {
      id: "project-smart-lab",
      category: "project",
      title: "Smart-Lab project",
      content: `${getProjectDetailById("smart-lab", "en")}\n\n${getSmartLabDeployment("en")}`,
      keywords: ["smart-lab", "smart lab", "laboratory", "esp32", "rfid", "door lock", "deploy", "deployed", "live", "production"],
    },
    {
      id: "project-automatic-gate",
      category: "project",
      title: "Automatic Gate project",
      content: getProjectDetailById("automatic-gate", "en"),
      keywords: ["automatic gate", "gerbang otomatis", "gate", "arduino", "ultrasonic", "servo"],
    },
    {
      // Broad, list-everything view — matched by generic achievement
      // words. Kept deliberately generic (no "certificate"/"medal"/
      // "competition" here) so a *specific* query like "yang
      // mikrotik?" or "yang medali?" scores the granular per-item
      // entries below higher than this overview instead of always
      // pulling in the whole list alongside them.
      id: "achievements-overview",
      category: "achievement",
      title: "Achievements, certifications & competitions (overview)",
      content: `${getAchievements("en")}\n\n${getAchievementRankFollowUp("en")}`,
      keywords: [
        "achievement", "achievements", "award", "milestone", "ranking", "placement", "placed",
        "prestasi", "penghargaan", "juara",
      ],
    },
    // One item per real achievement (src/data/achievements.ts), each
    // independently retrievable. This is the section-9 fix: previously
    // every achievement was bundled into a single knowledge item, so
    // any achievement-adjacent query (e.g. "gill pernah lomba
    // mikrotik?") always pulled in the Pancasila/Biology medals too.
    // Splitting them lets keyword scoring exclude unrelated entries —
    // a MikroTik question no longer drags in unrelated school medals,
    // and vice versa. Nothing new is stated: each item's `content` is
    // just that one `Achievement` record's own fields, formatted.
    ...achievements.map((a): KnowledgeItem => ({
      id: `achievement-${a.id}`,
      category: "achievement",
      title: `${a.title}${a.subtitle ? ` — ${a.subtitle}` : ""}`,
      content: achievementContent(a),
      keywords: ACHIEVEMENT_KEYWORDS[a.id] ?? [a.title.toLowerCase()],
    })),
    {
      id: "contact",
      category: "contact",
      title: "Contact information",
      content: getContact("en"),
      keywords: [
        "contact", "email", "github", "linkedin", "instagram", "reach him", "get in touch",
        "phone number", "whatsapp", "social",
        "kontak", "hubungi", "nomor hp", "no wa",
      ],
    },
  ];
  return items;
}

// --------------------------------------------------------------------
// 2. Query normalization — casual / typo / mixed-language tolerant
// --------------------------------------------------------------------

/**
 * Small, easily-extendable synonym map (per the brief: "jangan
 * membuat mapping terlalu besar atau kompleks"). Each hit *adds*
 * canonical terms to the search text rather than replacing anything,
 * so the original wording is never lost.
 */
const SYNONYMS: Record<string, string[]> = {
  lomba: ["competition", "achievement"],
  kompetisi: ["competition", "achievement"],
  sertifikat: ["certification", "certificate"],
  sertif: ["certification", "certificate"],
  mtik: ["mikrotik"],
  jago: ["skill", "expertise", "focus area"],
  jagoan: ["skill", "expertise"],
  sekolah: ["education"],
  bikin: ["project", "build"],
  dibikin: ["project", "build"],
  kerja: ["experience", "employer"],
  network: ["networking"],
  nlp: ["ai"],
};

/** Lowercase, trim, and expand chat shorthand (reuses the same tolerance layer the local rule-based engine uses). */
function normalizeQuery(raw: string): string {
  return expandChatShorthand(raw.toLowerCase().trim());
}

/** Adds synonym terms found in the normalized text, so keyword matching downstream also catches the casual/Indonesian phrasing. */
function expandWithSynonyms(normalized: string): string {
  let expanded = normalized;
  for (const [trigger, expansions] of Object.entries(SYNONYMS)) {
    if (normalized.includes(trigger)) {
      expanded += ` ${expansions.join(" ")}`;
    }
  }
  return expanded;
}

/** Casual/synonym trigger phrases that give a category-wide relevance bump, independent of any single item's own keyword list. Mirrors the brief's section 8 "relevance priority" examples. */
const CATEGORY_TRIGGERS: Record<KnowledgeCategory, string[]> = {
  skill: ["jago", "skill", "kemampuan", "bisa apa", "expertise", "stack", "technolog", "belajar"],
  achievement: [
    "lomba", "kompetisi", "sertifikat", "sertif", "prestasi", "juara", "medali", "medal",
    "olympiad", "olimpiade", "achievement", "competition", "certificate", "certification",
    "nasional", "national",
  ],
  education: ["sekolah", "kuliah", "pendidikan", "jurusan", "study", "education", "smk", "sma"],
  project: ["project", "bikin", "dibikin", "karya", "build", "built", "website"],
  experience: ["pengalaman", "praktik", "hands-on", "experience"],
  contact: ["kontak", "email", "github", "linkedin", "instagram", "contact", "hubungi", "whatsapp"],
  profile: ["siapa", "tentang", "who is", "about gill", "kenalin", "introduce"],
  journey: ["perjalanan", "journey", "cerita", "kisah", "latar belakang", "background", "story"],
};

// --------------------------------------------------------------------
// 3. Simple relevance scoring (no embeddings / vector search)
// --------------------------------------------------------------------

function scoreItem(item: KnowledgeItem, expandedText: string): number {
  let score = 0;
  for (const keyword of item.keywords) {
    if (fuzzyIncludesAny(expandedText, [keyword])) {
      // Multi-word phrases are a stronger, less ambiguous signal than single words.
      score += keyword.includes(" ") ? 3 : 2;
    }
  }
  const triggers = CATEGORY_TRIGGERS[item.category] ?? [];
  if (triggers.some((t) => expandedText.includes(t))) {
    score += 1; // one small category-wide bump, not per-trigger, to avoid over-weighting generic terms
  }
  return score;
}

const MAX_ITEMS = 6;

/**
 * The main entry point. Combines the current message (weighted higher)
 * with a little recent conversation history (weighted lower) so
 * follow-ups like "yang MikroTik?" right after "Gill pernah ikut lomba?"
 * still resolve to the right items — see brief section 9.
 */
export function retrieveGillKnowledge(query: string, recentUserMessages: string[] = []): RetrievalResult {
  const items = buildKnowledgeItems();

  const currentText = expandWithSynonyms(normalizeQuery(query));
  const historyText = expandWithSynonyms(normalizeQuery(recentUserMessages.join(" ")));

  const scored = items.map((item) => ({
    item,
    score: scoreItem(item, currentText) * 2 + scoreItem(item, historyText),
  }));

  scored.sort((a, b) => b.score - a.score);

  const relevant = scored.filter((s) => s.score > 0).slice(0, MAX_ITEMS);
  let selected = relevant.map((s) => s.item);

  // Always ground with the lightweight profile item, even on a weak or
  // no-match query — it's cheap and keeps basic identity facts in
  // context without "forcing" unrelated data (brief section 10).
  const profileItem = items.find((i) => i.category === "profile");
  if (profileItem && !selected.some((i) => i.id === profileItem.id)) {
    selected = selected.length >= MAX_ITEMS ? [...selected.slice(0, MAX_ITEMS - 1), profileItem] : [...selected, profileItem];
  }

  const topScore = scored[0]?.score ?? 0;
  let confidence: RetrievalResult["confidence"] = "none";
  if (topScore >= 6) confidence = "high";
  else if (topScore >= 3) confidence = "medium";
  else if (topScore > 0) confidence = "low";

  const categories = Array.from(new Set(selected.map((i) => i.category)));

  return { items: selected, categories, confidence };
}

/** Personal-question heuristic used only for the safety-net fallback below — a quick check for "this question is about Gill specifically", not a language detector. */
export function isLikelyPersonalQuestion(rawInput: string): boolean {
  const text = ` ${rawInput.toLowerCase().trim()} `;
  return /\bgill\b|\bhe\b|\bhis\b|\bhim\b|\bdia\b|\bnya\b/.test(text);
}

/**
 * Formats a retrieval result into the plain-text block handed to the
 * AI provider as part of the system prompt. Kept deliberately plain
 * (facts + short headers, no persuasive language) — same rationale as
 * `buildKnowledgeBaseText()` in `aiKnowledge.ts`.
 */
export function buildRetrievedContextText(result: RetrievalResult): string {
  if (!result.items.length) {
    return [
      "No portfolio item matched this query with any confidence.",
      "Do not guess or invent anything about Gill to fill the gap — if the visitor is asking something specific about him, say plainly that it isn't in the portfolio data.",
      "General-knowledge questions unrelated to Gill personally can still be answered from your own knowledge.",
    ].join(" ");
  }
  const lines: string[] = [];
  for (const item of result.items) {
    lines.push(`## ${item.title}`);
    lines.push(item.content);
    lines.push("");
  }
  return lines.join("\n").trim();
}

/**
 * Debug-friendly wrapper — not shown to the visitor anywhere, but kept
 * as a single function with an inspectable return shape (items,
 * categories, confidence) so retrieval quality is easy to check or
 * extend later (brief section 13).
 */
export function retrieveGillKnowledgeDebug(query: string, recentUserMessages: string[] = []) {
  const result = retrieveGillKnowledge(query, recentUserMessages);
  return {
    query,
    recentUserMessages,
    items: result.items.map((i) => ({ id: i.id, category: i.category, title: i.title })),
    categories: result.categories,
    confidence: result.confidence,
  };
}

/**
 * FUTURE UPGRADE PATH (do not implement yet — see brief section 14):
 *
 *   Current:  query -> normalize/synonyms -> keyword score -> top-N items
 *   Future:   query -> embedding -> vector search -> top-N items
 *
 * `KnowledgeItem` is already the right shape to embed (`id` +
 * `content`) — a future version can add an `embedding: number[]` field
 * computed offline, keep `retrieveGillKnowledge`'s signature identical,
 * and swap the body of this function for a cosine-similarity search
 * without touching `src/pages/api/chat.ts` at all. No vector database
 * or embeddings dependency is introduced in this file today.
 */
