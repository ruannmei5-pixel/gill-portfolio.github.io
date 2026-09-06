import type { ExperienceEntry, ExperienceCategoryMeta } from "@/types";

/**
 * Phase 07 — Technical Experience.
 *
 * Every entry traces back to the verified brief list. Gill has NOT
 * completed a PKL/internship — see `pklOpportunity` in
 * `src/data/education.ts`, which already covers that status. None of
 * this is framed as employment: no company, client, job title, exact
 * date, or years-of-experience figure is present or implied anywhere
 * below. Descriptions stay at the level of "what this kind of work
 * involved," never an invented specific incident.
 */
export const experienceCategories: ExperienceCategoryMeta[] = [
  {
    id: "networking",
    label: "Networking",
    description: "MikroTik configuration, topology, and FTTH — practiced through school coursework and competitions.",
  },
  {
    id: "server",
    label: "Linux & Server",
    description: "Setting up and troubleshooting server environments in a lab setting.",
  },
  {
    id: "hardware",
    label: "Hardware",
    description: "PC assembly, OS installs, and troubleshooting — diagnosis through to a working solution.",
  },
  {
    id: "web",
    label: "Web Development",
    description: "Building the applications that sit on top of the infrastructure below.",
  },
  {
    id: "embedded",
    label: "Embedded",
    description: "Microcontrollers and sensors, connected to the real projects they were built for.",
  },
];

export const experienceEntries: ExperienceEntry[] = [
  // --- Networking (given stronger visual emphasis per the brief) ---
  {
    id: "mikrotik-network-config",
    title: "MikroTik / Network Configuration",
    categoryGroup: "networking",
    categoryLabel: "Networking",
    description:
      "Hands-on configuration of MikroTik devices as part of school networking practice — basic routing, addressing, and device setup.",
    technologies: ["MikroTik", "TCP/IP", "Basic Network Configuration"],
    type: "networking-practice",
    featured: true,
  },
  {
    id: "ftth-topology",
    title: "Real FTTH Topology",
    categoryGroup: "networking",
    categoryLabel: "Networking",
    description:
      "Exploring a real Fiber-to-the-Home topology to understand how network layout and cabling work outside of a purely theoretical diagram.",
    technologies: ["FTTH", "Network Topology"],
    type: "networking-practice",
    featured: true,
  },

  // --- Linux & Server ---
  {
    id: "linux-server",
    title: "Linux Server",
    categoryGroup: "server",
    categoryLabel: "Linux & Server",
    description:
      "Setting up and working day to day in a Linux/Debian environment as a server-practice exercise, including basic configuration and troubleshooting.",
    technologies: ["Linux", "Debian", "Server Configuration"],
    type: "server-practice",
  },
  {
    id: "nginx-apache",
    title: "Nginx / Apache",
    categoryGroup: "server",
    categoryLabel: "Linux & Server",
    description: "Configuring and troubleshooting Nginx and Apache in a lab environment to serve web applications.",
    technologies: ["Nginx", "Apache"],
    type: "server-practice",
  },
  {
    id: "virtualbox",
    title: "VirtualBox",
    categoryGroup: "server",
    categoryLabel: "Linux & Server",
    description: "Using VirtualBox to build and reset lab environments for server and networking practice.",
    technologies: ["VirtualBox"],
    type: "lab-environment",
  },

  // --- Hardware ---
  {
    id: "cctv-installation",
    title: "CCTV Installation",
    categoryGroup: "hardware",
    categoryLabel: "Hardware / Security",
    description: "Hands-on technical work involving CCTV installation and basic setup.",
    technologies: ["CCTV", "Networking", "Cabling"],
    type: "hands-on-practice",
  },
  {
    id: "lab-migration",
    title: "Laboratory Relocation / Lab Migration",
    categoryGroup: "hardware",
    categoryLabel: "Hardware / Facility",
    description: "Assisting with a school laboratory relocation — moving, reconnecting, and reorganizing lab equipment.",
    technologies: ["PC Hardware", "Cabling", "Networking"],
    type: "lab-work",
  },
  {
    id: "pc-assembly",
    title: "PC Assembly",
    categoryGroup: "hardware",
    categoryLabel: "Hardware",
    description: "Assembling desktop PCs from individual components as part of school technical practice.",
    technologies: ["PC Hardware", "Component Assembly"],
    type: "hands-on-practice",
  },
  {
    id: "windows-install",
    title: "Windows Installation / Reinstallation",
    categoryGroup: "hardware",
    categoryLabel: "Hardware",
    description: "Installing and reinstalling Windows on school and personal machines, including basic driver setup.",
    technologies: ["Windows", "OS Installation"],
    type: "hands-on-practice",
  },
  {
    id: "printer-troubleshooting",
    title: "Printer Troubleshooting",
    categoryGroup: "hardware",
    categoryLabel: "Hardware",
    description: "Diagnosing and resolving common printer issues — connectivity, drivers, and hardware faults.",
    technologies: ["Printer Hardware", "Driver Configuration"],
    type: "technical-practice",
  },
  {
    id: "computer-troubleshooting",
    title: "Computer Troubleshooting",
    categoryGroup: "hardware",
    categoryLabel: "Hardware",
    description: "General diagnosis and repair of computer hardware and software issues, from boot failures to software conflicts.",
    technologies: ["PC Hardware", "Diagnostics"],
    type: "technical-practice",
  },

  // --- Web Development (connects to Projects — see relatedProjectIds) ---
  {
    id: "website-development",
    title: "Website Development",
    categoryGroup: "web",
    categoryLabel: "Web Development",
    description:
      "Building web applications and interfaces — one part of the broader technical experience, applied directly in real projects below.",
    technologies: ["Laravel", "Filament", "Astro", "MySQL", "Nginx", "Apache"],
    type: "technical-practice",
    relatedProjectIds: ["smart-lab"],
  },

  // --- Embedded (connects to Projects — see relatedProjectIds) ---
  {
    id: "arduino-esp32",
    title: "Arduino / ESP32 Projects",
    categoryGroup: "embedded",
    categoryLabel: "Embedded",
    description:
      "Working with microcontrollers and sensors through school hardware projects — the same hands-on work behind the projects below.",
    technologies: ["Arduino", "ESP32", "Ultrasonic Sensor", "Servo", "RFID"],
    type: "personal-experiment",
    relatedProjectIds: ["smart-lab", "automatic-gate"],
  },
];

/**
 * A structural representation of how these entries were approached —
 * not a claimed formal methodology, just how the section is framed.
 */
export const experienceApproachFlow: string[] = [
  "Input",
  "Diagnose",
  "Configure",
  "Test",
  "Troubleshoot",
  "Improve",
];

/**
 * The networking relationship called out in the brief. Wording stays
 * exploratory ("practice", not "engineering") — see the entries above.
 */
export const networkingFlow: string[] = ["Networking", "MikroTik", "Topology", "FTTH", "Troubleshooting"];
