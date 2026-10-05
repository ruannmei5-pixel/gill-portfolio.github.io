/**
 * Shared data-shape contracts.
 *
 * These types describe the site's content regardless of where it comes
 * from. Right now every value is imported from `src/data/*.ts`; later,
 * the same shapes should be satisfiable by a Laravel REST API response
 * so pages/components do not need to change when that swap happens.
 */

export interface Profile {
  fullName: string;
  nickname: string;
  role: string;
  status: string;
  location: string;
  tagline: string;
  /**
   * The personal-philosophy lines shown under the hero tagline
   * ("I didn't choose where I started. I choose how far I go.").
   * Kept as data, not hardcoded in the component, so the wording can
   * be revised without touching markup.
   */
  philosophy: string[];
  focusAreas: string[];
  avatarPlaceholder: string;
  socials: SocialLink[];
  /**
   * Phase 09 (Contact section) — the canonical, structured contact
   * details used by `Contact.astro`. Kept separate from `socials`
   * (which is a generic list still used by the Footer and the AI
   * assistant) so the Contact section has a fixed, predictable shape
   * instead of mapping over an array.
   */
  contact: {
    email: string;
    github: string;
    linkedin: string;
    instagram: string;
  };
}

export interface SocialLink {
  label: string;
  href: string;
  handle?: string;
}

export type JourneyStage =
  | "origin"
  | "adaptation"
  | "leadership"
  | "discovery"
  | "achievement"
  | "breaking-comfort-zone"
  | "current";

export interface JourneyMilestone {
  id: string;
  stage: JourneyStage;
  /**
   * A period label, not a literal date — e.g. "Grade 10", "Grade 11",
   * "Grade 12", "Current". Deliberately not named `year`: exact
   * years/months were never verified, so the type shouldn't imply
   * they exist.
   */
  period: string;
  title: string;
  description: string;
  elevation: number; // -100 (minus) .. 100 (peak), used to plot the ascent
  /** Optional short tags surfaced as small chips (e.g. "Leadership"). */
  tags?: string[];
  /**
   * An optional, verified metric/result to call out (e.g. a class
   * ranking). Omit rather than invent one — see `src/data/journey.ts`.
   */
  metric?: string;
}

/**
 * Deliberately qualitative, not a proficiency scale. There is no
 * "expert"/"advanced" tier — see PROJECT_CONTEXT.md Phase 04: skill
 * levels are never claimed as percentages or fixed tiers, only as an
 * honest description of *how* the category is currently being engaged
 * with.
 */
export type SkillStatus = "exploring" | "learning" | "building" | "working-with";

export interface SkillCategory {
  id: string;
  label: string;
  /** One or two sentences: what this category is, in practice. */
  description: string;
  status: SkillStatus;
  /**
   * Marks one of the four pillars named in the brief (Web Development,
   * Linux, Networking, AI) for visual emphasis. Everything else is
   * support/context around these four.
   */
  primary?: boolean;
  /**
   * Flat technology/tool names. Deliberately just names, not
   * per-technology proficiency — see `status` for the one honest,
   * category-level signal this data makes.
   */
  skills: string[];
}

/**
 * The small "technical dashboard" panel in the Skills section — what
 * Gill is actively working with right now vs. what he's currently
 * exploring. Both lists are short and drawn directly from the
 * category data, not a separate invented signal.
 */
export interface TechnicalFocus {
  currentFocus: string[];
  currentlyExploring: string[];
}

/**
 * A single step in the skill-development sequence shown under the
 * skill grid (foundation → ... → current). Purely structural/labeling
 * data — not a chart, not a score.
 */
export interface SkillProgressionStage {
  id: string;
  label: string;
}

/**
 * Expanded beyond the original three values so status can honestly
 * reflect projects that are functionally finished but never went
 * live, and small hardware prototypes that were never meant to be
 * "shipped" in the web-app sense. Existing values are kept so nothing
 * currently relying on them breaks.
 */
export type ProjectStatus =
  | "prototype"
  | "complete-not-deployed"
  | "in-progress"
  | "shipped"
  | "archived";

export interface ProjectLinks {
  live?: string;
  repo?: string;
}

