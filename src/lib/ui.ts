/**
 * The hover elevation/glow treatment used across interactive cards
 * (Terminal window, Avatar frame, Skill cards, Project cards). Kept in
 * one place so it's edited once rather than re-typed per component.
 * Always additive/hover-scoped so it never races with a base class of
 * the same specificity set elsewhere (e.g. Card.astro's base border
 * color) — see the note in SkillCard.astro.
 */
export const hoverCardGlow =
  "transition-[border-color,box-shadow,transform] duration-250 " +
  "motion-safe:hover:-translate-y-0.5 hover:border-signal-dim " +
  "hover:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_12px_32px_-16px_rgba(0,0,0,0.6),0_0_32px_-8px_var(--color-signal-glow)]";

/** Small hover treatment for individual technology tags. */
export const hoverTechTag =
  "transition-[color,border-color,transform] duration-250 motion-safe:hover:-translate-y-px " +
  "hover:border hover:border-signal-dim hover:text-signal-bright";
