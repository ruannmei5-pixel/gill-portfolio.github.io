import { profile } from "@data/profile";
import { journey } from "@data/journey";
import { skillCategories, technicalFocus } from "@data/skills";
import { projects, upcomingProjectAreas } from "@data/projects";
import { experienceEntries, experienceCategories } from "@data/experience";
import { education, pklOpportunity } from "@data/education";
import { achievements } from "@data/achievements";
import type { Lang } from "@/lib/lang";
import type { Achievement } from "@/types";

/**
 * Gill AI — knowledge layer.
 *
 * This is the single place the AI's answers are built from. It reads
 * the same `src/data/*.ts` files every other section of the site
 * already reads (the same pattern `src/data/terminal.ts` established
 * in Phase 08) — nothing about Gill is duplicated here, only
 * assembled into plain-text answers. If a data file changes, the
 * assistant's answers change with it automatically, in both
 * supported languages.
 *
 * Every function here returns a plain string, built only from
 * verified data — never a fact that isn't already present in
 * `src/data/*`. Where the underlying data doesn't have an answer (no
 * employer, no completed PKL, no real contact info yet), the function
 * says so explicitly instead of guessing — see the `*Fallback`
 * functions below.
 *
 * Phase 12 (Prompt 15) made every function bilingual: each accepts a
 * `lang: Lang` ("en" | "id") and returns the matching-language
 * sentence, built from the exact same underlying data — this is a
 * phrasing choice, not a second knowledge source, so the two
 * languages can never drift into saying different things about Gill.
 */

/** A social link only counts as "real" once it's an actual destination, not a TODO placeholder. Mirrors the identical check in `src/data/terminal.ts`'s `contact` command. */
function isRealSocial(href: string): boolean {
  if (!href) return false;
  if (href === "#") return false;
  if (href.includes("example.com")) return false;
  return true;
}

/** Suggested questions shown as tappable chips in the AI Assistant UI. */
export const quickQuestions: string[] = [
  "Who is Gill?",
  "What are his main skills?",
  "Tell me about Smart-Lab.",
  "What is Gill currently learning?",
  "What is his educational background?",
  "What projects has he built?",
  "What networking experience does he have?",
];

/** Project IDs in display order — used to resolve "the first one" / "the second one" style follow-ups. */
export const projectOrder: string[] = projects.map((p) => p.id);

export function getGreeting(lang: Lang = "en"): string {
  if (lang === "id") {
    return `Hai, aku asisten portofolio ${profile.nickname}. Tanya apa aja soal perjalanan, skill, atau project-nya.`;
  }
  return `Hi. I'm ${profile.nickname}'s portfolio assistant. Ask me anything about his journey, skills, or projects.`;
}

export function getEmptyInputPrompt(lang: Lang = "en"): string {
  if (lang === "id") {
    return `Tanya sesuatu soal ${profile.nickname} — perjalanannya, skill, project, atau cara menghubunginya.`;
  }
  return "Ask me something about Gill — his journey, skills, projects, or how to get in touch.";
}

export function getWhoIsGill(lang: Lang = "en"): string {
  const current = education.find((e) => e.current);
  if (lang === "id") {
    const lines = [
      `${profile.fullName}, biasa dipanggil "${profile.nickname}", adalah seorang ${profile.role}.`,
      current
        ? `Saat ini sedang menempuh ${current.program}${current.shortName ? ` (${current.shortName})` : ""} di ${current.institution}, ${current.period}.`
        : "",
      `Fokus utamanya: ${profile.focusAreas.join(", ")}.`,
      "",
      "Dia bukan seorang profesional atau ahli — portofolio ini mendokumentasikan seseorang yang masih aktif membangun dan belajar, satu project pada satu waktu.",
    ].filter(Boolean);
    return lines.join("\n");
  }
  const lines = [
    `${profile.fullName}, known as "${profile.nickname}", is a ${profile.role}.`,
    current
      ? `Currently studying ${current.program}${current.shortName ? ` (${current.shortName})` : ""} at ${current.institution}, ${current.period}.`
      : "",
    `Main focus areas: ${profile.focusAreas.join(", ")}.`,
    "",
    "He's not a professional or an expert — this portfolio documents someone still actively building and learning, one project at a time.",
  ].filter(Boolean);
  return lines.join("\n");
}