export interface Project {
  id: string;
  title: string;
  /** Short category/kind label, e.g. "Smart Laboratory System". */
  category: string;
  /** One or two sentences for the card — not the full technical story. */
  summary: string;
  /** What problem the project was trying to solve. Omit if not verified. */
  problem?: string;
  /** How it was approached/built. Omit if not verified. */
  approach?: string;
  /** e.g. "Team project" or "Solo project" — not the same as `contribution`. */
  role: string;
  /**
   * Gill's own, specific part of the work — always shown prominently,
   * especially on team projects, so it's never ambiguous what he
   * personally built. Omit only for genuinely solo projects where
   * `role`/`summary` already make this unambiguous.
   */
  contribution?: string;
  /** What the project demonstrated — never a metric, user count, or deployment claim that wasn't verified. */
  result?: string;
  technologies: string[];
  status: ProjectStatus;
  /** True when this was built with others, not solo. */
  team?: boolean;
  /** Renders the larger, two-column technical-case-study layout. */
  featured?: boolean;
  /**
   * An ordered, purely conceptual list of components for the small
   * flow/architecture visualization (e.g. ["RFID","ESP32","URL",
   * "Laravel","MySQL"]). Always rendered labeled as an overview, never
   * implied to be a verified live data-flow diagram.
   */
  architecture?: string[];
  links?: ProjectLinks;
  /** Omit rather than invent — exact dates were never verified for these entries. */
  year?: string;
}

/**
 * Project categories/areas that exist in real experience but don't
 * have a verified, detailed project entry yet. Rendered as a plain
 * "more experiments coming" list — never as fabricated project cards.
 */
export interface UpcomingProjectArea {
  label: string;
}

/**
 * Phase 06: replaces the original flat shape (`issuer`/`date` always
 * required) now that real entries exist. Real entries span very
 * different kinds of recognition — an academic ranking, a national
 * competition, a certification, a school medal — so `issuer`/`date`
 * are optional rather than assumed, and are only ever populated when
 * actually verified (see `src/data/achievements.ts`).
 */
export type AchievementCategory = "academic" | "competition" | "certification" | "medal";

/**
 * Drives visual hierarchy only — never implies the lower tiers are
 * unimportant, just that (per the brief) technical/competition results
 * get more visual weight than school medals for a tech-recruiter
 * audience.
 */
export type AchievementTier = "high" | "medium" | "supporting";

/**
 * Phase 11: structured detail for achievements that are backed by an
 * actual certificate document, so a real scan/photo and its metadata
 * can be dropped in later without a data-shape change. Every field is
 * optional and must stay that way — none of these are invented; they
 * are only ever populated once actually verified. `image` falls back
 * to the shared certificate placeholder graphic
 * (`/images/certificate-placeholder.svg`) until a real scan exists.
 */
export interface CertificateDetails {
  /** Path to the certificate image. Use the shared placeholder until a real scan/photo is added. */
  image?: string;
  /** The issuing organization/body. Omit until verified — never invent one. */
  issuer?: string;
  /** The certificate's actual issuance date. Omit until verified — never invent one. */
  issuedDate?: string;
  /** Credential/certificate ID, only if the certificate actually has one. Omit until verified. */
  credentialId?: string;
  /** A real, working verification URL (e.g. the issuer's credential-check page). Omit until verified. */
  verificationUrl?: string;
}

export interface Achievement {
  id: string;
  category: AchievementCategory;
  /** Display label for the category, e.g. "Academic", "Competition". */
  categoryLabel: string;
  /** Main line, e.g. "1st Place", "MikroTik", "Network Fundamental". */
  title: string;
  /** Short qualifier under the title, e.g. "TJKT Cohort", "Overall". Omit if not applicable. */
  subtitle?: string;
  description: string;
  tier: AchievementTier;
  /** Renders the single large hero treatment. Exactly one entry should set this. */
  featured?: boolean;
  /**
   * A verified period label (e.g. "Grade 11"), matching the same
   * labels already used in `journey.ts` — never an exact date that
   * wasn't given.
   */
  period?: string;
  /** Omit rather than invent — only set when an issuing body was actually verified. */
  issuer?: string;
  /**
   * Present only for achievements actually backed by a certificate
   * document. Its own fields stay optional/undefined until real
   * details exist — see `CertificateDetails` above.
   */
  certificate?: CertificateDetails;
}

export interface EducationEntry {
  id: string;
  institution: string;
  program: string;
  /** Short form of the program name, e.g. "TJKT". Optional. */
  shortName?: string;
  period: string;
  description: string;
  /** True for the current, in-progress program — drives "in progress" vs. plain past-entry styling. */
  current?: boolean;
  /** Broad field/direction for the technical info card, e.g. "Technology", "Science (IPA)". */
  direction?: string;
}

/**
 * The short paragraph connecting Education back to the Journey section
 * — a summary, not a repeat of it. Kept as data (not hardcoded in the
 * component) so wording can change without touching markup, same as
 * `profile.philosophy`.
 */
export interface EducationStory {
  story: string;
}

