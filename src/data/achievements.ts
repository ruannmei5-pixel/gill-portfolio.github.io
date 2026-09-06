import type { Achievement } from "@/types";

/**
 * Phase 11 — restructured per an explicit request to make Achievements
 * reflect the TJKT/Networking-Linux-Web-AI identity rather than a
 * generic academic-ranking list.
 *
 * REMOVED from display (not just de-emphasized): the "1st Place / TJKT
 * Cohort" and "2nd Place / Overall" academic-ranking entries that were
 * the featured/high-tier achievements through Phase 06–10. Both were
 * real and verified, but the request was explicit: do not show either
 * as a main achievement anymore. They are not referenced anywhere in
 * this file. (They are NOT deleted from `src/data/journey.ts` — that
 * file's own `metric` field on the "achievement" milestone is Journey
 * content, out of scope for this change per the brief's explicit
 * "do not touch Journey" instruction.)
 *
 * New priority order (also the literal render order — see
 * `src/components/sections/Achievements.astro`, which groups by
 * `tier`/`featured`, so this order maps directly to visual hierarchy):
 *
 *   1. MikroTik Certificate         — featured, tier "high"  (MOST prominent)
 *   2. MikroTik National Competition — tier "high" (second-most prominent)
 *   3. Network Fundamental Certificate — tier "medium" ("Certifications")
 *   4. MikroTik 2026 Certificate/Participant — tier "medium" ("Certifications")
 *   5. Silver Medal — Pancasila     — tier "supporting" ("Other recognitions")
 *   6. Bronze Medal — Biology       — tier "supporting" ("Other recognitions")
 *
 * Nothing here invents a certificate number, issuing body, exact date,
 * or verification link that wasn't given — see each entry's
 * `certificate` field. Where a real certificate document exists but
 * its image/issuer/date/credential ID/verification link haven't been
 * provided yet, the `certificate.image` path points at the shared
 * placeholder graphic (`/images/certificate-placeholder.svg`) and the
 * other `CertificateDetails` fields are simply left undefined — the
 * card components render an explicit "not yet added" state for those,
 * never a guessed value.
 */
export const achievements: Achievement[] = [
  {
    id: "mikrotik-certificate",
    category: "certification",
    categoryLabel: "Networking",
    title: "MikroTik Certificate",
    subtitle: "Certified",
    description:
      "Certification related to MikroTik networking fundamentals and configuration.",
    tier: "high",
    featured: true,
    certificate: {
      image: "/images/certificate-placeholder.svg",
    },
  },
  {
    id: "mikrotik-olympiad",
    category: "competition",
    categoryLabel: "Networking / Competition",
    title: "MikroTik National Competition",
    subtitle: "National-Level Participation",
    description: "Participated in a national-level MikroTik networking competition.",
    tier: "high",
    period: "Grade 12",
  },
  {
    id: "network-fundamental",
    category: "certification",
    categoryLabel: "Networking",
    title: "Network Fundamental",
    subtitle: "Certified",
    description: "A foundational networking certification.",
    tier: "medium",
    certificate: {
      image: "/images/certificate-placeholder.svg",
    },
  },
  {
    id: "mikrotik-participant-2026",
    category: "certification",
    categoryLabel: "Networking",
    title: "MikroTik",
    subtitle: "Participant 2026",
    description: "Recognized participation credential from the 2026 MikroTik program.",
    tier: "medium",
    certificate: {
      image: "/images/certificate-placeholder.svg",
    },
  },
  {
    id: "medal-pancasila",
    category: "medal",
    categoryLabel: "Academic / Competition",
    title: "Silver Medal",
    subtitle: "Pancasila",
    description: "Silver medal awarded in Pancasila.",
    tier: "supporting",
  },
  {
    id: "medal-biology",
    category: "medal",
    categoryLabel: "Academic / Competition",
    title: "Bronze Medal",
    subtitle: "Biology",
    description: "Bronze medal awarded in Biology.",
    tier: "supporting",
  },
];
