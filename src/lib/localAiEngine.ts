import type { Achievement, AiAnswer, AiConversationContext } from "@/types";
import { detectLanguage, type Lang } from "@/lib/lang";
import { expandChatShorthand, fuzzyIncludesAny } from "@/lib/textMatch";
import { achievements } from "@data/achievements";
import {
  getGreeting,
  getEmptyInputPrompt,
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
  getAchievementSubsetFollowUp,
  getAchievementPeriodFollowUp,
  getContact,
  getEmployerFallback,
  getPklFallback,
  getOffTopicFallback,
  getUnknownFallback,
  projectOrder,
} from "@data/aiKnowledge";

/**
 * Conversation-context fix: which specific achievement(s) a short
 * narrowing follow-up ("yang nasional?", "yang mikrotik?", "yang
 * sertifikat?", "yang medali?"...) is asking about, matched against
 * the same `achievements.ts` source `getAchievements()` already
 * reads. Deliberately small and additive (same spirit as
 * `textMatch.ts`'s `SYNONYMS`) — each entry only narrows an existing
 * achievement down further, never invents a new one.
 */
const ACHIEVEMENT_FILTERS: Array<{ keywords: string[]; predicate: (a: Achievement) => boolean }> = [
  {
    keywords: ["nasional", "national"],
    predicate: (a) => a.category === "competition" || /national/i.test(a.subtitle ?? ""),
  },
  {
    keywords: ["mikrotik", "mtik"],
    predicate: (a) => /mikrotik/i.test(a.title),
  },
  {
    keywords: ["sertifikat", "certificate", "certification", "sertif"],
    predicate: (a) => a.category === "certification",
  },
  {
    keywords: ["medali", "medal"],
    predicate: (a) => a.category === "medal",
  },
  {
    keywords: ["pancasila"],
    predicate: (a) => /pancasila/i.test(a.subtitle ?? ""),
  },
  {
    keywords: ["biology", "biologi"],
    predicate: (a) => /biology/i.test(a.subtitle ?? ""),
  },
];

/**
 * Gill AI — local/rule-based engine.
 *
 * ARCHITECTURE NOTE (real-backend upgrade): this file used to be
 * `src/lib/aiEngine.ts` and ran entirely in the visitor's browser —
 * it was the whole assistant. Now that `POST /api/chat`
 * (`src/pages/api/chat.ts`) exists and can call a real AI provider
 * server-side, this module has moved here and changed role: it is now
 * the **offline fallback** the API route calls when `AI_API_KEY`
 * isn't configured, so the assistant still answers something true and
 * useful instead of the endpoint simply failing. It runs on the
 * server (inside the Node adapter), not in the browser — nothing
 * about the matching logic itself needed to change for that, since it
 * was always plain, DOM-free string logic.
 *
 * Everything below is unchanged from the original Phase 09/12 engine:
 * a small rule-based matcher over the verified knowledge layer in
 * `src/data/aiKnowledge.ts`, with bilingual (EN/ID) output via
 * `src/lib/lang.ts` and casual-input tolerance via
 * `src/lib/textMatch.ts`. It still never invents a fact — where the
 * data doesn't have an answer, it says so explicitly (see the
 * `*Fallback` functions).
 *
 * Because `POST /api/chat` is stateless (the browser sends the full
 * message history every time, not a running server-side session), the
 * caller reconstructs a best-effort `AiConversationContext` per
 * request rather than this module tracking it internally — see
 * `deriveLocalContext` in `src/pages/api/chat.ts`.
 */

const MAX_INPUT_LENGTH = 300;

function normalize(input: string): string {
  return expandChatShorthand(input.toLowerCase().trim());
}

function includesAny(text: string, words: string[]): boolean {
  return fuzzyIncludesAny(text, words);
}

/**
 * The only entry point. Never evaluates the input as code, never
 * forwards it anywhere — a plain string in, a plain string (plus
 * light topic/language metadata) out.
 */