export function getJourney(lang: Lang = "en"): string {
  if (lang === "id") {
    const lines = [`"From minus to peak" — perjalanan ${profile.nickname} sejauh ini:`, ""];
    for (const m of journey) lines.push(`• ${m.period}: ${m.title}`);
    lines.push(
      "",
      "Singkatnya: berlatar belakang IPA, masuk TJKT tanpa minat awal yang besar, lalu menemukan arah lewat kepemimpinan, refleksi diri, dan membaca — dengan hasil yang terverifikasi di sepanjang jalan: peringkat 1 di angkatan TJKT, peringkat 2 keseluruhan. Ini disampaikan sebagai pertumbuhan, bukan drama perjuangan, dan puncaknya belum tercapai — dia masih terus mendaki."
    );
    return lines.join("\n");
  }
  const lines = [`"From minus to peak" — ${profile.nickname}'s journey so far:`, ""];
  for (const m of journey) {
    lines.push(`• ${m.period}: ${m.title}`);
  }
  lines.push(
    "",
    "In short: a science (IPA) background, landing in TJKT without much initial interest, finding direction through leadership, self-reflection, and reading, and a verified result along the way — 1st in his TJKT cohort, 2nd overall. It's presented as growth, not a dramatic struggle, and the peak hasn't been reached yet — he's still climbing."
  );
  return lines.join("\n");
}

export function getEducation(lang: Lang = "en"): string {
  const current = education.find((e) => e.current);
  if (lang === "id") {
    if (!current) return "Informasi pendidikan belum tersedia.";
    const lines = [
      `${current.program}${current.shortName ? ` (${current.shortName})` : ""} di ${current.institution}, ${current.period}.`,
      "Status: masih menempuh pendidikan — belum lulus.",
    ];
    if (pklOpportunity) {
      lines.push(
        "",
        `${pklOpportunity.label}: sebuah ${pklOpportunity.status === "upcoming-interview" ? "wawancara yang belum dikonfirmasi" : "kesempatan"} di ${pklOpportunity.organization} — belum dikonfirmasi, diterima, ataupun dimulai.`
      );
    }
    return lines.join("\n");
  }
  if (!current) return "Education information isn't available yet.";
  const lines = [
    `${current.program}${current.shortName ? ` (${current.shortName})` : ""} at ${current.institution}, ${current.period}.`,
    "Status: currently studying — not graduated.",
  ];
  if (pklOpportunity) {
    lines.push(
      "",
      `${pklOpportunity.label}: an upcoming, ${pklOpportunity.status === "upcoming-interview" ? "unconfirmed interview" : "opportunity"} at ${pklOpportunity.organization} — not yet confirmed, accepted, or started.`
    );
  }
  return lines.join("\n");
}

export function getSkills(lang: Lang = "en"): string {
  const primary = skillCategories.filter((c) => c.primary);
  if (lang === "id") {
    const lines = [
      `Fokus teknis ${profile.nickname} saat ini adalah ${primary.map((c) => c.label).join(", ")}.`,
      "",
      "Dia pernah bekerja dengan teknologi seperti:",
    ];
    for (const cat of skillCategories) lines.push(`• ${cat.label}: ${cat.skills.join(", ")}`);
    lines.push("", `Yang sedang didalami sekarang: ${technicalFocus.currentlyExploring.join(", ")}.`);
    return lines.join("\n");
  }
  const lines = [
    `${profile.nickname}'s current technical focus is ${primary.map((c) => c.label).join(", ")}.`,
    "",
    "He has worked with technologies including:",
  ];
  for (const cat of skillCategories) {
    lines.push(`• ${cat.label}: ${cat.skills.join(", ")}`);
  }
  lines.push("", `He's currently deepening: ${technicalFocus.currentlyExploring.join(", ")}.`);
  return lines.join("\n");
}

export function getCurrentlyLearning(lang: Lang = "en"): string {
  const active = skillCategories.filter((c) => c.status === "exploring" || c.status === "learning");
  if (lang === "id") {
    const lines = [`Saat ini, ${profile.nickname} sedang aktif mendalami: ${technicalFocus.currentlyExploring.join(", ")}.`];
    if (active.length) {
      lines.push("", "Lebih detail:");
      for (const c of active) lines.push(`• ${c.label} — ${c.description}`);
    }
    return lines.join("\n");
  }
  const lines = [`Right now, ${profile.nickname} is actively exploring: ${technicalFocus.currentlyExploring.join(", ")}.`];
  if (active.length) {
    lines.push("", "In particular:");
    for (const c of active) lines.push(`• ${c.label} — ${c.description}`);
  }
  return lines.join("\n");
}

