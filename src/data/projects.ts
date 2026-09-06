import type { Project, UpcomingProjectArea } from "@/types";

/**
 * Phase 05 — Projects.
 *
 * Two verified projects. Every field traces back to what was actually
 * confirmed:
 *
 * - Smart-Lab was a TEAM project. Gill's own contribution was the
 *   automatic laboratory door lock — that is kept in `contribution`,
 *   separate from `role`, so it's never ambiguous what he personally
 *   built vs. what the team built together.
 * - Smart-Lab is explicitly `"complete-not-deployed"` — it was
 *   functionally finished but never went live in the school
 *   laboratory (the team ran out of time during testing with the
 *   department head). Nothing here implies it is currently in use.
 * - The Smart-Lab link is the existing external demo URL only — not a
 *   claim of uptime or availability.
 * - Automatic Gate is a small solo embedded prototype — deliberately
 *   not inflated into more than that.
 * - No dates, user counts, deployment numbers, or competition results
 *   are included for either project — none were verified.
 */
export const projects: Project[] = [
  {
    id: "smart-lab",
    title: "Smart-Lab",
    category: "Smart Laboratory System",
    summary:
      "A smart laboratory system designed to reduce human error in securing the school laboratory and improve how it's managed.",
    problem:
      "Laboratory security and management can depend on humans remembering to lock the room and manage access correctly.",
    approach:
      "An integrated system combining ESP32-based hardware with a Laravel web application: automatic door locking, RFID-based access, and web-based control of laboratory usage, lighting, and AC behavior. The ESP32 talks to the web system through a modified Sheet/extension mechanism over a URL-based approach.",
    role: "Team project",
    contribution: "Developed the automatic laboratory door locking system.",
    result:
      "A working project prototype that demonstrated the intended smart laboratory workflow, though it was not ultimately deployed to the school laboratory — the team ran out of time during testing with the department head.",
    technologies: ["ESP32", "Laravel", "MySQL", "RFID"],
    status: "complete-not-deployed",
    team: true,
    featured: true,
    architecture: ["RFID", "ESP32", "URL", "Laravel", "MySQL"],
    links: {
      live: "http://103.148.112.91:8177/smart-lab/admin",
    },
  },
  {
    id: "automatic-gate",
    title: "Automatic Gate",
    category: "Embedded / Automation",
    summary:
      "An Arduino-based automatic gate prototype that opens when an object is detected within roughly 30 cm.",
    role: "Solo project",
    technologies: ["Arduino", "Ultrasonic Sensor", "Servo Motor"],
    status: "prototype",
    architecture: ["Distance Detection", "Arduino", "Servo"],
  },
];

/**
 * Real areas of experience that don't have a verified, detailed
 * project write-up yet. Shown as a plain list — not turned into
 * invented project cards.
 */
export const upcomingProjectAreas: UpcomingProjectArea[] = [
  { label: "Website Development" },
  { label: "Linux Server" },
  { label: "MikroTik / Networking" },
  { label: "Arduino / ESP32" },
  { label: "CCTV" },
  { label: "School Network Projects" },
  { label: "PC Building" },
  { label: "Windows Installation" },
  { label: "Computer Troubleshooting" },
];