export async function answerLocally(rawInput: string, context: AiConversationContext = {}): Promise<AiAnswer> {
  const input = normalize(rawInput).slice(0, MAX_INPUT_LENGTH);
  const lang: Lang = detectLanguage(rawInput, context.lang);

  if (!input) {
    return { text: getEmptyInputPrompt(lang), lang };
  }

  // Small talk — English and Indonesian greetings.
  if (
    input.length < 25 &&
    /^(hi|hello|hey|yo|hai|halo|woy|woe|good (morning|afternoon|evening)|pagi|siang|sore|malam)\b/.test(input)
  ) {
    return { text: getGreeting(lang), lang };
  }

  // "Who/what is Gill AI" — meta questions about the assistant itself.
  if (includesAny(input, ["who are you", "what are you", "siapa kamu", "kamu siapa", "kamu ai apa", "gill ai itu apa"])) {
    return { text: getWhoIsGill(lang), lang, topic: "about" };
  }

  // Smart-Lab: check the deployment question before the general
  // project question, so "was Smart-Lab deployed?" doesn't just
  // repeat the project summary.
  if (input.includes("smart-lab") || input.includes("smart lab")) {
    if (includesAny(input, ["deploy", "deployed", "live", "production", "launched", "used in the lab", "dipakai", "dipake", "sudah jadi", "udah jadi", "rilis"])) {
      return { text: getSmartLabDeployment(lang), lang, topic: "project", projectId: "smart-lab" };
    }
    return { text: getProjectDetailById("smart-lab", lang), lang, topic: "project", projectId: "smart-lab" };
  }

  if (
    input.includes("automatic gate") ||
    input.includes("gerbang otomatis") ||
    (input.includes("gate") && includesAny(input, ["project", "arduino", "build", "built", "bikin", "dibikin"])) ||
    (input.includes("gerbang") && includesAny(input, ["project", "arduino", "bikin", "dibikin"]))
  ) {
    return { text: getProjectDetailById("automatic-gate", lang), lang, topic: "project", projectId: "automatic-gate" };
  }

  // Basic conversational context: "the first one" / "the second one" /
  // "yang pertama" / "yang kedua", following a prior projects-overview turn.
  const ordinalMatch = input.match(/\b(first|1st|second|2nd|pertama|kedua)\b/);
  if (ordinalMatch) {
    const wantsOrdinalProject = includesAny(input, [
      "one", "project", "did he do", "he do", "he build", "he built", "that",
      "yang", "projectnya", "projeknya", "dia bikin", "dia buat",
    ]);
    if (wantsOrdinalProject) {
      const index = ["first", "1st", "pertama"].includes(ordinalMatch[1]) ? 0 : 1;
      const id = projectOrder[index];
      if (id) {
        if (includesAny(input, ["deploy", "deployed", "live", "launched", "dipakai", "rilis"]) && id === "smart-lab") {
          return { text: getSmartLabDeployment(lang), lang, topic: "project", projectId: id };
        }
        return { text: getProjectDetailById(id, lang), lang, topic: "project", projectId: id };
      }
    }
  }

  // Pronoun / possessive-suffix follow-ups referring to whatever
  // project or topic was last discussed — e.g. "was it deployed?" or
  // "terus projectnya apa?" after a networking answer.
  if (context.lastProjectId && includesAny(input, ["deploy", "deployed", "live", "launched", "production", "dipakai", "rilis"]) && !includesAny(input, ["gill", "he "])) {
    if (context.lastProjectId === "smart-lab") {
      return { text: getSmartLabDeployment(lang), lang, topic: "project", projectId: "smart-lab" };
    }
  }
  if (context.lastProjectId && includesAny(input, [" it ", "it?", "that one", "what about it", "itu apa", "itunya"])) {
    return { text: getProjectDetailById(context.lastProjectId, lang), lang, topic: "project", projectId: context.lastProjectId };
  }
  // Indonesian possessive-suffix follow-up: "terus projectnya apa?"
  // right after a skills/networking answer should surface Gill's
  // projects, not repeat the same skills topic (matches the brief's
  // "terus projectnya apa?" example under NATURAL CONVERSATION).
  if (includesAny(input, ["projectnya", "projeknya"]) && context.lastTopic === "skills") {
    return { text: getProjectsOverview(lang), lang, topic: "projects" };
  }

  // Follow-up on a specific competition's result — e.g. "yang itu
  // juara berapa?" right after an achievements answer. Checked before
  // the general achievements keyword bucket below (which "juara"
  // would otherwise also match) so the reply actually addresses the
  // follow-up instead of re-dumping the full achievements list.
  // Answered strictly from `achievements.ts` — if no numbered
  // placement is on file for the competition, the assistant says so
  // rather than guessing one.
  if (
    context.lastTopic === "achievements" &&
    includesAny(input, [
      "juara berapa", "juara ke", "peringkat berapa", "dapat juara", "menang gak", "menang ga",
      "menang nggak", "menang tidak", "dia menang", "what place", "what rank", "did he win",
      "placement", "placed", "ranking",
    ])
  ) {
    const competition = achievements.find((a) => a.category === "competition");
    const medals = achievements.filter((a) => a.category === "medal");
    return {
      text: getAchievementRankFollowUp(lang),
      lang,
      topic: "achievements",
      achievementIds: [competition?.id, ...medals.map((m) => m.id)].filter((id): id is string => Boolean(id)),
    };
  }

  // "itu kapan?" / "when was that?" — resolve against whichever
  // achievement(s) were most recently surfaced (context.lastAchievementIds),
  // never inventing a date that isn't on file. Checked before the
  // narrowing-subset filters below, since "kapan"/"when" isn't itself
  // a narrowing term.
  if (
    context.lastTopic === "achievements" &&
    includesAny(input, ["kapan", "when was", "when did", "what year", "tahun berapa"])
  ) {
    const known = context.lastAchievementIds?.length
      ? achievements.filter((a) => context.lastAchievementIds!.includes(a.id))
      : achievements; // no specific item tracked yet — report on everything rather than refuse
    return {
      text: getAchievementPeriodFollowUp(lang, known),
      lang,
      topic: "achievements",
      achievementIds: known.map((a) => a.id),
    };
  }

  // Narrowing follow-ups — "yang nasional?" / "yang mikrotik?" / "yang
  // sertifikat?" / "yang medali?" right after an achievements answer.
  // Filters the same `achievements.ts` source instead of re-dumping
  // the whole list, so unrelated medals don't bleed into a
  // MikroTik-specific follow-up (see PROJECT_CONTEXT.md /
  // knowledge-retrieval fix notes).
  if (context.lastTopic === "achievements") {
    for (const filter of ACHIEVEMENT_FILTERS) {
      if (includesAny(input, filter.keywords)) {
        const matches = achievements.filter(filter.predicate);
        return {
          text: getAchievementSubsetFollowUp(lang, matches),
          lang,
          topic: "achievements",
          achievementIds: matches.map((a) => a.id),
        };
      }
    }
  }

  // Hallucination-prevention guardrails — answered explicitly rather
  // than guessed, per PROJECT_CONTEXT.md Phase 09/12.
  if (
    includesAny(input, [
      "company does gill", "employer", "work for", "workplace", "does he have a job", "is he employed",
      "kerja di", "kerja dimana", "perusahaan apa", "kantor gill", "gill kerja",
    ])
  ) {
    return { text: getEmployerFallback(lang), lang };
  }
  if (includesAny(input, ["pkl", "internship", "intern ", "magang"])) {
    return { text: getPklFallback(lang), lang };
  }

  if (
    includesAny(input, [
      "contact", "email", "reach him", "get in touch", "linkedin", "instagram", "github", "phone number", "whatsapp",
      "kontak", "hubungi", "nomor hp", "no wa",
    ])
  ) {
    return { text: getContact(lang), lang, topic: "contact" };
  }

  if (
    includesAny(input, [
      "achievement", "award", "medal", "certificat", "competition", "olympiad", "milestone",
      "prestasi", "penghargaan", "medali", "sertifikat", "lomba", "olimpiade", "juara",
    ])
  ) {
    return { text: getAchievements(lang), lang, topic: "achievements", achievementIds: achievements.map((a) => a.id) };
  }

  if (
    includesAny(input, [
      "study", "studying", "education", "school", "major", "tjkt", "smkn",
      "sekolah", "kuliah", "pendidikan", "jurusan", "belajar dimana", "sma", "smk",
    ])
  ) {
    return { text: getEducation(lang), lang, topic: "education" };
  }

  if (
    includesAny(input, ["currently learning", "learning now", "these days", "right now", "sedang belajar", "lagi belajar", "lagi dalami"]) ||
    (includesAny(input, ["exploring", "mendalami", "eksplor"]) && input.includes("gill"))
  ) {
    return { text: getCurrentlyLearning(lang), lang, topic: "learning" };
  }

  if (input.includes("linux")) {
    return { text: getLinuxAnswer(lang), lang, topic: "skills" };
  }

  if (includesAny(input, ["networking", "mikrotik", "network ", "jaringan"])) {
    return { text: getNetworkingAnswer(lang), lang, topic: "skills" };
  }

  if (includesAny(input, ["experience", "hands-on", "hands on", "beyond the classroom", "pengalaman", "praktik"])) {
    return { text: getExperience(lang), lang, topic: "experience" };
  }

  if (
    includesAny(input, [
      "technolog", "skill", "tech stack", "stack", "tools", "programming language", "framework",
      "keahlian", "kemampuan", "bisa apa", "jago", "menguasai", "bisa ngapain",
      "good at", "he capable", "is he capable", "capable of", "excel at", "excels at",
      "his strength", "his strengths", "strong at", "what can he do", "what can gill do",
      "kelebihan", "keunggulan",
    ])
  ) {
    return { text: getSkills(lang), lang, topic: "skills" };
  }

  if (
    includesAny(input, [
      "project", "built", "build", "portfolio work",
      "bikin project", "pernah bikin", "pernah buat", "karya", "project apa",
    ])
  ) {
    return { text: getProjectsOverview(lang), lang, topic: "projects" };
  }

  if (
    includesAny(input, [
      "journey", "story", "background", "how did", " path", "from minus",
      "perjalanan", "cerita", "kisah", "latar belakang", "asal usul",
    ])
  ) {
    return { text: getJourney(lang), lang, topic: "journey" };
  }

  if (
    includesAny(input, [
      "who is gill", "who's gill", "about gill", "introduce yourself", "introduce gill",
      "siapa gill", "gill itu siapa", "gill siapa", "si gill", "gill tuh siapa", "tentang gill", "kenalin gill",
    ])
  ) {
    return { text: getWhoIsGill(lang), lang, topic: "about" };
  }

  // Anything clearly outside the assistant's scope.
  if (
    includesAny(input, [
      "weather", "capital of", "president", "recipe", "movie", "sports score", "stock price", "translate", "write me a", "who won",
      "cuaca", "resep", "film", "presiden", "ibukota", "harga saham", "terjemahkan",
    ])
  ) {
    return { text: getOffTopicFallback(lang), lang };
  }

  return { text: getUnknownFallback(lang), lang };
}