function findSkillCategory(id: string) {
  return skillCategories.find((c) => c.id === id);
}

export function getLinuxAnswer(lang: Lang = "en"): string {
  const linux = findSkillCategory("linux");
  if (!linux) return lang === "id" ? "Informasi soal Linux belum tersedia." : "Linux information isn't available yet.";
  if (lang === "id") {
    return [
      `Linux & Server adalah salah satu fokus utama ${profile.nickname} — status saat ini: ${linux.status.replace("-", " ")}.`,
      linux.description,
      `Tools: ${linux.skills.join(", ")}.`,
    ].join("\n");
  }
  return [
    `Linux & Server is one of ${profile.nickname}'s primary focus areas — current status: ${linux.status.replace("-", " ")}.`,
    linux.description,
    `Tools: ${linux.skills.join(", ")}.`,
  ].join("\n");
}

export function getNetworkingAnswer(lang: Lang = "en"): string {
  const networking = findSkillCategory("networking");
  if (!networking) return lang === "id" ? "Informasi soal networking belum tersedia." : "Networking information isn't available yet.";
  const relatedExperience = experienceEntries.filter((e) => e.categoryGroup === "networking");
  if (lang === "id") {
    const lines = [
      `Networking — status saat ini: ${networking.status.replace("-", " ")}.`,
      networking.description,
      `Tools: ${networking.skills.join(", ")}.`,
    ];
    if (relatedExperience.length) {
      lines.push("", `Praktik langsung: ${relatedExperience.map((e) => e.title).join(", ")}.`);
    }
    return lines.join("\n");
  }
  const lines = [
    `Networking — current status: ${networking.status.replace("-", " ")}.`,
    networking.description,
    `Tools: ${networking.skills.join(", ")}.`,
  ];
  if (relatedExperience.length) {
    lines.push("", `Hands-on practice: ${relatedExperience.map((e) => e.title).join(", ")}.`);
  }
  return lines.join("\n");
}

export function getExperience(lang: Lang = "en"): string {
  if (lang === "id") {
    const lines = [
      "Pengalaman teknis langsung — sebagian besar tugas sekolah, praktik lab, dan eksperimen pribadi, bukan pekerjaan formal:",
      "",
    ];
    for (const cat of experienceCategories) {
      const entries = experienceEntries.filter((e) => e.categoryGroup === cat.id);
      if (!entries.length) continue;
      lines.push(`• ${cat.label}: ${entries.map((e) => e.title).join(", ")}`);
    }
    return lines.join("\n");
  }
  const lines = [
    "Hands-on technical exposure — mostly school work, lab practice, and personal experiments, not formal employment:",
    "",
  ];
  for (const cat of experienceCategories) {
    const entries = experienceEntries.filter((e) => e.categoryGroup === cat.id);
    if (!entries.length) continue;
    lines.push(`• ${cat.label}: ${entries.map((e) => e.title).join(", ")}`);
  }
  return lines.join("\n");
}

export function getProjectsOverview(lang: Lang = "en"): string {
  if (lang === "id") {
    const lines = [`Project yang sudah dibuat ${profile.nickname}:`];
    for (const p of projects) {
      lines.push(`• ${p.title} — ${p.category} (${p.team ? "project tim" : "project solo"})`);
    }
    lines.push("", 'Tanya salah satunya lebih lanjut — misalnya "Gill ngapain aja di Smart-Lab?" — untuk cerita lengkapnya.');
    return lines.join("\n");
  }
  const lines = [`${profile.nickname} has built:`];
  for (const p of projects) {
    lines.push(`• ${p.title} — ${p.category} (${p.team ? "team project" : "solo project"})`);
  }
  lines.push("", 'Ask about a specific one — e.g. "What did Gill do on Smart-Lab?" — for the full story.');
  return lines.join("\n");
}

export function getProjectDetailById(id: string, lang: Lang = "en"): string {
  const p = projects.find((project) => project.id === id);
  if (!p) return lang === "id" ? "Project itu belum ada di portofolio." : "That project isn't listed on the portfolio yet.";

  if (lang === "id") {
    const lines = [`${p.title} — ${p.category}.`, p.summary];
    if (p.team && p.contribution) {
      lines.push("", `Ini adalah project tim. Kontribusi pribadi ${profile.nickname}: ${p.contribution}`);
    } else {
      lines.push("", `Peran: ${p.role}.`);
    }
    lines.push(`Teknologi: ${p.technologies.join(", ")}.`);
    if (p.result) lines.push("", p.result);
    return lines.join("\n");
  }

  const lines = [`${p.title} — ${p.category}.`, p.summary];
  if (p.team && p.contribution) {
    lines.push("", `This was a team project. ${profile.nickname}'s personal contribution: ${p.contribution}`);
  } else {
    lines.push("", `Role: ${p.role}.`);
  }
  lines.push(`Technologies: ${p.technologies.join(", ")}.`);
  if (p.result) lines.push("", p.result);
  return lines.join("\n");
}

