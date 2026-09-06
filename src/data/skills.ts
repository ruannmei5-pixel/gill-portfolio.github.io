import type { SkillCategory, TechnicalFocus, SkillProgressionStage } from "@/types";

/**
 * Phase 04 — Technical Profile.
 *
 * Categories follow the five areas from the brief. Four are marked
 * `primary: true` — Web Development, Networking, Linux & Server, and
 * AI — Gill's main areas of interest; Embedded/IoT is real (school
 * projects) but kept as supporting context rather than a pillar.
 *
 * `status` is the one qualitative signal used per category
 * (exploring / learning / building / working-with) — never a
 * percentage, a 1–10 score, or a tier like "advanced"/"expert". See
 * `SkillStatus` in `src/types/index.ts`.
 *
 * Every technology listed here is one already named in the verified
 * brief/context (TJKT coursework, the MikroTik olympiad, school
 * embedded projects, and ongoing personal learning) — nothing here is
 * invented, and no certification or job history is implied by listing
 * a tool.
 */
export const skillCategories: SkillCategory[] = [
  {
    id: "web",
    label: "Web Development",
    description:
      "Building interfaces and small applications — from plain markup up to typed, component-driven sites, with Laravel and Filament on the backend side.",
    status: "building",
    primary: true,
    skills: ["HTML", "CSS", "JavaScript", "TypeScript", "Astro", "Laravel", "Filament", "PHP"],
  },
  {
    id: "networking",
    label: "Networking",
    description:
      "Understanding how networks actually get built — MikroTik configuration, topology, and FTTH — sharpened through TJKT coursework and a national-level networking olympiad.",
    status: "learning",
    primary: true,
    skills: ["MikroTik", "TCP/IP", "Network Topology", "FTTH", "Basic Network Configuration"],
  },
  {
    id: "linux",
    label: "Linux & Server",
    description:
      "Working day to day in a Linux/Debian environment — setting up and configuring servers, and troubleshooting when they don't behave.",
    status: "working-with",
    primary: true,
    skills: ["Linux", "Debian", "Nginx", "Apache", "VirtualBox", "Server Configuration", "Troubleshooting"],
  },
  {
    id: "ai",
    label: "AI",
    description:
      "Using AI tools as part of the build process itself, and as a reflection tool while learning — a growing habit, not a finished specialty.",
    status: "exploring",
    primary: true,
    skills: ["AI Tools", "AI-Assisted Development", "AI Experimentation", "AI Concepts"],
  },
  {
    id: "embedded",
    label: "Embedded / IoT",
    description:
      "Hardware and microcontrollers through school projects — sensors, motors, and simple identification systems on Arduino and ESP32.",
    status: "exploring",
    skills: ["Arduino", "ESP32", "Ultrasonic Sensor", "Servo", "RFID"],
  },
];

/**
 * The small technical-context panel in the Skills section. Both lists
 * are short summaries of the category data above, not a separate
 * invented metric.
 */
export const technicalFocus: TechnicalFocus = {
  currentFocus: ["MikroTik", "Linux Server", "Web Development", "AI"],
  currentlyExploring: ["Network configuration", "Server deployment", "Web applications", "AI-assisted development"],
};

/**
 * A structural sequence, not a chart: TJKT gives a networking
 * foundation first, Linux/server work follows to support that
 * networking, web development sits on top as the application layer,
 * and AI is the current, still-forming area of interest — consistent
 * with the discovery/breaking-comfort-zone beats in
 * `src/data/journey.ts`.
 */
export const skillProgression: SkillProgressionStage[] = [
  { id: "foundation", label: "Foundation" },
  { id: "networking", label: "Networking" },
  { id: "linux", label: "Linux" },
  { id: "web", label: "Web Development" },
  { id: "ai", label: "AI" },
];
