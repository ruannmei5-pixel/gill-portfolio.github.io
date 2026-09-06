import type { EducationEntry, EducationStory, PklOpportunity } from "@/types";

/**
 * Phase 06: the TJKT entry is now real (institution, major, and study
 * period were verified). The prior IPA/science entry is left as-is —
 * its institution name was never verified, so it stays a placeholder
 * rather than inventing one. Gill is still a current student: nothing
 * here or elsewhere should describe him as graduated.
 */
export const education: EducationEntry[] = [
  {
    id: "tjkt",
    institution: "SMKN 2 Baleendah",
    program: "Teknik Jaringan Komputer dan Telekomunikasi",
    shortName: "TJKT",
    period: "2025 — 2027",
    description:
      "Computer, Network & Telecommunication Engineering. Entered after not getting into the originally intended school; direction and interest developed over time.",
    current: true,
    direction: "Technology",
  },
  {
    id: "prior",
    institution: "TODO: school name",
    program: "Science (IPA) track",
    period: "20XX — 20XX",
    description: "Academic background before TJKT, focused on the sciences rather than technology.",
  },
];

/**
 * Short contextual bridge to the Journey section — deliberately not a
 * retelling of it. See `src/data/journey.ts` for the full story this
 * summarizes.
 */
export const educationStory: EducationStory = {
  story:
    "The path into TJKT started from an IPA/science background, not a technology one — and it wasn't the original plan or an immediate interest. Over time, hands-on exposure to networking, Linux, web development, and AI turned it into a real direction. The full story is in the Journey section above — this is just where that direction is currently being studied.",
};

/**
 * Gill has not completed a PKL (internship). The only real status is
 * an unconfirmed upcoming interview — never presented as completed,
 * accepted, or worked experience.
 */
export const pklOpportunity: PklOpportunity = {
  label: "PKL Opportunity",
  organization: "Hotel Sunshine Soreang Bandung",
  status: "upcoming-interview",
  description:
    "An upcoming interview for a PKL (internship) placement. Not yet confirmed, accepted, or started.",
};