export function getSmartLabDeployment(lang: Lang = "en"): string {
  if (lang === "id") {
    return [
      "Smart-Lab sudah mencapai tahap pengembangan/prototipe yang selesai, tapi belum resmi digunakan (deployed) di laboratorium sekolah.",
      "Timnya kehabisan waktu saat tahap pengujian bersama kepala jurusan, jadi belum pernah dipakai untuk penggunaan rutin.",
    ].join("\n");
  }
  return [
    "Smart-Lab reached a completed development/prototype stage, but it was not officially deployed in the school laboratory.",
    "The team ran out of time during testing with the department head, so it never went live for regular use.",
  ].join("\n");
}

export function getAchievements(lang: Lang = "en"): string {
  const results = achievements.filter((a) => a.category === "academic" || a.category === "competition");
  const certifications = achievements.filter((a) => a.category === "certification");
  const medals = achievements.filter((a) => a.category === "medal");

  const lines: string[] = [];
  if (lang === "id") {
    if (results.length) {
      lines.push("Hasil:");
      for (const a of results) lines.push(`• ${a.title}${a.subtitle ? ` — ${a.subtitle}` : ""}${a.period ? ` (${a.period})` : ""}`);
    }
    if (certifications.length) {
      lines.push("", "Sertifikasi:");
      for (const a of certifications) lines.push(`• ${a.title}${a.subtitle ? ` — ${a.subtitle}` : ""}`);
    }
    if (medals.length) {
      lines.push("", "Medali:");
      for (const a of medals) lines.push(`• ${a.title}${a.subtitle ? ` — ${a.subtitle}` : ""}`);
    }
    return lines.length ? lines.join("\n") : "Belum ada achievement yang tercantum.";
  }
  if (results.length) {
    lines.push("Results:");
    for (const a of results) {
      lines.push(`• ${a.title}${a.subtitle ? ` — ${a.subtitle}` : ""}${a.period ? ` (${a.period})` : ""}`);
    }
  }
  if (certifications.length) {
    lines.push("", "Certifications:");
    for (const a of certifications) lines.push(`• ${a.title}${a.subtitle ? ` — ${a.subtitle}` : ""}`);
  }
  if (medals.length) {
    lines.push("", "Medals:");
    for (const a of medals) lines.push(`• ${a.title}${a.subtitle ? ` — ${a.subtitle}` : ""}`);
  }
  return lines.length ? lines.join("\n") : "Achievements aren't listed yet.";
}

/**
 * Targeted follow-up for "yang itu juara berapa?" / "what place did he
 * get?" style questions asked right after an achievements answer.
 * Answered strictly from `achievements.ts`: the MikroTik National
 * Competition entry is on file as national-level *participation*,
 * with no numbered placement — so that's exactly what's said, instead
 * of inventing a rank. The two medals that *do* have a specific
 * placement are named alongside it so the answer stays useful.
 */
export function getAchievementRankFollowUp(lang: Lang = "en"): string {
  const competition = achievements.find((a) => a.category === "competition");
  const medals = achievements.filter((a) => a.category === "medal");
  const medalList = medals.map((m) => `${m.title}${m.subtitle ? ` (${m.subtitle})` : ""}`).join(", ");

  if (lang === "id") {
    if (!competition) return "Belum ada detail peringkat yang tercantum untuk lomba itu.";
    const lines = [
      `Untuk ${competition.title}${competition.subtitle ? ` (${competition.subtitle})` : ""}, portofolio ini belum mencantumkan juara ke berapa — statusnya tercatat sebagai partisipasi tingkat nasional, bukan hasil peringkat tertentu.`,
    ];
    if (medalList) lines.push(`Yang punya peringkat spesifik: ${medalList}.`);
    return lines.join("\n");
  }
  if (!competition) return "No specific placement is listed for that competition yet.";
  const lines = [
    `For ${competition.title}${competition.subtitle ? ` (${competition.subtitle})` : ""}, the portfolio doesn't list a numbered placement — it's on file as national-level participation, not a specific ranking.`,
  ];
  if (medalList) lines.push(`The ones that do have a specific placement: ${medalList}.`);
  return lines.join("\n");
}