/**
 * Gill has not completed a PKL (internship). The only real status is
 * an unconfirmed upcoming interview/opportunity — this type has no
 * "completed" or "hired" value on purpose, so it can't be misused to
 * imply otherwise later.
 */
export type PklStatus = "upcoming-interview";

export interface PklOpportunity {
  label: string;
  organization: string;
  status: PklStatus;
  description: string;
}

export interface NavItem {
  label: string;
  href: string;
}

/**
 * Phase 07 — Technical Experience ("Beyond the classroom").
 *
 * Gill has NOT completed a PKL/internship — see `PklOpportunity` above,
 * which already covers that status in the Education section. Nothing
 * in this section may be presented as formal employment, a job title,
 * a client, or a company engagement. Every entry here is hands-on
 * technical exposure (school work, lab work, personal practice), not
 * a work-experience history.
 */
export type ExperienceCategoryGroup = "networking" | "server" | "hardware" | "web" | "embedded";

/**
 * How an entry is framed — deliberately none of these read as a job.
 * "networking-practice"/"server-practice"/"lab-environment" exist as
 * distinct values (rather than reusing "technical-practice" for
 * everything) so the Networking and Linux/Server subsections can use
 * the exact wording named in the brief.
 */
export type ExperienceType =
  | "hands-on-practice"
  | "school-project"
  | "lab-work"
  | "technical-practice"
  | "personal-experiment"
  | "networking-practice"
  | "server-practice"
  | "lab-environment";

export interface ExperienceEntry {
  id: string;
  title: string;
  categoryGroup: ExperienceCategoryGroup;
  /** Short display label, e.g. "Hardware / Security". */
  categoryLabel: string;
  description: string;
  /** Flat tool/technology names — same pattern as `SkillCategory.skills`. */
  technologies: string[];
  type: ExperienceType;
  /**
   * Stronger visual emphasis for networking-related entries, per the
   * brief. Never implies professional network-engineering experience
   * — the emphasis is visual weight only, not a claim of expertise.
   */
  featured?: boolean;
  /**
   * IDs of entries in `src/data/projects.ts` this connects to (e.g.
   * Website Development → Smart-Lab). Rendered as a plain link back
   * to the Projects section — never a duplicated case study.
   */
  relatedProjectIds?: string[];
}

export interface ExperienceCategoryMeta {
  id: ExperienceCategoryGroup;
  label: string;
  description: string;
}

/**
 * Phase 09 — Gill AI Assistant. Extended in Phase 12 (Prompt 15) with
 * `lang` for multilingual (EN/ID) responses — see `src/lib/lang.ts`.
 *
 * Real-backend upgrade: the browser no longer sends this shape to
 * anything — `AiAssistant.astro` now keeps a plain `ChatMessage[]`
 * history and POSTs the whole thing to `/api/chat` (see
 * `src/lib/aiEngine.ts`). This type lives on server-side only now: it
 * is exactly what `src/lib/localAiEngine.ts` (the old client-side
 * rule-based matcher, relocated) still uses turn-to-turn to resolve
 * pronoun/topic follow-ups when it's running as the no-API-key
 * fallback inside `src/pages/api/chat.ts`.
 */
export interface AiConversationContext {
  lastTopic?: string;
  lastProjectId?: string;
  /**
   * Conversation-context fix: IDs (from `src/data/achievements.ts`) of
   * whichever achievement(s) were most recently surfaced, so a short
   * narrowing follow-up like "itu kapan?" can resolve back to the
   * specific achievement(s) just discussed instead of only knowing
   * the broad `lastTopic: "achievements"`. Reconstructed per-request
   * by replaying history — see `deriveLocalContext` in
   * `src/pages/api/chat.ts` — same as `lastProjectId`.
   */
  lastAchievementIds?: string[];
  /** The language ("en" | "id") the assistant last replied in, used only as a tiebreaker for ambiguous/short follow-ups. */
  lang?: "en" | "id";
}

export interface AiAnswer {
  text: string;
  topic?: string;
  projectId?: string;
  /** IDs of the achievement(s) this answer was about, if any — see `AiConversationContext.lastAchievementIds`. */
  achievementIds?: string[];
  /** The language ("en" | "id") this answer was written in. */
  lang?: "en" | "id";
}

/**
 * Real-backend upgrade — the wire format between the browser and
 * `POST /api/chat`. The client keeps the full turn-by-turn history in
 * memory (same "nothing persisted, nothing sent anywhere but this one
 * request" rule as before) and sends it every time, so the server
 * stays stateless and follow-up questions still work naturally.
 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
