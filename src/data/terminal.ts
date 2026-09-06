import { profile } from "@data/profile";
import { journey } from "@data/journey";
import { skillCategories } from "@data/skills";
import { projects } from "@data/projects";
import { experienceEntries } from "@data/experience";
import { education, pklOpportunity } from "@data/education";
import { achievements } from "@data/achievements";

/**
 * Phase 08 — Interactive Terminal.
 *
 * This module is the single source of truth for what the terminal can
 * say. It is deliberately data-driven (imports the same `src/data/*`
 * files the rest of the site already uses) rather than holding its
 * own copy of personal information, so nothing here can drift out of
 * sync with the verified content elsewhere on the site.
 *
 * This is a SIMULATED terminal only:
 * - no `eval()`, no `Function()`, no dynamic code execution
 * - no network requests, no backend, no real shell
 * - output is always plain text (string[]), rendered with textContent
 *   by the component — never innerHTML — so nothing here can inject
 *   markup even if a future edit accidentally included special
 *   characters in a data file.
 */

export interface CommandResult {
  /** Plain text lines to print. Rendered literally — never as HTML. */
  lines: string[];
  /** When true, the component clears the whole output log instead of appending. */
  clearScreen?: boolean;
}

interface CommandDefinition {
  name: string;
  summary: string;
  run: () => CommandResult;
}

/** Everything printed above the very first prompt. */
export function bootLines(): string[] {
  return [
    "GILL SYSTEM",
    "────────────────────────────",
    "STATUS: ONLINE",
    "MODE: PORTFOLIO",
    "LOCATION: WEB",
    "",
    'Type "help" to see available commands.',
  ];
}

function whoami(): CommandResult {
  return {
    lines: [
      profile.fullName,
      `"${profile.nickname}"`,
      "",
      profile.status,
      "Technology Enthusiast",
      "",
      "Focus:",
      ...profile.focusAreas.map((area) => `  ${area}`),
    ],
  };
}

function about(): CommandResult {
  const current = education.find((entry) => entry.current);
  return {
    lines: [
      `${profile.fullName} ("${profile.nickname}") — ${profile.role}.`,
      "",
      "The path here wasn't a straight line: a science (IPA) background,",
      "not getting into the originally intended school, and landing in",
      "TJKT without much initial interest.",
      "",
      "Direction grew through hands-on learning, self-reflection,",
      "leadership, competitions, and real projects — not from having",
      "it all figured out on day one.",
      ...(current ? ["", `Currently: ${current.program} (${current.shortName ?? ""}) — ${current.period}`] : []),
    ],
  };
}

/** Short label per journey stage, for the compact terminal rendering. */
const journeyStageLabel: Record<string, string> = {
  origin: "IPA background",
  adaptation: "TJKT",
  leadership: "Leadership",
  discovery: "Technical discovery",
  achievement: "1st place TJKT cohort",
  "breaking-comfort-zone": "Leaving comfort zone",
  current: "Still climbing",
};

function journeyCommand(): CommandResult {
  const steps = journey.map((milestone) => journeyStageLabel[milestone.stage] ?? milestone.title);
  const lines: string[] = ["FROM MINUS TO PEAK", ""];
  steps.forEach((step, i) => {
    lines.push(step);
    if (i < steps.length - 1) lines.push("  ↓");
  });
  lines.push("", 'Full story in the "Journey" section.');
  return { lines };
}

function skillsCommand(): CommandResult {
  const primary = skillCategories.filter((cat) => cat.primary);
  const support = skillCategories.filter((cat) => !cat.primary);
  const lines: string[] = ["Primary areas:", ""];
  for (const cat of primary) {
    lines.push(`  ${cat.label}`);
    lines.push(`    ${cat.skills.join(", ")}`);
  }
  if (support.length) {
    lines.push("", "Also exploring:");
    for (const cat of support) {
      lines.push(`  ${cat.label} — ${cat.skills.join(", ")}`);
    }
  }
  return { lines };
}

function projectsCommand(): CommandResult {
  const lines: string[] = [];
  for (const project of projects) {
    lines.push(project.title.toUpperCase());
    if (project.team) {
      lines.push("  TEAM PROJECT");
      if (project.contribution) lines.push(`  Gill's contribution: ${project.contribution}`);
    } else {
      lines.push(`  ${project.role}`);
    }
    lines.push(`  ${project.technologies.join(", ")}`);
    lines.push("");
  }
  lines.push('Full write-ups in the "Projects" section.');
  return { lines };
}

function experienceCommand(): CommandResult {
  const titles = experienceEntries.map((entry) => entry.title);
  return {
    lines: ["Hands-on technical exposure:", "", ...titles.map((t) => `  ${t}`)],
  };
}

