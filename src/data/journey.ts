import type { JourneyMilestone } from "@/types";

/**
 * The ascent, plotted as elevation (-100 = minus, 100 = peak — though
 * per the brief, the site must never claim the peak is reached; the
 * highest value used below is 80).
 *
 * This is the verified personal story from the Phase 03 brief:
 * an IPA/science background, missing the intended school, landing in
 * TJKT without initial interest, a leadership moment in Grade 11, a
 * gradual shift in interest helped by "Filosofi Teras" and using AI
 * as a reflection tool (not the cause of the growth itself), a class
 * ranking result, and leaving the comfort zone in Grade 12 through
 * competitions and technical projects — including a national-level
 * MikroTik networking olympiad. No exact dates, competition
 * placements, certificates, or job/internship history are invented;
 * only "Grade 10 / 11 / 12 / Current" period labels are used, per the
 * brief. Gill has not completed an internship/PKL — this file must
 * not imply otherwise.
 */
export const journey: JourneyMilestone[] = [
  {
    id: "origin",
    stage: "origin",
    period: "Grade 10",
    title: "Starting in science, not technology",
    description:
      "Came from an IPA (science) track and didn't get into the school originally intended. Landed in Computer, Network & Telecommunication Engineering (TJKT) instead — not by first choice, and without much interest in it yet. Being honest about that in an interview meant not joining the industrial class either.",
    elevation: -100,
    tags: ["Science background", "Unplanned direction"],
  },
  {
    id: "adaptation",
    stage: "adaptation",
    period: "Grade 10",
    title: "Adapting without yet being interested",
    description:
      "Mostly followed the flow while still figuring out what direction made sense. Focused on adapting and improving regardless — and finished 1st in class despite the lack of interest in the major itself. Meeting others with similar experiences also eased some of the frustration that had been part of the motivation early on.",
    elevation: -55,
    tags: ["Self-improvement", "1st in class"],
  },
  {
    id: "leadership",
    stage: "leadership",
    period: "Grade 11",
    title: "Stepping up when it mattered",
    description:
      "An extracurricular demonstration was going badly. Rather than stay in the background — the usual preference — stepping in to coordinate turned the result around and drew more students into the activity. It was one of the first clear signs of a leadership instinct, even while still preferring to work quietly behind the scenes most of the time.",
    elevation: -20,
    tags: ["Leadership", "Extracurricular"],
  },
  {
    id: "discovery",
    stage: "discovery",
    period: "Grade 11",
    title: "Interest starts to take hold",
    description:
      "In the second semester, technology and TJKT started to genuinely click — helped along by friends worth collaborating with. Reading \u201cFilosofi Teras\u201d and using AI as a tool for reflection opened up an active search for direction and identity, rather than just continuing to follow the flow.",
    elevation: 10,
    tags: ["Self-reflection", "Filosofi Teras", "AI as a tool"],
  },
  {
    id: "achievement",
    stage: "achievement",
    period: "Grade 11",
    title: "The results start to show",
    description:
      "That shift in interest and effort showed up in the numbers: 1st place in the TJKT cohort, 2nd place overall.",
    elevation: 35,
    tags: ["Academic result"],
    metric: "1st in TJKT cohort · 2nd overall",
  },
  {
    id: "breaking-comfort-zone",
    stage: "breaking-comfort-zone",
    period: "Grade 12",
    title: "Leaving the comfort zone",
    description:
      "Grade 12 became the start of actually stepping out — competitions, school projects, technical experimentation, and networking-focused work, including a national-level MikroTik networking olympiad. Less staying comfortable, more building and testing what's actually possible.",
    elevation: 60,
    tags: ["Competitions", "MikroTik", "Networking", "Projects"],
  },
  {
    id: "current",
    stage: "current",
    period: "Grade 12 · Current",
    title: "Still climbing",
    description:
      "The technical journey is ongoing — still competing, still building, still learning across web development, Linux, networking, and AI. Not a peak reached, just a clearer direction and the discipline to keep moving toward it.",
    elevation: 80,
    tags: ["Continuous learning"],
  },
];
