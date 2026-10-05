import type { Profile } from "@/types";

/**
 * Local placeholder for what will eventually come from
 * `GET /api/profile` on the Laravel backend. Keep this the single
 * import site for "who is this site about" so swapping to a fetch
 * call later only touches this file.
 */
export const profile: Profile = {
  fullName: "Ragil Vahlevi",
  nickname: "Gill",
  role: "Computer, Network & Telecommunication Engineering Student",
  status: "TJKT Student",
  location: "Indonesia", // TODO: replace with city/region if you want it public
  tagline: "From minus to peak.",
  philosophy: [
    "I didn't choose where I started.",
    "I choose how far I go.",
  ],
  focusAreas: ["Web Development", "Linux", "Networking", "AI"],
  avatarPlaceholder: "/images/avatar.jpg",
  socials: [
    // TODO: fill in real profiles before launch
    { label: "GitHub", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "Email", href: "mailto:hello@example.com" },
  ],
  contact: {
    // TODO: replace these placeholders with real contact details
    email: "ragilvahlevi030@gmail.com",
    github: "https://github.com/ruannmei5-pixel",
    linkedin: "",
    instagram: "https://www.instagram.com/ragil_v2307?stkn=MWNnZ3pvYTRuMWNvcw==",
  },
};