/**
 * Follow-up fix (conversation-context upgrade): "yang nasional?" /
 * "yang mikrotik?" / "yang sertifikat?" style narrowing questions
 * asked right after an achievements answer. Formats a caller-supplied
 * *subset* of `achievements.ts` — see `ACHIEVEMENT_FILTERS` in
 * `src/lib/localAiEngine.ts` for how that subset is picked from the
 * follow-up text. Kept as a pure formatter here (no filtering logic)
 * so it stays consistent with `getAchievements()`'s formatting and
 * never invents anything beyond what's passed in.
 */
export function getAchievementSubsetFollowUp(lang: Lang, matches: Achievement[]): string {
  if (!matches.length) {
    return lang === "id"
      ? "Aku belum nemu achievement spesifik yang cocok sama itu di data portfolio Gill."
      : "I couldn't match that to a specific achievement in Gill's portfolio data.";
  }
  const lines = matches.map((a) => {
    const bits = [a.title];
    if (a.subtitle) bits.push(`— ${a.subtitle}`);
    if (a.period) bits.push(`(${a.period})`);
    return `• ${bits.join(" ")}`;
  });
  return lines.join("\n");
}

/**
 * "itu kapan?" / "when was that?" follow-up. Only ever reports a
 * `period` that's actually on file (e.g. "Grade 12") — for entries
 * with no `period` set, says plainly that no date/period is listed
 * rather than inventing one (see PROJECT_CONTEXT.md hallucination-
 * prevention rule, same as `getAchievementRankFollowUp`).
 */
export function getAchievementPeriodFollowUp(lang: Lang, matches: Achievement[]): string {
  if (!matches.length) {
    return lang === "id"
      ? "Aku belum yakin achievement mana yang dimaksud, jadi aku belum bisa kasih periode waktunya."
      : "I'm not sure which achievement that refers to, so I can't give a period for it yet.";
  }
  const lines = matches.map((a) => {
    const label = `${a.title}${a.subtitle ? ` — ${a.subtitle}` : ""}`;
    if (a.period) {
      return lang === "id" ? `• ${label}: ${a.period}.` : `• ${label}: ${a.period}.`;
    }
    return lang === "id"
      ? `• ${label}: belum ada periode/tanggal spesifik yang tercantum di portfolio.`
      : `• ${label}: no specific period/date is listed in the portfolio yet.`;
  });
  return lines.join("\n");
}

export function getContact(lang: Lang = "en"): string {
  const real = profile.socials.filter((s) => isRealSocial(s.href));
  if (!real.length) return lang === "id" ? "Informasi kontak Gill belum tersedia." : "I don't have Gill's contact information available yet.";
  return real.map((s) => `${s.label}: ${s.href}`).join("\n");
}

/**
 * Hallucination-prevention fallbacks — see PROJECT_CONTEXT.md Phase 09
 * / Phase 12 notes. These are returned instead of ever guessing, in
 * whichever language the visitor is using.
 */
export function getEmployerFallback(lang: Lang = "en"): string {
  if (lang === "id") return "Belum ada informasi tentang pekerjaan formal di portofolio Gill.";
  return "Gill's portfolio does not currently list a formal employment position.";
}

export function getPklFallback(lang: Lang = "en"): string {
  if (lang === "id") return `Gill belum menyelesaikan PKL-nya. ${pklOpportunity.description}`;
  return `Gill has not completed his PKL yet. ${pklOpportunity.description}`;
}

export function getOffTopicFallback(lang: Lang = "en"): string {
  if (lang === "id") {
    return `Aku dibuat untuk menjawab pertanyaan seputar latar belakang, skill, perjalanan, dan project ${profile.nickname} — untuk hal itu aku belum bisa bantu. Coba tanya soal perjalanannya, project, atau fokus teknisnya.`;
  }
  return `I'm built to answer questions about ${profile.nickname}'s background, skills, journey, and projects — I can't help with that one. Try asking about his journey, projects, or technical focus instead.`;
}

export function getUnknownFallback(lang: Lang = "en"): string {
  if (lang === "id") {
    return "Aku kurang nangkep maksudnya. Aku bisa jawab soal perjalanan, skill, project, pendidikan, achievement, atau cara menghubungi Gill — coba tanya ulang dengan cara lain?";
  }
  return "I'm not sure I caught that. I can answer questions about Gill's journey, skills, projects, education, achievements, or how to contact him — try rephrasing?";
}