function educationCommand(): CommandResult {
  const current = education.find((entry) => entry.current);
  if (!current) {
    return { lines: ["Education information will be available soon."] };
  }
  const lines = [
    current.institution,
    current.shortName ?? current.program,
    current.period,
    "",
    "Status: CURRENTLY STUDYING",
  ];
  if (pklOpportunity) {
    lines.push("", `${pklOpportunity.label}: ${pklOpportunity.organization} (not yet confirmed)`);
  }
  return { lines };
}

function achievementsCommand(): CommandResult {
  const results = achievements.filter((a) => a.category === "academic" || a.category === "competition");
  const certifications = achievements.filter((a) => a.category === "certification");
  const medals = achievements.filter((a) => a.category === "medal");

  const lines: string[] = [];
  if (results.length) {
    lines.push("Results:");
    for (const a of results) {
      lines.push(`  ${a.title}${a.subtitle ? ` — ${a.subtitle}` : ""}`);
    }
  }
  if (certifications.length) {
    lines.push("", "Certifications:");
    for (const a of certifications) {
      lines.push(`  ${a.title}${a.subtitle ? ` — ${a.subtitle}` : ""}`);
    }
  }
  if (medals.length) {
    lines.push("", "Medals:");
    for (const a of medals) {
      lines.push(`  ${a.title}${a.subtitle ? ` — ${a.subtitle}` : ""}`);
    }
  }
  return { lines: lines.length ? lines : ["Achievements will be available soon."] };
}

/** A social link only counts as "real" once it's an actual destination, not a TODO placeholder. */
function isRealSocial(href: string): boolean {
  if (!href) return false;
  if (href === "#") return false;
  if (href.includes("example.com")) return false;
  return true;
}

function contactCommand(): CommandResult {
  const real = profile.socials.filter((s) => isRealSocial(s.href));
  if (!real.length) {
    return { lines: ["Contact information will be available soon."] };
  }
  return { lines: real.map((s) => `${s.label}: ${s.href}`) };
}

function dateCommand(): CommandResult {
  const now = new Date();
  return {
    lines: [
      now.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    ],
  };
}

function statusCommand(): CommandResult {
  const rows: [string, string][] = [
    ["PORTFOLIO", "ONLINE"],
    ["JOURNEY", "ONGOING"],
    ["LEARNING", "ACTIVE"],
    ["PROJECTS", "DEVELOPING"],
    ["AI", "EXPERIMENTAL"],
  ];
  return {
    lines: ["SYSTEM STATUS", "", ...rows.map(([label, value]) => `${label.padEnd(14)}${value}`)],
  };
}

function aiCommand(): CommandResult {
  return {
    lines: [
      "Gill AI is live — a rule-based assistant answering questions",
      "from this portfolio's verified data (no external AI provider yet).",
      "",
      'Try the "Ask Gill AI" section on this page, or visit /ai directly.',
    ],
  };
}

function clearCommand(): CommandResult {
  return { lines: [], clearScreen: true };
}

function helpCommand(): CommandResult {
  const rows: [string, string][] = commandDefinitions.map((c) => [c.name, c.summary]);
  return {
    lines: ["Available commands:", "", ...rows.map(([name, summary]) => `  ${name.padEnd(12)}${summary}`)],
  };
}

/**
 * Ordered command table. `help`/autocomplete/unknown-command handling
 * all read from this single list so a future command only needs to be
 * added here once.
 */
const commandDefinitions: CommandDefinition[] = [
  { name: "help", summary: "available commands", run: helpCommand },
  { name: "whoami", summary: "identity", run: whoami },
  { name: "about", summary: "about Gill", run: about },
  { name: "journey", summary: "personal journey", run: journeyCommand },
  { name: "skills", summary: "technical skills", run: skillsCommand },
  { name: "projects", summary: "selected projects", run: projectsCommand },
  { name: "experience", summary: "hands-on experience", run: experienceCommand },
  { name: "education", summary: "education", run: educationCommand },
  { name: "achievements", summary: "milestones", run: achievementsCommand },
  { name: "contact", summary: "contact information", run: contactCommand },
  { name: "status", summary: "system status", run: statusCommand },
  { name: "date", summary: "current date", run: dateCommand },
  { name: "clear", summary: "clear terminal", run: clearCommand },
  // Phase 09 — points to the now-real Gill AI assistant.
  { name: "ai", summary: "ask Gill AI", run: aiCommand },
];

/** Plain command names, used for Tab-completion. */
export const commandNames: string[] = commandDefinitions.map((c) => c.name);

/**
 * Runs a single command line. Never evaluates the input as code —
 * this is a fixed lookup against `commandDefinitions` only.
 */
export function runCommand(rawInput: string): CommandResult {
  const trimmed = rawInput.trim();
  if (!trimmed) return { lines: [] };

  const [name] = trimmed.toLowerCase().split(/\s+/);
  const match = commandDefinitions.find((c) => c.name === name);

  if (!match) {
    return {
      lines: [`Command not found: ${name}`, "", 'Type "help" to see available commands.'],
    };
  }

  return match.run();
}
