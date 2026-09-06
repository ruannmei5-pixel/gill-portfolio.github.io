import type { NavItem } from "@/types";

export const navItems: NavItem[] = [
  { label: "About", href: "#about" },
  { label: "Journey", href: "#journey" },
  { label: "Education", href: "#education" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Experience", href: "#experience" },
  { label: "Achievements", href: "#achievements" },
  { label: "Contact", href: "#contact" },
];

// Kept separate from navItems: this one links to a future route rather
// than an in-page anchor, and gets a distinct visual treatment in <Nav>.
export const aiNavItem: NavItem = { label: "AI", href: "/ai" };