/**
 * Real-backend upgrade — the grounding block handed to a real AI
 * provider as part of the system prompt (see
 * `src/pages/api/chat.ts`). This assembles the exact same
 * `src/data/*.ts` source-of-truth every `get*` function above already
 * reads, into one compact, structured, English-language reference
 * block — it does not duplicate the data anywhere, only formats it
 * for a model to read in a single request.
 *
 * Kept deliberately plain (facts + short labels, no persuasive
 * language) so the model can freely phrase its own answer in
 * whatever language/tone the conversation calls for, without
 * inheriting a specific voice from this text. English is used here
 * purely because it's the model's grounding context, not what it will
 * necessarily reply in — the system prompt separately instructs it to
 * always answer in the visitor's own language.
 */
export function buildKnowledgeBaseText(): string {
  const lines: string[] = [];

  lines.push("## Profile");
  lines.push(`Full name: ${profile.fullName} (goes by "${profile.nickname}")`);
  lines.push(`Role: ${profile.role}`);
  lines.push(`Status: ${profile.status}`);
  lines.push(`Location: ${profile.location}`);
  lines.push(`Tagline: "${profile.tagline}"`);
  lines.push(`Focus areas: ${profile.focusAreas.join(", ")}`);
  const realSocials = profile.socials.filter((s) => isRealSocial(s.href));
  lines.push(
    realSocials.length
      ? `Verified contact/social links: ${realSocials.map((s) => `${s.label} (${s.href})`).join(", ")}`
      : "Verified contact/social links: none published yet — do not invent one."
  );

  lines.push("", "## Journey (chronological)");
  for (const m of journey) {
    lines.push(`- [${m.period}] ${m.title}: ${m.description}${m.metric ? ` (Result: ${m.metric})` : ""}`);
  }

  lines.push("", "## Education");
  for (const e of education) {
    lines.push(
      `- ${e.program}${e.shortName ? ` (${e.shortName})` : ""} at ${e.institution}, ${e.period}${
        e.current ? " — currently enrolled, not graduated" : ""
      }. ${e.description}`
    );
  }
  lines.push(
    `PKL/internship status: NOT completed. ${pklOpportunity.label} at ${pklOpportunity.organization} — ${pklOpportunity.description}`
  );

  lines.push("", "## Skills");
  for (const c of skillCategories) {
    lines.push(`- ${c.label} (status: ${c.status}${c.primary ? ", primary focus area" : ""}): ${c.description} Tools: ${c.skills.join(", ")}.`);
  }
  lines.push(`Currently actively focused on: ${technicalFocus.currentFocus.join(", ")}`);
  lines.push(`Currently exploring/deepening: ${technicalFocus.currentlyExploring.join(", ")}`);

  lines.push("", "## Hands-on technical experience (NOT formal employment — school work, lab practice, personal experiments)");
  for (const cat of experienceCategories) {
    const entries = experienceEntries.filter((e) => e.categoryGroup === cat.id);
    if (!entries.length) continue;
    lines.push(`- ${cat.label}: ${entries.map((e) => `${e.title} (${e.technologies.join(", ")})`).join("; ")}`);
  }
  lines.push("Employment status: no formal job/employer is on file. Never state or imply Gill has a current employer.");

  lines.push("", "## Projects");
  for (const p of projects) {
    lines.push(`- ${p.title} (${p.category}), status: ${p.status}, ${p.team ? "team project" : "solo project"}.`);
    lines.push(`  Summary: ${p.summary}`);
    if (p.team && p.contribution) lines.push(`  Gill's personal contribution (team project): ${p.contribution}`);
    if (p.result) lines.push(`  Result: ${p.result}`);
    lines.push(`  Technologies: ${p.technologies.join(", ")}`);
  }
  if (upcomingProjectAreas.length) {
    lines.push(`Other real experience areas without a detailed project write-up yet: ${upcomingProjectAreas.map((a) => a.label).join(", ")}`);
  }

  lines.push("", "## Achievements");
  for (const a of achievements) {
    lines.push(
      `- [${a.categoryLabel}] ${a.title}${a.subtitle ? ` — ${a.subtitle}` : ""}${a.period ? ` (${a.period})` : ""}: ${a.description}`
    );
  }
  lines.push(
    "Note: the MikroTik National Competition entry is on file as national-level PARTICIPATION only — no numbered placement/rank is verified for it. Do not invent a ranking for it."
  );

  return lines.join("\n");
}
