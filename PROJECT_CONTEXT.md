# Project Context — Gill Portfolio

This file tracks what has actually been built, what decisions were
made and why, and what constraints still apply — so future work (by
Claude or anyone else) doesn't accidentally re-litigate or violate
earlier decisions.

## Status: Phase 12 — complete

Phase 12 corresponds to **PROMPT 15** ("BUILD GILL AI ASSISTANT").
Scope was narrow and explicit, same discipline as every phase before
it: deepen the existing Gill AI feature (personality, multilingual
replies, natural follow-ups, a visible "thinking" state, a
streaming-style reveal, input ergonomics) **without** touching any
other section, without adding a backend, and without inventing an AI
provider credential. Diffed the full tree against the Phase 11
archive to confirm only five files changed:
`src/data/aiKnowledge.ts`, `src/lib/aiEngine.ts`,
`src/components/ai/AiAssistant.astro`, `src/types/index.ts`, and one
new file, `src/lib/lang.ts`. Hero, Navigation, Journey, Skills,
Projects, Achievements, Education, Contact, and every `src/data/*.ts`
file other than `aiKnowledge.ts` are byte-for-byte unchanged.

**1. Personality / natural conversation.** `src/lib/aiEngine.ts`'s
keyword matcher was widened well beyond the Phase 09 English-only
list: every intent (skills, projects, journey, education, contact,
achievements, networking, employer/PKL fallbacks, off-topic) now also
matches common Indonesian phrasing and casual/slang register —
`"bisa apa aja"`, `"jago"`, `"pernah bikin"`, `"kerja dimana"`,
`"si Gill"`, `"gimana"`, etc. — alongside the existing English
phrases, per the brief's exact example list in section 1. This is
still a plain `includes()`-based matcher, not a generative model — no
new dependency, no LLM call — so it can miss genuinely novel phrasing,
but the specific examples in the brief's TEST CASES section (section
20) were run by hand and all matched (see Verification below).

**2. Multilingual.** New `src/lib/lang.ts` — `detectLanguage(input,
previous?)` — a small, dependency-free heuristic that scores an
input against two disjoint marker-word lists (strong
Indonesian-only markers vs. strong English-only markers) and returns
whichever language has more hits; a tie falls back to whatever
language the conversation was already in (or English on the very
first turn). This is deliberately not a translation library or an
external API call — per the existing "keep the site lightweight, no
big AI frontend libraries" constraint (brief section 16 / the
project's existing tech-stack rule). `src/data/aiKnowledge.ts` was
rewritten so **every** answer function now takes an optional
`lang: Lang` parameter (`"en" | "id"`, default `"en"`) and returns the
matching-language sentence — built from the exact same imported data
either way, so the two languages can never say different things about
Gill; this is a phrasing choice, not a second knowledge source.
`aiEngine.ts` calls `detectLanguage` on every turn and threads the
result through to whichever `aiKnowledge.ts` function it calls, and
back out on `AiAnswer.lang`. A mixed-language message is not forced
into one language "by policy" — it's simply scored like anything
else, so it naturally leans whichever language has the stronger
signal, matching the brief's "boleh menggunakan campuran secara
natural" instruction.

**3. Knowledge source — unchanged in structure.** `aiKnowledge.ts`
still imports the same `src/data/*.ts` files (`profile`, `journey`,
`skillCategories`, `projects`, `experienceEntries`, `education`,
`achievements`) established in Phase 09 — no new/duplicated personal
database was created, per the brief's explicit "jangan membuat
database personal baru" instruction. Every fact named in the brief's
KNOWLEDGE SOURCE list (Ragil Vahlevi / Gill / TJKT / SMKN 2 Baleendah
/ Web Development / Linux / Networking / AI / MikroTik / Smart-Lab /
Automatic Gate / achievements / education / technical experience) was
already backed by real data as of Phase 09–11; Phase 12 only changed
how those facts are phrased (EN/ID), never what they say.

**4. Anti-hallucination — unchanged in mechanism, extended in
coverage.** The same structural guardrails from Phase 09 (hard-coded
`getEmployerFallback`/`getPklFallback` responses, never a keyword
match that could miss and fall through to a guess) are preserved
exactly, now bilingual and matching more phrasings of the same
question (`"kerja di"`, `"kerja dimana"`, `"perusahaan apa"`,
`"magang"`, etc., alongside the existing English list). No new
fact-generation path was added anywhere — `aiEngine.ts` still only
ever calls a fixed set of `aiKnowledge.ts` functions that read
existing data; there is still no free-text/LLM generation step in
this codebase for a fact to be invented in.

**5. Natural conversation / context.** The existing ordinal
("first"/"second") and pronoun ("it", "that one") follow-up
resolution from Phase 09 was extended to also recognize Indonesian
equivalents (`"pertama"`, `"kedua"`, `"itu apa"`). One new resolved
case, directly from the brief's own example: after a skills/
networking answer, `"terus projectnya apa?"` (or any input containing
`"projectnya"`/`"projeknya"` while `context.lastTopic === "skills"`)
now routes to the projects overview instead of repeating the skills
answer or falling through to the generic "I'm not sure I caught that"
fallback.

**6. Thinking state + 7. "Streaming" response.** This project has no
real AI provider/network call to stream from (see architecture note
below and Phase 09's), so nothing here is a real server-sent-event
stream — it's an honest, clearly-labeled client-side presentation
layer over an already-fully-computed local answer, not a fake
network delay. `AiAssistant.astro`'s status line now reads "Gill AI
is thinking" / "Gill AI sedang berpikir" (bilingual, following the
conversation's current language) with three small pulsing dots
(`motion-safe:animate-pulse`, staggered `animation-delay`) instead of
the old static "Generating response…" line. Once the local answer is
ready, `appendMessage(..., animate=true)` reveals it word-by-word on a
14ms interval with a small blinking `▍` caret at the writing edge —
fast enough (a typical answer finishes in well under a second) that
it reads as responsiveness, not an artificial wait, and it is skipped
entirely (the full text appears at once) when
`prefers-reduced-motion: reduce` is set, checked once via
`window.matchMedia` at component init.

**8. Animation.** Message rows reuse the existing
`motion-safe:animate-fade-up` keyframe (already defined in
`tailwind.config.mjs`, previously only used by `AchievementCard.astro`
— no new keyframe, no new dependency) for a subtle entrance. The
thinking-dot pulse and reveal caret both use the existing
`animate-pulse` utility. Every animation here is gated by Tailwind's
`motion-safe:` variant (which itself resolves against
`prefers-reduced-motion: no-preference`) and/or the explicit
`prefersReducedMotion` check in the component script before the
word-reveal loop even starts — so a visitor with reduced motion
enabled gets zero animation from this feature, matching both the
brief's #8 and the project's pre-existing global
`prefers-reduced-motion` rule in `global.css` (untouched this phase).

**9. Chat UI.** Still the existing `TerminalWindow` shell (dark,
purple-accented, minimal) — no new visual language was introduced.
Additions: a small header line above the log stating the assistant
follows whichever language the visitor uses; a **Clear** button that
resets the log back to just the seeded greeting and resets the
in-memory `context` object (no new persistence — same "component
memory only" model as before); and an inline **Retry** button
rendered under the (currently just defensive/never-actually-thrown)
error fallback message, which re-submits the exact question that
failed. Loading state (input/send disabled + the thinking indicator)
and the honest, non-technical error message from Phase 09 are both
kept as-is in mechanism, only re-worded to be bilingual.

**10. API security — unchanged, still true.** No API key of any kind
exists anywhere in this codebase — grepped `src/` for `API_KEY`,
`OPENAI`, `ANTHROPIC`, `GEMINI`, `PUBLIC_`, and `VITE_` before and
after this phase: no matches outside this file's own documentation of
what not to do. There is still no AI provider connected — see
"Connecting a real AI provider later" in the Phase 09 section below,
unchanged and still accurate; nothing in Phase 12 required updating
that plan, since no backend/provider work was done here either.

**11. Astro architecture.** No new dependency, no framework change.
The one new file, `src/lib/lang.ts`, is plain, dependency-free
TypeScript, following the same pattern as the rest of `src/lib/`.
`astro.config.mjs` was not touched — still `output: "static"`, no
adapter, matching the brief's #11 instruction not to change project
architecture.

**14. Input handling.** `AiAssistant.astro`'s single-line `<input>`
was replaced with an auto-resizing `<textarea>` (capped at ~120px, via
a small `autoResize()` helper on the `input` event) so multi-line
questions are actually possible. `Enter` submits the form (handled
explicitly in a `keydown` listener, since a `<textarea>` does not
submit on Enter by default); `Shift+Enter` is left to the browser's
default behavior, which inserts a newline. Empty/whitespace-only
input is still rejected (`trimmed` check, unchanged from Phase 09),
and input is still disabled while a request is "in flight"
(`setBusy`, unchanged mechanism).

**15/16. Responsive / performance.** No new large dependency was
added (the word-reveal loop is ~15 lines of vanilla `setTimeout`
chaining, not a library). The textarea's `min-w-0 flex-1` layout and
capped auto-grow height were specifically chosen so a long or
multi-line question can't overflow the widget horizontally or grow it
unboundedly vertically on narrow viewports — same reasoning
`InteractiveTerminal.astro`'s input row already documented in Phase
08. No animation loop runs continuously; the word-reveal timer stops
itself once the message is fully written, and the thinking-dot pulse
only runs while `#ai-status` is visible (toggled by `setBusy`).

### Verification (as of Phase 12)

Same sandbox limitation as most prior phases: no npm registry access,
so `npm run build` could not be run. Instead:

- Diffed the entire project tree against the Phase 11 archive
  (`diff -rq`) — confirmed only the five files listed above changed,
  nothing else.
- Real `tsc` run (standalone tsconfig reproducing the project's path
  aliases) against every file in `src/data/`, `src/lib/`, and
  `src/types/` — **0 errors**.
- The client `<script>` block extracted from the rewritten
  `AiAssistant.astro` and type-checked in isolation with `DOM` lib
  enabled and the same path aliases — **0 errors**.
- Brace/paren/bracket balance checked by script on every file touched
  this phase — all balanced.
- `detectLanguage`/the full bilingual `answerQuestion` pipeline was
  read through by hand against every one of PROMPT 15's TEST CASES
  (section 20) and the section-1 example phrases — each one resolves
  to the correct intent and the correct language (Indonesian in for
  Indonesian in, English in for English in), including the
  section-5 "Gill bisa networking?" → "terus projectnya apa?" two-turn
  example.
- Grepped `src/` for `API_KEY`, `OPENAI`, `ANTHROPIC`, `GEMINI`,
  `PUBLIC_`, `VITE_` — no matches outside comments describing what not
  to do; confirmed no `.env` file or secret was introduced.
- Confirmed by inspection that the only DOM-writing calls added in
  this phase (`appendMessage`'s word-reveal path, `appendErrorWithRetry`,
  the Clear handler) still use only `textContent`/`createTextNode`/
  `createElement`/`classList` — no `innerHTML` with dynamic content, no
  `eval`, no `new Function`.

**Not done, same as every prior phase:** no real browser/keyboard
interaction test and no manual mobile-viewport check (no headless
browser available in this environment). Before treating Phase 12 as
done for real, please run `npm install` (with registry access) and
`npm run build` / `npm run dev`, then specifically: type a few
Indonesian and English questions from PROMPT 15's TEST CASES and
confirm the reply language and the word-reveal animation both look
right; confirm `Shift+Enter` inserts a newline while plain `Enter`
sends; confirm `prefers-reduced-motion` (via devtools emulation)
removes the thinking-dot pulse and the word-reveal entirely; and
confirm the **Clear** button resets the conversation back to the
seeded greeting without a page reload.

### What's still needed to connect a real AI provider

Unchanged from Phase 09's plan (this phase did not attempt it, per the
brief's own explicit instruction not to invent credentials or claim a
provider is connected when one isn't): a server adapter + `output:
"server"`/`"hybrid"`, a real `src/pages/api/ai.ts` endpoint holding a
server-only (never `PUBLIC_`-prefixed) API key, and a one-line swap of
`answerQuestion`'s body in `src/lib/aiEngine.ts` for a `fetch("/api/ai",
...)` call — its exported signature already returns a `Promise<AiAnswer>`
today specifically so that swap doesn't require touching
`AiAssistant.astro` at all. See "Connecting a real AI provider later"
under the Phase 09 section below for the full six-step plan, which
still applies unchanged.

## Status: Phase 11 — complete

Phase 11 scope was narrow and explicit: restructure the Achievements
("Milestones") section only — nothing else. No other section, page,
or data file was touched (verified by diffing the full tree against
the Phase 10 archive: only `src/types/index.ts`,
`src/data/achievements.ts`, `src/components/cards/AchievementCard.astro`,
`src/components/cards/FeaturedAchievementCard.astro`, and one new
asset, `public/images/certificate-placeholder.svg`, changed).

**Removed from display (not just de-emphasized), per explicit
request:** the "1st Place / TJKT Cohort" and "2nd Place / Overall"
academic-ranking achievements. Both are real/verified, but they are no
longer rendered anywhere in the Achievements section. They are **not**
deleted from `src/data/journey.ts` — that file's own `metric` field on
the Grade-11 milestone still references the same result — because the
brief was explicit that Journey is out of scope for this change.

**New priority order** (`src/data/achievements.ts`, which drives the
literal render order in `Achievements.astro` via `tier`/`featured`):

1. **MikroTik Certificate** — `featured: true`, tier `"high"` — now
   the single most visually prominent achievement (the large hero
   treatment in `FeaturedAchievementCard.astro`), replacing the old
   academic-ranking entry there.
2. MikroTik National Competition (national-level participation,
   participation only — no placement claimed) — tier `"high"`.
3. Network Fundamental — tier `"medium"` ("Certifications").
4. MikroTik Participant 2026 — tier `"medium"` ("Certifications").
5. Silver Medal, Pancasila — tier `"supporting"` ("Other recognitions").
6. Bronze Medal, Biology — tier `"supporting"` ("Other recognitions").

**New `CertificateDetails` structure** (`src/types/index.ts`) — an
optional `certificate?: CertificateDetails` field on `Achievement`,
with `image?`/`issuer?`/`issuedDate?`/`credentialId?`/
`verificationUrl?`, all optional so real values can be dropped in
later without a data-shape change. Assigned only to the three actual
certificates (MikroTik Certificate, Network Fundamental, MikroTik
2026); the competition entry and the two medals don't carry one.
Every `certificate.image` currently points at the new
`/images/certificate-placeholder.svg` (styled consistently with the
existing avatar/OG placeholders — dashed border, faint contour lines,
a small purple seal mark, "CERTIFICATE — placeholder — awaiting scan"
mono label); `issuer`/`issuedDate`/`credentialId`/`verificationUrl`
are left `undefined` — nothing invented — and both card components
render an explicit "Not yet added" for any missing field rather than
guessing or leaving a blank.

**`AchievementCard.astro` and `FeaturedAchievementCard.astro`** both
gained a certificate panel (image + `issuer`/`issued`/`credential
ID`/`verification` readout, rendered only when `achievement.certificate`
is present) — a small compact version on the grid cards, a larger
image + full four-field `dl` on the featured card. Kept restrained and
technical (dark surface, thin border, mono labels) per the brief's
explicit "clean/technical/professional, not an ad" instruction — no
glow, no oversized imagery, no marketing language.

`Achievements.astro` itself needed **no changes** — its grouping logic
already reads purely from `tier`/`featured` on the data, so the new
priority order and the removed entries flow through automatically.

### Verification (as of Phase 11)

Same sandbox limitation as most prior phases: no npm registry access,
so `npm run build` could not be run. Instead:

- Real `tsc` run against every file in `src/types/`, `src/data/`, and
  `src/lib/` with a standalone tsconfig reproducing the project's path
  aliases — **0 errors**.
- Brace/paren/bracket balance checked by script on every file touched
  this phase — all balanced.
- Grepped the whole `src/` tree for the removed IDs (`tjkt-1st`,
  `overall-2nd`) — zero remaining references anywhere.
- Diffed the entire project tree against the Phase 10 archive to
  confirm only the five files listed above changed — Hero, Navigation,
  Contact, Projects, Gill AI (`aiKnowledge.ts`/`aiEngine.ts`/
  `AiAssistant.astro`), the Terminal, Journey, and Skills are
  byte-for-byte unchanged.
- Confirmed no invented certificate numbers, issuers, dates, or
  verification links exist anywhere in `achievements.ts` — every
  `CertificateDetails` field left unverified is `undefined`, not a
  placeholder string pretending to be real data.

**Not done:** no real browser/viewport check (same limitation as every
prior phase). Before treating Phase 11 as done for real, please run
`npm install` (with registry access) and `npm run build` / `npm run
dev`, then check the Achievements section renders the MikroTik
Certificate as the clear visual lead, the "Not yet added" fields read
clearly (not like broken data), and the certificate placeholder image
displays correctly at both the small (grid card) and large (featured
card) sizes.

## Status: Phase 10 — complete

Phase 10 scope was: visual polish, UX consistency, responsiveness, and
fixing existing UI issues only — no new features, no rewrite. This
phase started by inspecting the entire existing project and design
system before touching anything (colors, type scale, spacing,
container widths, cards, buttons, nav, every section, the terminal,
Gill AI, Contact, footer, SEO/meta) against the Phase 10 brief's
27-point checklist. The great majority of that checklist was already
satisfied by Phases 01–09 (dark purple instrumentation identity,
consistent `container-content`/`Card`/`Button`/`Badge`/`TechTag`
components, honest non-percentage skills, team-vs-solo project
framing, "CURRENTLY STUDYING" education status, `profile.contact` —
not `profile.socials` — already wired into `Contact.astro`, working
responsive grids, `prefers-reduced-motion` handled globally). Genuine
issues found and fixed:

- **`src/styles/global.css`** — `--color-ink-faint` lightened from
  `#5b626d` to `#78808c`. The old value measured ~3.2:1 contrast
  against `--color-void`, below WCAG AA's 4.5:1 for the small mono
  labels/hints/timestamps/section-index numbers this token is used
  for everywhere on the site. The new value clears 4.5:1 against both
  `--color-void` and `--color-surface` while staying clearly the
  dimmest of the three ink tones (still well under `--color-ink-muted`
  at ~7.6:1) — this is a value-only change, no component or token name
  changed, so nothing needed updating elsewhere.
- **`src/components/layout/Footer.astro` rewritten.** Two real bugs
  fixed: (1) it rendered `profile.socials`' Phase 01 TODO placeholders
  (`href="#"` and a fake `mailto:hello@example.com`) verbatim — a
  visible link that just jumps to the top of the page, and a fake
  email address, both of which are exactly what a recruiter clicking
  around would notice first. It now filters through the same
  "is this a real link or a placeholder" check `terminal.ts`/
  `aiKnowledge.ts` already established (`isRealSocial`, kept as a
  small local copy for the same reason those two document — avoiding
  coupling the footer to either data module for one predicate) and
  simply shows no social links until real ones are added, rather than
  broken ones. (2) Per the brief's #18, the footer now shows
  `profile.fullName` and `profile.nickname` together plus the actual
  `profile.tagline` ("From minus to peak.") instead of only the
  nickname and a paraphrased line — no invented copyright/company
  text was added.
- **`src/components/sections/Experience.astro` and
  `src/components/navigation/Nav.astro`** — accessibility fix per the
  brief's #20 ("do not rely only on purple color to communicate
  state"). The Experience category filter's active state previously
  changed only border/text color; it now also gets `font-semibold`
  (a non-color visual cue) and real `aria-pressed` state (toggled in
  the existing click handler alongside the existing `data-active`
  attribute — same script, two attributes). The mobile nav menu's
  active-link state had the same issue (desktop nav already had a
  non-color cue — the animating underline — but the mobile menu list
  did not); it now also gets a left accent border
  (`border-l-2 border-signal` when active) so the active item isn't
  signaled by color alone there either.
- **No other files were changed.** Every other section, card, data
  file, and script was reviewed against the checklist and left
  untouched — see "Verification (as of Phase 10)" below for what was
  specifically checked and found already correct.

### Verification (as of Phase 10)

Same sandbox limitation as most prior phases: **no npm registry
access** this session either (`npm install` fails with the same
`403 Forbidden`), so `node_modules` isn't present and the real
`npm run build` (`astro check && astro build`) could not be run.

What was run instead, same approach as Phases 04/07/08/09:

- The real TypeScript compiler (`tsc`, on `PATH`) against every file
  under `src/data/`, `src/lib/`, and `src/types/`, using a standalone
  tsconfig reproducing the project's real path aliases
  (`@/*`, `@components/*`, `@layouts/*`, `@data/*`, `@types/*`,
  `@styles/*`) — **0 errors**.
- The client-side `<script>` blocks were extracted from `Nav.astro`,
  `ProgressRail.astro`, `InteractiveTerminal.astro`,
  `AiAssistant.astro`, and the (this-phase-edited) `Experience.astro`
  and type-checked in isolation with `DOM` lib enabled and the same
  path aliases — **0 errors** across all five, including the new
  `aria-pressed` line added to `Experience.astro`'s handler.
- Brace/paren/bracket balance was checked by script on every file
  touched this phase (`Footer.astro`, `Nav.astro`, `Experience.astro`,
  `global.css`) — all balanced.
- Contrast ratios for every ink/signal token against both
  `--color-void` and `--color-surface` were computed directly (WCAG
  relative-luminance formula) before and after the `--color-ink-faint`
  change, confirming the fix actually clears 4.5:1 on both surfaces
  without needing to touch `--color-ink`/`--color-ink-muted`/any
  signal token (all already well above 4.5:1).
- Grepped the whole `src/` tree for hardcoded hex colors outside
  `global.css` and the static placeholder SVGs — none found (same
  result as Phase 02 first established and every phase since has
  preserved).
- Re-read `Contact.astro` to confirm it already uses `profile.contact`
  (not `profile.socials`) per the brief's #17/#25 — it does, unchanged
  since Phase 09; the only `profile.socials` consumers left are
  `Footer.astro` (this phase, now filtered), `aiKnowledge.ts`, and
  `terminal.ts` (both pre-existing, both already filtered) — all
  three uses are intentional, not a leftover to clean up.
- Read every section component, every card component, every UI
  primitive (`Button`, `Card`, `Badge`, `TechTag`, `StatusIndicator`,
  `SectionHeader`, `EmptyState`), `Container`/`SectionShell`,
  `BaseLayout` (SEO/meta/OG/favicon), `astro.config.mjs`, and
  `tailwind.config.mjs` end-to-end against the Phase 10 checklist by
  hand — confirmed consistent container widths (`container-content`
  everywhere), consistent card language (`Card.astro`'s
  `border-border-subtle`/`bg-surface`/`shadow-panel` base, never
  fought with a same-specificity override — the specificity pitfall
  `SkillCard.astro` documents is still avoided everywhere it applies),
  one consistent button system (no second button style introduced
  anywhere), working mobile nav (opens, closes on link click, closes
  on outside toggle, keyboard-operable, focus never suppressed), and
  no remaining "coming soon" placeholder copy anywhere in Gill AI or
  the terminal.

**Not done:** no real browser/viewport screenshot pass and no manual
mobile-device testing (no headless browser available in this
environment, same limitation as every prior phase). Before treating
Phase 10 as done for real, please run `npm install` (with registry
access) and `npm run build` / `npm run dev`, then specifically:
eyeball the footer at a narrow width (it now stacks two lines of text
above the social links instead of one line), tab through the
Experience category filter to confirm the bold-weight + `aria-pressed`
change reads clearly with a screen reader, and open the mobile nav
menu to confirm the new left accent border renders correctly against
the existing hover background.

## Status: Phase 09 — complete

Prompt 01 scope was: establish the Astro project, design system,
reusable components, page architecture, local data structures, initial
visual foundation, hero structure, and responsive/performant baseline.

Phase 02 scope was: visual identity refresh (accent color) + Hero
refinement (identity, story, avatar, elevation metaphor, terminal
polish, navigation polish).

Phase 03 scope was: the Personal Journey ("From minus to peak")
section — a real timeline built from the verified personal story,
with an elevation-based visual treatment consistent with the Phase 02
purple identity.

Phase 04 scope was: the Technical Profile ("Skills") section — real
categories/technologies (still empty in Phase 03), an honest
qualitative status per category instead of fake proficiency, and a
small technical-dashboard feel consistent with the existing
instrumentation visual language.

All four are complete as of this archive.

Phase 05 scope was: the Projects ("Selected Work") section — the
first two verified, real projects (Smart-Lab, Automatic Gate), with an
explicit "my contribution" callout so team-project ambiguity never
happens, and a placeholder structure for future project areas that
exist in real experience but don't have a written-up entry yet.

Phase 06 scope was: the Education ("Where I'm Learning") and
Achievements ("Milestones") sections — real institution/program/period
for the current TJKT program, a short contextual bridge back to the
Journey section, the PKL status framed strictly as an unconfirmed
upcoming opportunity, and the verified competition results,
certifications, and medals, with technical achievements given more
visual weight than the medals per the brief's recruiter-focused
priority.

All six are complete as of this archive.

Phase 07 scope was: the Technical Experience ("Beyond the classroom")
section — real hands-on technical exposure (networking, Linux/server,
hardware, web, and embedded work) presented explicitly as practice,
school work, and lab work, never as formal employment. Gill has not
completed a PKL/internship; this phase does not touch or duplicate
that status (see the existing `pklOpportunity` panel in the Education
section — it stays the only PKL-related content on the site).

All seven are complete as of this archive.

Phase 08 scope was: the Interactive Terminal — turning the existing
visual-only Hero terminal into a real, lightweight, simulated command
terminal ("gill@portfolio") that a recruiter can type into: `help`,
`whoami`, `about`, `journey`, `skills`, `projects`, `experience`,
`education`, `achievements`, `contact`, `status`, `date`, `clear`, and
a placeholder `ai` command. Frontend-only — no AI, no API, no backend,
no real shell.

All eight are complete as of this archive.

Phase 09 scope was: the AI Assistant ("Gill AI") — a prominent
"Ask Gill AI" section (plus a dedicated `/ai` page) where a visitor or
recruiter can ask natural-language questions about Gill and get
answers built only from the site's existing, verified data. No AI
provider API key exists in this project yet, and the site is still
`output: "static"` with no server adapter, so — per the brief's
explicit "do not invent credentials, build a frontend mock/fallback
mode instead" instruction — Phase 09 ships a fully client-side,
rule-based answer engine over the existing data files, architected so
a real backend/AI provider can be swapped in later without changing
the chat UI.

All nine are complete as of this archive.

### Phase 09 — what changed

- **New `src/data/aiKnowledge.ts`** — the AI's knowledge layer. It
  imports the same `src/data/*.ts` files every other section (and the
  Phase 08 terminal) already reads — `profile`, `journey`,
  `skillCategories`/`technicalFocus`, `projects`, `experienceEntries`/
  `experienceCategories`, `education`/`pklOpportunity`, and
  `achievements` — and assembles them into plain-text answer
  functions (`getWhoIsGill`, `getJourney`, `getEducation`, `getSkills`,
  `getCurrentlyLearning`, `getLinuxAnswer`, `getNetworkingAnswer`,
  `getExperience`, `getProjectsOverview`, `getProjectDetailById`,
  `getSmartLabDeployment`, `getAchievements`, `getContact`) plus the
  explicit hallucination-prevention fallbacks
  (`getEmployerFallback`, `getPklFallback`, `getOffTopicFallback`,
  `getUnknownFallback`). None of Gill's information is duplicated by
  hand here — every string is built from the imported data at call
  time, so if a data file is edited, the assistant's answers change
  with it automatically, exactly like the brief's "single source of
  truth" requirement (#25/#6) asked for. `getContact()` reuses the
  same "is this a real link or a Phase 01 TODO placeholder"
  (`href === "#"` / `example.com`) check `terminal.ts`'s `contact`
  command already established in Phase 08 — kept as a small local copy
  rather than an import, to avoid coupling the new knowledge module to
  the terminal module for one five-line predicate; both are
  documented as mirroring each other so they can't silently drift
  without being noticed. Also exports `quickQuestions` (the exact
  suggested-question list from the brief) and `projectOrder` (project
  IDs in display order, used to resolve "the first one" / "the second
  one" follow-ups).
- **New `src/lib/aiEngine.ts`** — the only place user input is
  interpreted. `answerQuestion(rawInput, context)` is a plain keyword/
  intent matcher (checked in order: greetings; Smart-Lab-specific
  questions, checking the "was it deployed?" phrasing before the
  general project-summary phrasing so the two never get confused;
  Automatic Gate; ordinal follow-ups like "the first one"/"the second
  one" resolved against `projectOrder`; a pronoun follow-up
  ("was it deployed?"/"what about it") resolved against
  `context.lastProjectId`; the employer/PKL hallucination guardrails;
  contact; achievements; education; currently-learning; Linux;
  networking; experience; skills/technologies; projects overview;
  journey; "who is Gill"; a small explicit off-topic list; and a
  final honest "I'm not sure I caught that" fallback that names what
  it *can* answer instead of guessing) — never `eval`, never sends the
  input anywhere, never invents a fact not already returned by
  `aiKnowledge.ts`. Input is capped at 300 characters
  (`MAX_INPUT_LENGTH`) before matching, a basic abuse/length guard per
  the brief's #19 (no backend exists yet to rate-limit at the network
  level, so this is the one guard that currently applies).
  **Architecture seam, per the brief's #24/#25:** `answerQuestion` is
  declared `async`/returns a `Promise<AiAnswer>` even though today's
  implementation is fully synchronous — this is deliberate groundwork
  so that once a real backend exists (Astro `output`
  `"server"`/`"hybrid"` + an adapter + a server-only AI provider key),
  this function's *body* can become a `fetch("/api/ai", ...)` call
  without changing its signature, so nothing that calls it
  (`AiAssistant.astro`'s script) needs to change either. This is
  spelled out in a comment at the top of the file so a future
  implementer doesn't have to reverse-engineer the intent.
- **`AiConversationContext` and `AiAnswer` added to
  `src/types/index.ts`** — both purely additive (grepped the tree to
  confirm nothing else used those names first). `AiAnswer.topic`/
  `projectId` are the only conversational state carried between turns,
  held in a plain in-memory object in the component's own `<script>`
  — no database, nothing persisted, nothing sent anywhere, same
  approach as the terminal's in-memory `history` array from Phase 08.
- **New `src/components/ai/AiAssistant.astro`** — the actual chat
  widget, reused unchanged in two places (see below) so there is
  exactly one implementation, never two different assistants. Reuses
  the existing `TerminalWindow.astro` shell (`title="GILL AI"`) rather
  than inventing a new visual language — its built-in pulsing status
  dot already reads as "online," so no separate "● ONLINE" badge was
  added. Structure, top to bottom: a scrollable
  (`max-h-96 overflow-y-auto`) `role="log" aria-live="polite"` message
  log seeded with the server-rendered greeting
  (`aiKnowledge.getGreeting()`); a hidden-by-default
  "Generating response…" status line (`motion-safe:animate-pulse`,
  shown only while a question is being answered — Phase 09's version
  of the brief's #17 loading state); the `quickQuestions` rendered as
  tappable chips (`data-question="..."` buttons); a `<form>` with a
  labeled `<input maxlength="300">` and a `Send` button
  (`autocomplete/autocapitalize/autocorrect/spellcheck` all off, same
  as the terminal's input); and a small trust line ("Answers come from
  the verified information on this portfolio — nothing invented.").
  **Security, addressed the same way `InteractiveTerminal.astro`
  addressed it in Phase 08:** every printed line — both the visitor's
  own typed question and the AI's answer — goes through
  `document.createTextNode`/`textContent`, never `innerHTML`; line
  breaks in multi-line answers are real `<br>` elements built in JS,
  never raw HTML in a string. No `eval`, no `new Function`, no dynamic
  `<script>` construction. The Send button and input are disabled
  while a request is in flight (`setBusy(true)`), which both prevents
  duplicate submissions and doubles as the loading-state indicator.
  The one `catch` block never surfaces a raw error/stack
  trace/status code — only the brief's exact fallback copy ("Gill AI
  is currently unavailable. You can still explore the portfolio
  manually through the sections above.") — currently mostly
  defensive, since today's engine is local logic that shouldn't throw,
  but it's the seam a future real network call's failure would surface
  through without any UI change.
- **New `src/components/sections/AskGillAi.astro`** — the homepage
  section (`id="ai"`, `SectionHeader index="08"`, eyebrow "Portfolio
  Intelligence", title "Ask Gill AI", the brief's exact supporting
  copy), rendering `<AiAssistant class="max-w-2xl" />`.
  `src/pages/index.astro` now renders it between `<Achievements />`
  and `<Contact />`. `Contact.astro`'s `SectionHeader index` moved
  `"08"` → `"09"` — the same one-line renumbering maintenance every
  prior section addition has done (Phase 05/06/07 notes above); no
  other content in Contact changed.
- **`src/pages/ai.astro` rewritten** from the Phase 01–08 "not
  deployed yet" placeholder to render the exact same
  `<AiAssistant class="mt-8" />` component the homepage section uses,
  under a small page-level heading/intro and a "Prefer to reach out
  directly? Go to Contact" link back to `/#contact`. This is the
  dedicated full-page entry point the nav bar's existing "AI" pill
  (`aiNavItem`, unchanged, still `href="/ai"`) already pointed at —
  it now shows the real feature instead of a placeholder. Per the
  brief's #22 Hero-integration instruction, the Hero's existing
  `<Button href="/ai">Ask Gill AI</Button>` was changed to
  `href="#ai"` so it scrolls/focuses the homepage section instead of
  navigating away — the nav pill and the Hero button now intentionally
  point to the two different, equally real access points (dedicated
  page vs. in-page section) rather than the Hero opening a second,
  differently-built assistant. `TerminalLine.astro`/`TypedText.astro`
  (used only by the old `/ai` placeholder's boot line) are **not
  deleted** — same "orphaned, not removed" treatment Phase 08 gave
  `HeroTerminal.astro`'s old boot animation — grepped the tree to
  confirm no other file imports them, so nothing is silently broken by
  `/ai.astro` no longer using them.
- **`src/data/terminal.ts`'s `ai` command updated.** Phase 08 left it
  as intentional groundwork returning exactly `"AI Assistant is coming
  soon."`; it now reports the assistant is live and points to the
  "Ask Gill AI" section / `/ai`, and its `help` summary changed from
  "ask Gill AI (coming soon)" to "ask Gill AI". No other terminal
  command, and no other part of `terminal.ts`'s behavior, changed.
- **No new dependencies, no framework.** The chat widget is plain
  Astro + a vanilla `<script>` importing two local TypeScript modules
  (`@/lib/aiEngine`, `@/types`) — the same pattern already established
  by `InteractiveTerminal.astro`, `Nav.astro`'s menu toggle, and
  `Experience.astro`'s category filter. No AI SDK, no HTTP client, no
  markdown renderer (answers are plain text with `\n`-separated lines
  and `•` bullets, rendered as literal text — nothing here parses or
  renders Markdown, so there's nothing to sanitize).
- **No backend endpoint was created.** `astro.config.mjs` still has
  `output: "static"` with no adapter installed, which is what the
  brief's #1/#2 explicitly anticipated ("if no backend/API
  configuration exists yet, create a frontend mock/fallback mode
  instead of inventing credentials" / "do not require the website to
  have a real API key during development"). Creating a
  `src/pages/api/ai.ts` endpoint under `output: "static"` without an
  adapter would make `astro build` fail outright (Astro requires an
  adapter for any non-prerendered route), so no such file was added —
  doing so would have broken the one thing the brief asked to protect
  ("the UI must still work"). The future endpoint shape is documented
  in `src/lib/aiEngine.ts`'s file comment and in "Connecting a real AI
  provider later" below instead of being half-built and broken.
- **Accessibility:** the message log is a labeled
  `role="log" aria-live="polite"` region, same pattern as the
  terminal's output region; the input has a real (visually hidden)
  `<label>` plus the existing global `:focus-visible` ring is left
  untouched (no `outline`-removing class was added); the "Generating
  response…" status text is marked `aria-hidden="true"` since the
  live region itself will announce the AI's answer once it lands, so
  the status text isn't double-announced.
- **Responsive design:** the message log wraps long lines
  (`whitespace-pre-wrap break-words`) and scrolls internally
  (`max-h-96 overflow-y-auto`) instead of growing the page; the quick-
  question chips wrap (`flex flex-wrap`); the input row uses
  `min-w-0 flex-1` so it can shrink without pushing the send button
  off-screen, the same technique the terminal's input row already
  uses.

### Hallucination prevention — how it's enforced structurally

Per the brief's #7/#8/#14, the assistant must never invent a fact.
This isn't just a personality instruction here — it's structural:

- Every "positive" answer function in `aiKnowledge.ts` only ever
  reads fields that already exist on the imported data objects; there
  is no free-text generation step where a fact could be invented.
- The specific cases named in the brief are hard-coded fallbacks, not
  left to a keyword match that might miss: asking about a current
  employer always returns exactly *"Gill's portfolio does not
  currently list a formal employment position."*; asking about a
  completed internship/PKL always returns *"Gill has not completed
  his PKL yet."* followed by the real `pklOpportunity.description`
  (upcoming interview, not yet confirmed/accepted/started); asking
  whether Smart-Lab was deployed always returns the "reached a
  completed development/prototype stage… not officially deployed…
  ran out of time during testing with the department head" answer,
  never a claim of production use.
- Smart-Lab's team-vs-personal-contribution distinction
  (brief #8) is enforced by `getProjectDetailById` itself: for any
  project with `team: true` and a `contribution` field, the answer
  always states *"This was a team project. Gill's personal
  contribution: …"* rather than a single blended sentence — this
  isn't Smart-Lab-specific logic, it's the general rule the `Project`
  data shape already encodes (see Phase 05's `contribution` field).
- Unrecognized/unrelated questions get an honest "I'm not sure I
  caught that" or "I'm built to answer questions about Gill's
  background… I can't help with that one" response (`getUnknownFallback`/
  `getOffTopicFallback`) rather than a generic LLM-style guess —
  there is no generic LLM in this phase to guess with in the first
  place.

### Connecting a real AI provider later (not done in this phase)

Per the brief's #24, this is designed so a real provider is an
isolated, additive change later, not a rewrite:

1. Add a server adapter (e.g. `@astrojs/node`) and change
   `astro.config.mjs`'s `output` from `"static"` to `"server"` or
   `"hybrid"`.
2. Add `src/pages/api/ai.ts` — a real `POST` endpoint that takes the
   visitor's question (and, if wanted, the same `AiConversationContext`
   shape already defined in `src/types/index.ts`), calls an AI
   provider server-side using a server-only environment variable
   (never `PUBLIC_`-prefixed, never referenced from any `.astro`
   component or client `<script>`), and returns `{ text, topic?,
   projectId? }` — the exact same `AiAnswer` shape `aiEngine.ts`
   already returns, so the frontend contract doesn't change.
3. Feed that endpoint the same `aiKnowledgeBase`-shaped content
   already assembled in `src/data/aiKnowledge.ts` (e.g. as a system
   prompt/context block) so the real model is grounded in the same
   verified data the rule-based version uses today, rather than
   needing a second, separately-maintained knowledge source.
4. Swap the body of `answerQuestion()` in `src/lib/aiEngine.ts` for a
   `fetch("/api/ai", { method: "POST", body: JSON.stringify({
   question: rawInput, context }) })` call, keeping its exported
   signature (`(rawInput, context) => Promise<AiAnswer>`) identical —
   `AiAssistant.astro`'s script already `await`s this function, so it
   needs no changes at all.
5. Add basic rate limiting at the endpoint (per the brief's #19) —
   e.g. a per-IP/per-session request counter — and keep the existing
   300-character input cap and response-length discipline.
6. Keep the existing client-side fallback message ("Gill AI is
   currently unavailable…") as the `catch` path for that `fetch`
   failing — no code change needed there either, since
   `AiAssistant.astro`'s `try/catch` already exists for exactly this.

None of this was implemented in Phase 09, per the brief's explicit
"do not require the website to have a real API key during
development" instruction — this section exists so a future prompt (or
a human) doesn't have to re-derive the plan.

### Phase 08 — what changed

- **New `src/data/terminal.ts`** — the single source of truth for
  everything the terminal can print. It imports directly from the
  existing `src/data/profile.ts`, `journey.ts`, `skills.ts`,
  `projects.ts`, `experience.ts`, `education.ts`, and
  `achievements.ts` rather than holding its own copy of any personal
  content, so the terminal's answers can't drift out of sync with the
  rest of the site. Exposes one small, typed API:
  - `bootLines()` — the static "GILL SYSTEM / STATUS: ONLINE / MODE:
    PORTFOLIO / LOCATION: WEB" identity banner shown before the first
    prompt.
  - `commandNames` — the flat list of valid command names, used for
    Tab-completion.
  - `runCommand(input)` — the only entry point that turns typed text
    into output. It does a plain lookup against a fixed
    `commandDefinitions` table (`help`, `whoami`, `about`, `journey`,
    `skills`, `projects`, `experience`, `education`, `achievements`,
    `contact`, `status`, `date`, `clear`, `ai`) and returns
    `{ lines: string[]; clearScreen?: boolean }` — plain text only,
    never HTML, never evaluated as code. An unrecognized command
    returns the specified `Command not found: <name>` / `Type "help"
    to see available commands.` response instead of a real shell
    error.
  - `contact` deliberately checks whether `profile.socials` entries
    are still the Phase 01 placeholders (`href="#"` or an
    `example.com` address) and falls back to `"Contact information
    will be available soon."` if so — so the terminal doesn't
    accidentally print fake contact info if `profile.ts` is edited
    later without removing the placeholders, and automatically starts
    showing real links once real ones are added, with no terminal
    code change needed.
  - `journey` uses a small `stage → short label` map (e.g. `origin` →
    "IPA background", `achievement` → "1st place TJKT cohort") to
    compress the seven real milestones into the compact vertical flow
    from the brief, without duplicating the full prose from
    `journey.ts`.
  - `education` reads `pklOpportunity` too, and explicitly reports
    "CURRENTLY STUDYING" (`education.find(e => e.current)`) — it
    cannot say "graduated" because nothing in the data model has a
    graduated state to read from.
  - `ai` returns exactly `"AI Assistant is coming soon."` — this is
    intentional groundwork for a future real command, not a bug (see
    "Connection to AI" in the brief).
- **New `src/components/terminal/InteractiveTerminal.astro`** — the
  actual terminal UI. Reuses the existing `TerminalWindow.astro` shell
  unchanged (title set to `"gill@portfolio"`, purple pulsing status
  dot in the header already existed) so the terminal keeps looking
  like the rest of the site, not a new visual language. Structure,
  top to bottom: the server-rendered `bootLines()` identity banner in
  a scrollable (`max-h-72 overflow-y-auto`) `role="log"
  aria-live="polite"` output region; a `<form>` with a visible
  `gill@portfolio:~$` prompt glyph, a real `<input>` with a
  screen-reader label (`sr-only`) and `aria-label`, and
  `autocomplete/autocapitalize/autocorrect/spellcheck` all off (this
  is a command box, not prose); a small keyboard-hint caption below
  the input. No `<form>` submit navigates anywhere — `submit` is
  always prevented and handled in JS.
  - A small inline `<script>` (same vanilla-JS pattern already used by
    `Nav.astro`'s mobile-menu toggle and `Experience.astro`'s category
    filter — no framework, no new dependency) imports `runCommand` and
    `commandNames` from `@data/terminal` and wires up: `Enter` (via
    the form's `submit` event) to run a command; `↑`/`↓` to walk a
    plain in-memory `history: string[]` array (component state only —
    nothing is sent anywhere or persisted); `Tab` for autocomplete
    (fills the input on an unambiguous prefix match, otherwise prints
    the candidate list); `Ctrl+L`/`Cmd+L` to clear the output.
  - **Security, addressed exactly as the brief required:** no
    `eval()`, no `new Function()`, no `innerHTML` for any
    user-influenced or command-output text — every printed line is
    set via `textContent` on a freshly created `<span>`/`<div>`, so
    typed input or data-file content can never be interpreted as
    markup. `clearOutput()` only ever sets `innerHTML = ""` (emptying
    the terminal's own container, not inserting anything), which is
    the one place `innerHTML` appears at all. Nothing reads or prints
    environment variables, build info, or server details — there is
    no server; this is a static site.
- **`src/components/hero/HeroTerminal.astro` rewritten** to render
  `<InteractiveTerminal class="w-full max-w-md" />` instead of the old
  fixed `TerminalLine`/`TypedText` boot animation. Per the brief's
  Hero-integration instruction ("become the interactive terminal, or
  provide a clear way to open/focus it — do not create two confusing
  terminal experiences"), the Hero terminal **is** the interactive
  terminal now; there is exactly one terminal experience on the site.
  `Hero.astro` itself needed no changes — it already just renders
  `<HeroTerminal />` without knowing its internals.
  `TerminalLine.astro`/`TypedText.astro` were **not deleted** (per "do
  not remove existing features") — they're still used as-is by the
  `/ai` placeholder page's static boot line, so removing them would
  have broken that page for no reason.
- **No new dependencies, no framework.** The terminal is plain Astro +
  vanilla TypeScript in a `<script>` tag, the same pattern already
  established elsewhere in this codebase (`Nav.astro`,
  `Experience.astro`'s filter). `prefers-reduced-motion` needed no new
  handling: the only animation involved is the existing header pulse
  dot in `TerminalWindow.astro`, already covered by the global rule in
  `global.css`; there is no new keyframe or transition in this phase.
- **Accessibility:** the output region is a labeled `role="log"` live
  region so command results are announced as they appear; the input
  has a real (visually hidden) `<label>` plus `aria-label` fallback;
  focus is never suppressed — the input intentionally carries no
  `outline`-removing utility class, so the existing global
  `:focus-visible` ring (`global.css`) still shows on it; nothing here
  relies on color alone (command-not-found is plain text, not a color
  change).
- **Responsive design:** the output area wraps long lines
  (`whitespace-pre-wrap break-words`) and scrolls internally instead
  of growing the page (`max-h-72 overflow-y-auto`); the input row uses
  `min-w-0 flex-1` so it can shrink on narrow screens without pushing
  the prompt glyph off-screen or causing horizontal page overflow.

### Phase 07 — what changed

- **New `src/data/experience.ts`** with 13 verified entries across
  five category groups (`networking`, `server`, `hardware`, `web`,
  `embedded`) — CCTV Installation, Laboratory Relocation/Lab
  Migration, Real FTTH Topology, PC Assembly, Windows
  Installation/Reinstallation, Printer Troubleshooting, Computer
  Troubleshooting, MikroTik/Network Configuration, Linux Server,
  Nginx/Apache, VirtualBox, Website Development, and Arduino/ESP32
  Projects — the exact list named in the brief, nothing added or
  removed. Every `type` value (`hands-on-practice`, `school-project`,
  `lab-work`, `technical-practice`, `personal-experiment`,
  `networking-practice`, `server-practice`, `lab-environment`) reads
  as practice/exposure, never a job title. No company, client,
  employment, salary, certification, exact date, or years-of-experience
  figure appears anywhere in the file. Two small visual-flow exports —
  `experienceApproachFlow` (Input → Diagnose → Configure → Test →
  Troubleshoot → Improve) and `networkingFlow` (Networking → MikroTik
  → Topology → FTTH → Troubleshooting) — back the section's two
  diagrams; both are explicitly captioned as a structural shape, not a
  claimed formal methodology. Website Development and Arduino/ESP32
  Projects carry `relatedProjectIds` (`smart-lab`, `automatic-gate`)
  so the card can link back to the existing Projects section instead
  of duplicating the Smart-Lab case study.
- **New types in `src/types/index.ts`**: `ExperienceCategoryGroup`,
  `ExperienceType`, `ExperienceEntry`, `ExperienceCategoryMeta` — all
  additive, no existing type touched. `ExperienceEntry.relatedProjectIds`
  is typed as plain string IDs resolved against `src/data/projects.ts`
  at render time (in `ExperienceCard.astro`), not a duplicated object,
  so the two data files can't drift out of sync silently — if a
  referenced project ID is ever removed, the card simply renders no
  link rather than erroring.
- **New `src/components/cards/ExperienceCard.astro`** — reuses
  `Card`/`Badge`/`TechTag` and the existing `hoverCardGlow`/
  `hoverTechTag` treatment from `@/lib/ui` (no new hover styling
  invented). Networking entries (`featured: true`) get a `Badge
  tone="signal"` ("Networking focus") for the stronger visual emphasis
  the brief asked for — deliberately not a border-color override, to
  avoid the same base-vs-utility specificity race `SkillCard.astro`
  already documents and avoids. Related projects render as plain
  in-card links to `#projects` with the real project title, resolved
  from `projects.ts` by ID.
- **New `src/components/sections/Experience.astro`** (`index="06"`,
  eyebrow "Hands-On Experience", title "Beyond the classroom",
  description matching the brief's supporting text exactly). Renders,
  top to bottom: the approach-flow panel (reusing the existing
  `ArchitectureFlow` component, horizontal, with its own caveat note);
  the networking spotlight panel (a signal-bordered callout with the
  networking flow, vertical `ArchitectureFlow`) for the stronger
  visual emphasis the brief asked for; a simple category filter (`All`
  / the five category labels) that shows/hides cards by a
  `data-experience-category` attribute; the filtered
  `ExperienceCard` grid; and a closing line — matching the "still
  learning" framing the brief's recruiter-perspective section asked
  for — styled the same way Journey's/Skills'/Education's closing
  lines already are (`border-l-2 border-signal-dim`).
- **PKL is not mentioned in this section at all.** Per the brief's
  "if unnecessary, omit it" instruction: the existing `pklOpportunity`
  panel in `Education.astro` already covers the upcoming-interview
  status in full, so repeating it here would only duplicate content
  without adding anything — the only PKL-related content on the whole
  site remains that one panel.
- **`src/pages/index.astro`** now imports and renders `<Experience />`
  between `<Projects />` and `<Achievements />`, matching the
  narrative order named in the brief (Journey → Skills → Projects →
  Technical Experience).
- **`src/data/nav.ts`** gained one entry — `{ label: "Experience",
  href: "#experience" }` — between Projects and Achievements.
  `Nav.astro` and `ProgressRail.astro` needed no changes, same as
  every prior section addition: both already consume
  `navItems`/section IDs generically.
- **Section numbering renumbered end-to-end** to stay accurate after
  inserting a new section (same maintenance already done in Phase 06
  for Education): Achievements `"06"` → `"07"`, Contact `"07"` →
  `"08"`. No other content, layout, or styling in
  About/Journey/Education/Skills/Projects/Achievements/Contact was
  touched. The stale "Section numbering (01–06)" note further down in
  this file's Design Concept section (left over from before Education
  was added in Phase 03/06) is corrected below to the current
  eight-section sequence while this file is being updated anyway.
- **No new dependencies.** The category filter is a small vanilla
  `<script>` block (same pattern as `Nav.astro`'s mobile-menu toggle
  and active-section observer) that only toggles a `hidden` class —
  no animation library, no new keyframe. The grid entrance uses the
  existing `motion-safe:animate-fade-up` keyframe (already used by
  `AchievementCard.astro`), already covered by the global
  `prefers-reduced-motion` rule in `global.css`.

### Phase 06 — what changed

- **`src/data/education.ts` rewritten.** The TJKT entry (`id: "tjkt"`)
  now holds verified real data — `institution: "SMKN 2 Baleendah"`,
  `program: "Teknik Jaringan Komputer dan Telekomunikasi"`,
  `shortName: "TJKT"`, `period: "2025 — 2027"`, `current: true`,
  `direction: "Technology"`. The prior IPA/science entry (`id:
  "prior"`) is **left untouched** — its institution name was never
  verified in this phase either, so the `TODO: school name`
  placeholder stays rather than inventing one. Two new exports:
  `educationStory` (a short paragraph bridging to `journey.ts` —
  deliberately not a retelling of it) and `pklOpportunity` (Hotel
  Sunshine Soreang Bandung, `status: "upcoming-interview"`, wording
  that explicitly states it is not yet confirmed, accepted, or
  started).
- **`EducationEntry` type extended** (`src/types/index.ts`): added
  optional `shortName`, `current`, and `direction`. All three are
  additive/optional, so `About.astro`'s existing inline education
  aside (which only reads `period`/`program`/`institution`) needed no
  changes and now simply renders the real data instead of the old
  `20XX`/`TODO` placeholders. Two new types back the new exports:
  `EducationStory` (a single `story` field, same pattern as
  `profile.philosophy`) and `PklOpportunity` (`PklStatus` is
  deliberately defined with only one value, `"upcoming-interview"` —
  no `"completed"`/`"hired"` value exists on the type, so a future edit
  can't casually imply the PKL was completed).
- **New `src/components/cards/EducationCard.astro`** — the technical
  info card for the current program: institution, program, period, an
  "In progress" `Badge` (signal tone), and a small metadata `<dl>`
  (field / direction / status) below a divider. Explicitly not styled
  as a fake terminal — plain labeled data pairs, consistent with the
  brief's "clean information card" instruction.
- **New `src/components/sections/Education.astro`** (`index="03"`,
  eyebrow "Education", title "Where I'm learning"). Two-column layout:
  left column has the `EducationCard`, the `educationStory` paragraph
  (styled with the same left-accent-bar treatment already used by
  Journey's and Skills' closing lines), and the prior IPA entry as a
  small dashed tag rather than a second full card; right column is the
  PKL status panel — dashed border, neutral "Not started" `Badge`,
  organization name, and the explicit not-yet-confirmed description.
- **`Achievement` type replaced** (`src/types/index.ts`). The old
  shape (`issuer`/`date` always required) no longer fit real,
  heterogeneous entries, so it's now `category` /
  `categoryLabel` / `title` / `subtitle?` / `description` / `tier`
  (`"high" | "medium" | "supporting"`) / `featured?` / `period?` /
  `issuer?`. `issuer` and `date` are gone as required fields — no
  issuing body or exact date was verified for any of the three
  certifications, so the type doesn't imply one exists; `period?`
  instead reuses the same verified "Grade 11"/"Grade 12" labels already
  established in `journey.ts`, never a literal date. The only prior
  consumers (`achievements.ts`, empty, and `AchievementCard.astro`,
  rewritten in this phase) made this a clean replacement.
- **`src/data/achievements.ts` populated with 8 verified entries**,
  each traced directly to the brief: the featured 1st Place/TJKT Cohort
  result (`tier: "high"`, `featured: true`, `period: "Grade 11"`,
  matching the same result already in `journey.ts`'s `metric` field on
  the "achievement" milestone); 2nd Place/Overall (`tier: "high"`,
  same period); the national-level MikroTik olympiad, stated as
  participation only — **no placement/result is claimed**, matching
  the brief's explicit instruction (`tier: "high"`, `period: "Grade
  12"`, matching `journey.ts`'s "breaking-comfort-zone" milestone);
  three certifications — Network Fundamental, MikroTik Certificate,
  MikroTik Participant 2026 — as `tier: "medium"`, with no invented
  issuer, certificate number, or grade; and two medals — Bronze
  (Biology), Silver (Pancasila) — as `tier: "supporting"`. Nothing
  beyond what's listed here was added.
- **New `src/components/cards/FeaturedAchievementCard.astro`** — the
  large "01 / 1ST PLACE / TJKT COHORT" hero treatment from the brief:
  a big mono "01" numeral beside an inner `border-l-2 border-signal`
  accent block (the accent bar sits on a **fresh inner `div`, not the
  `Card` root**, specifically so the permanent border color never
  races with `Card.astro`'s own base `border-border-subtle` utility —
  same reasoning already documented in `SkillCard.astro` for why
  primary/support styling avoids overriding base border-color
  directly).
- **`src/components/cards/AchievementCard.astro` rewritten** for the
  grid entries (high-tier results and certifications): category label,
  a `Badge` ("Milestone" for high tier, "Certified" for certifications
  — tone follows tier), title/subtitle, description, and the optional
  period readout. Uses `motion-safe:animate-fade-up` (an existing,
  previously-unused keyframe already defined in `tailwind.config.mjs`
  — no new dependency, no new keyframe) for the "subtle reveal"
  interaction the brief asked for.
- **`src/components/sections/Achievements.astro` rewritten**
  (`index="06"`, was `"05"`; eyebrow "Achievements", title
  "Milestones", description "Small milestones that mark the climb.").
  Renders, top to bottom: the `FeaturedAchievementCard` for the one
  `featured` entry; the remaining high-tier results in a two-column
  grid; a "Certifications" subsection for the `tier: "medium"` entries
  in their own labeled group; and the two medals rendered as plain
  dashed-border chips (not `Card`s) under an "Other recognitions"
  label — deliberately the most visually minimal treatment in the
  section, per the brief's "keep visually secondary, never implied as
  technical" instruction. The existing `EmptyState` fallback is kept
  for a defensive zero-entries case.
- **Section numbering renumbered end-to-end.** Adding Education
  between Journey and Skills shifts every following section's `index`
  prop by one: Skills `"03"` → `"04"`, Projects `"04"` → `"05"`,
  Achievements `"05"` → `"06"`, Contact `"06"` → `"07"`. This is a
  one-line prop change per file — no other content, layout, or styling
  in About/Journey/Skills/Projects/Contact was touched. Per the
  existing design-concept note ("Section numbering (01–07) is used
  because the content genuinely is a sequence"), keeping the numbers
  accurate after inserting a new section is part of preserving that
  system, not a redesign of it.
- **`src/pages/index.astro`** now imports and renders `<Education />`
  between `<Journey />` and `<Skills />`.
- **`src/data/nav.ts`** gained one entry — `{ label: "Education", href:
  "#education" }` — between Journey and Skills. `Nav.astro` (desktop
  and mobile menus, active-section `IntersectionObserver` highlighting,
  and `ProgressRail.astro`) all consume `navItems`/section IDs
  generically already, so no changes were needed there — adding the
  nav entry and the matching `id="education"` on `Education.astro`'s
  `SectionShell` was sufficient for it to work end-to-end.
- **PKL is not presented as completed anywhere.** The only PKL-related
  content in the whole site is the `pklOpportunity` panel in
  `Education.astro`, explicitly labeled "PKL Opportunity" with a
  neutral "Not started" badge and wording that states it's an upcoming
  interview only.
- **No new dependencies.** No JS was added — `<details>` isn't used
  here (unlike `FeaturedProjectCard.astro`); the only interaction is
  existing `hover:`/`motion-safe:` Tailwind variants (via the shared
  `hoverCardGlow` from `src/lib/ui.ts`, reused rather than
  reintroduced) and the existing `motion-safe:animate-fade-up`
  keyframe, both already covered by the global
  `prefers-reduced-motion` rule in `global.css`.

### Phase 05 — what changed

- **`src/data/projects.ts` rewritten from an empty array to two real
  entries.** Every field traces back to what was verified:
  - **Smart-Lab** — a **team** project (`team: true`, a "Team project"
    badge is always shown). Gill's own part is kept in a dedicated
    `contribution` field, separate from `role` ("Team project"), so
    it's never ambiguous what he personally built vs. the team:
    *"Developed the automatic laboratory door locking system."*
    Status is `"complete-not-deployed"` — functionally finished but
    never went live in the school laboratory (the team ran out of
    time during testing with the department head). `result` states
    this directly; nothing anywhere implies current/ongoing use. The
    `links.live` field holds the existing external demo URL
    (`http://103.148.112.91:8177/smart-lab/admin`) exactly as given —
    no new URL was invented — and the card explicitly labels it as an
    external link with availability not guaranteed. `architecture` is
    `["RFID","ESP32","URL","Laravel","MySQL"]`, rendered as a labeled
    "System overview" with a caption stating it's conceptual, not a
    verified live data-flow diagram (the brief was explicit not to
    imply direct communication between every component if that isn't
    accurate). `featured: true` gives it the larger two-column layout.
  - **Automatic Gate** — a small, solo (`role: "Solo project"`)
    embedded prototype. `status: "prototype"`, no links, no
    contribution field (redundant on a solo project), and
    `architecture: ["Distance Detection","Arduino","Servo"]` rendered
    as a short horizontal logic flow. Deliberately not inflated in
    scope or wording.
  - No dates, user counts, deployment numbers, or competition results
    are present for either project — none were verified, per the
    brief's explicit "do not invent" list.
  - A new `upcomingProjectAreas` export lists the real areas of
    experience named in the brief (Website Development, Linux Server,
    MikroTik/Networking, Arduino/ESP32, CCTV, School Network Projects,
    PC Building, Windows Installation, Computer Troubleshooting) as
    **plain labels only** — never turned into fake detailed project
    cards.
- **`Project` type (`src/types/index.ts`) substantially extended.**
  `ProjectStatus` gained `"prototype"` and `"complete-not-deployed"`
  (existing `"in-progress"`/`"shipped"`/`"archived"` were kept,
  unused for now but not removed). New fields: `category`, `problem?`,
  `approach?`, `contribution?`, `result?`, `team?`, `featured?`,
  `architecture?: string[]`. `stack` was renamed `technologies` and
  `year` was made optional (an exact date was never verified for
  either project, so the type shouldn't imply one exists — the same
  reasoning already applied to `JourneyMilestone.period` in Phase 03).
  A new `UpcomingProjectArea` interface backs the "more experiments
  coming" list. This was a clean replacement, not a breaking change to
  any other file — `Project`/`ProjectStatus` were previously only used
  by the (until now empty) `projects.ts` and `ProjectCard.astro`,
  which are both rewritten in this phase anyway.
- **New `src/components/cards/ArchitectureFlow.astro`** — a small,
  reusable conceptual flow/diagram: vertical (arrows pointing down) for
  Smart-Lab's "System overview", horizontal (arrows pointing right,
  wrapping on mobile) for Automatic Gate's "Core concept". Takes an
  optional `note` caption so a caveat about it being conceptual only
  is shown where it matters (Smart-Lab) and omitted where the flow is
  already a plain, literal statement of hardware logic (Automatic
  Gate).
- **New `src/components/cards/FeaturedProjectCard.astro`** — the
  larger, two-column technical case-study layout used for Smart-Lab:
  left column carries title, category, "Team project" badge, status
  badges, the "My contribution" callout, technology tags, and a
  `<details>/<summary>` "Technical story" disclosure (Problem /
  Approach / Result — plain HTML disclosure, no JS, so
  `prefers-reduced-motion` needs no special handling); right column
  renders the `ArchitectureFlow` "System overview". Status badges are
  never collapsed into one label — `"complete-not-deployed"` always
  renders as two separate badges ("Complete" + "Not deployed") so it
  can't be misread as live.
- **`src/components/cards/ProjectCard.astro` rewritten** for
  non-featured entries (currently just Automatic Gate): the same
  status-badge and "My contribution" treatment as the featured card,
  at smaller scale, plus an optional horizontal `ArchitectureFlow`
  when `architecture` is present.
- **`src/components/sections/Projects.astro` rewritten.** New
  eyebrow/heading/description ("Selected Work" / "Things I've built" /
  the brief's supporting line). Renders featured projects first via
  `FeaturedProjectCard`, then any remaining projects in a responsive
  grid via `ProjectCard`, then the "More experiments coming" panel
  listing `upcomingProjectAreas` as plain dashed-border tags — never
  as project cards. The existing empty-state fallback is kept for the
  (currently impossible, but still defensively handled) case of zero
  projects.
- **New `src/lib/ui.ts`** — pulls the hover-glow class string (already
  introduced ad hoc in Phase 04's `SkillCard.astro`) and the
  tech-tag-hover class string into one shared module, imported by
  `SkillCard.astro`, `ProjectCard.astro`, and
  `FeaturedProjectCard.astro`, so the same Tailwind treatment isn't
  retyped in three places. `SkillCard.astro` was updated to import
  from here instead of inlining its own copy — no visual change, just
  removed duplication per the brief's "do not duplicate styles" rule.
- **No new dependencies.** The only interactivity is the native
  `<details>/<summary>` disclosure and Tailwind `hover:`/`motion-safe:`
  variants — no JS was added, so the existing global
  `prefers-reduced-motion` rule already covers everything here.

### Phase 04 — what changed

- **`src/data/skills.ts` rewritten from empty category shells to real
  content.** Five categories: Web Development, Networking, Linux &
  Server, AI (all `primary: true` — the four pillars named in the
  brief), and Embedded/IoT (real school-project work, but kept as a
  supporting category rather than a fifth pillar). Every technology
  listed was already named in the verified brief/context (TJKT
  coursework, the MikroTik olympiad, school embedded projects) —
  nothing invented. Two more exports were added: `technicalFocus`
  (`currentFocus` / `currentlyExploring`, both short summaries of the
  category data — not a separate invented signal) and
  `skillProgression` (a five-stage structural sequence — Foundation →
  Networking → Linux → Web Development → AI — reflecting the order
  things were actually picked up per `journey.ts`, not a chart or a
  score).
- **`SkillCategory` type (`src/types/index.ts`) extended**, and the
  old `Skill`/`SkillLevel` types replaced. `SkillCategory` now has
  `description`, `status: SkillStatus`, optional `primary?: boolean`,
  and `skills: string[]` (flat names — per-technology proficiency was
  never claimed, only a category-level status). `SkillStatus` is
  `"exploring" | "learning" | "building" | "working-with"` —
  deliberately not a percentage or a tier like "advanced"/"expert".
  New `TechnicalFocus` and `SkillProgressionStage` interfaces support
  the dashboard panel and the progression sequence. The old `Skill`
  type was unused outside `types/index.ts` and `skills.ts`, so this
  was a clean replacement, not a breaking change to any other file.
- **New `SkillCard.astro`** (`src/components/cards/`) renders one
  category: label, a `Badge` ("Core focus") for the four pillars,
  `StatusIndicator` for the qualitative status (dimmed/inactive dot
  for "exploring", active signal dot otherwise), the description, and
  the technology tags via the existing `TechTag`. Hover state
  (elevation + border + glow) reuses the same pattern already
  established by `TerminalWindow.astro`/`AvatarElevation.astro`, built
  as one class string rather than trying to override `Card.astro`'s
  base border color with a second same-specificity Tailwind class.
  Individual tags get a small hover lift/border/color change.
- **`Skills.astro` rewritten.** Section label/heading/supporting text
  now match the brief exactly (`eyebrow="Technical Profile"`,
  title "What I'm building with"). Layout, top to bottom: a compact
  two-column "Current focus / Currently exploring" panel (the
  technical-dashboard element from the brief); the four primary
  `SkillCard`s in a `lg:grid-cols-4` row; the Embedded/IoT support
  card below at half width so it visibly reads as supporting, not a
  fifth pillar; the "How it connects" progression sequence (badges
  connected by an arrow that rotates 90° on mobile so it still reads
  top-to-bottom when the row wraps to a column); and a closing line —
  "This isn't a finished skillset — it's what's currently being built,
  one project at a time." — deliberately echoing Journey's closing
  statement to connect the two sections, per the brief.
- **No new dependencies.** No JS was added; all interaction is
  CSS-only (`hover:`/`motion-safe:` variants), so the existing
  site-wide `prefers-reduced-motion` rule in `global.css` already
  covers it. `EmptyState` is no longer used by `Skills.astro` (there's
  real content now), but the component itself was left untouched since
  nothing else in the brief asked for its removal and no other section
  uses it either way at this time — it's just currently unused, not
  deleted.

### Phase 03 — what changed

- **Journey data (`src/data/journey.ts`) rewritten from placeholders
  to the verified story.** Seven milestones, each mapped to a stage:
  `origin` → `adaptation` → `leadership` → `discovery` → `achievement`
  → `breaking-comfort-zone` → `current`. Content follows the brief
  exactly: IPA/science background, not getting into the intended
  school, landing in TJKT without initial interest (and not joining
  the industrial class after saying so honestly in an interview),
  adapting and finishing 1st in class in Grade 10, a leadership moment
  during a Grade 11 extracurricular demonstration, growing interest in
  the second semester of Grade 11 helped by reading "Filosofi Teras"
  and using AI as a reflection tool (not framed as the cause of the
  growth), a verified result (1st in TJKT cohort, 2nd overall), and
  Grade 12 leaving the comfort zone through competitions, projects,
  and a national-level MikroTik networking olympiad. Elevation values
  run from -100 to +80 — 80, not 100, since the brief is explicit that
  the peak is never reached. No exact dates, competition placements,
  certificates, or job/internship history were invented. **Gill has
  not completed an internship/PKL; none is mentioned or implied
  anywhere in this data.**
- **`JourneyStage` and `JourneyMilestone` types updated**
  (`src/types/index.ts`). `JourneyStage` now has the seven values
  above instead of the old placeholder set (`origin` / `pivot` /
  `ascent` / `current`). `year` was renamed to `period` (it always
  held period labels like "Grade 10", never a literal year — the
  field name was misleading). Two optional fields were added:
  `tags?: string[]` (short chips, e.g. "Leadership") and
  `metric?: string` (a verified, callable-out result — used once, for
  the Grade 11 ranking). Nothing else in `Profile`/`Project`/etc. was
  touched.
- **`JourneyMilestoneCard.astro` rewritten** to render the richer
  data and the elevation metaphor: a small mono "elev ±NN" coordinate
  readout next to the period/stage badge (echoing the AvatarElevation
  instrumentation language from Phase 02); a progressively increasing
  right-indent per card on `md+` screens (via a `--elevation-indent`
  CSS custom property, `0` on mobile so nothing can overflow) so the
  timeline visibly climbs as it's read top to bottom; the connecting
  line between nodes uses `color-mix()` to intensify toward the purple
  accent as elevation rises (falls back gracefully to the plain muted
  border color in browsers without `color-mix()` support); the final
  "Still climbing" node gets a pulsing accent ring (reusing the
  `animate-pulse-ring` keyframe added in Phase 02) instead of a static
  dot, and its badge/label reads "Still climbing," never "Peak
  reached." Tags render via the existing `TechTag` component; the
  optional metric renders as a small bracketed mono readout
  (`[ 1st in TJKT cohort · 2nd overall ]`).
- **`SectionHeader.astro` (shared component) minimally extended**
  with two new optional props — `eyebrow?: string` and
  `emphasis?: boolean` — both off by default, so every other section
  using it (About, Skills, Projects, Achievements, Contact) renders
  exactly as before. Journey is the only section currently opting in:
  eyebrow "The Ascent", and `emphasis` gives the "From minus to peak"
  heading the same uppercase/tracked/left-accent-bar treatment as the
  Hero tagline, tying the section back to the Hero visually.
- **`Journey.astro` updated** to pass the new `SectionHeader` props
  and to add a short closing statement after the timeline — "The peak
  is not the destination. It is the direction." — styled as a quiet
  accent-bordered line, matching the Hero philosophy aside's visual
  language. This is optional per the brief ("use this only if it fits
  naturally"); it was kept since it reuses an existing visual pattern
  rather than introducing a new one.
- **No new dependencies.** No scroll-linked JS was added — the
  elevation/indent/gradient effects are all static CSS computed at
  build time from `journey.ts`, so they can't drift out of sync with
  the data and add zero runtime cost. The only animation is the
  existing `motion-safe:animate-pulse-ring` on the current-stage
  marker, which (like everything else in the project) is neutralized
  site-wide by the existing `prefers-reduced-motion` rule in
  `global.css`.

### Phase 02 — what changed

- **Accent color: teal → purple.** `--color-signal` /
  `--color-signal-dim` / `--color-signal-bright` in
  `src/styles/global.css` now hold a desaturated violet
  (`#8b6ff2` / `#4d3a8f` / `#b3a1ff`) instead of the Prompt 01 teal.
  The token *names* were deliberately left unchanged (`signal`, not
  `purple`) so components didn't need to be touched to retheme, and so
  a future color change again only means editing these values. Two
  tokens were added for the same reason: `--color-signal-glow` (soft
  box-shadow glow on CTA/terminal/avatar hover) and
  `--color-signal-wash` (very faint background tint for hover states,
  e.g. the secondary button and the "AI" nav pill). Every color still
  flows through these CSS variables — grep found no hardcoded hex
  values in any `.astro` component before or after this phase, only in
  `global.css` and the static `avatar-placeholder.svg` (its one
  decorative status-dot fill was updated to match).
- **Hero identity + story.** `profile.tagline` ("From minus to peak.")
  is now given visual weight (uppercase, tracked, left accent bar)
  instead of being styled like a generic subheading. A new
  `profile.philosophy` field (`Profile` type in `src/types/index.ts`,
  value in `src/data/profile.ts`) holds the two-line personal
  philosophy ("I didn't choose where I started. / I choose how far I
  go."), rendered as a code-comment-styled aside (`// ...`) under the
  tagline — kept as data, not hardcoded in the Hero markup.
- **Avatar.** `profile.avatarPlaceholder` is now actually rendered.
  New `src/components/hero/AvatarElevation.astro` renders it inside a
  56px rounded frame next to a small inline SVG "elevation trace"
  (a coordinate-plot line dipping below a zero-baseline then climbing,
  labeled `MIN` / `PEAK`, with a pulsing marker at the current,
  not-yet-peak position). This is the "minus → climbing → peak" visual
  metaphor from the brief, rendered as instrumentation rather than
  literal mountain/hiking imagery, consistent with the existing
  `contour-backdrop` / `ProgressRail` language. Swapping in a real
  photo later is still just replacing the SVG file (or the path in
  `profile.ts`) — no component change needed.
- **Terminal card.** `TerminalWindow.astro` gained a subtle
  purple-glow hover state and a small pulsing status dot in the title
  bar (reinforcing "personal system status," not implying a real
  terminal). `HeroTerminal.astro`'s commands were relabeled to `role`
  / `focus` to match the brief's example session more closely; no
  data or behavior changed.
- **Navigation.** `Nav.astro`: refined hover states (an animating
  underline instead of a plain color swap), and new active-section
  highlighting via a small `IntersectionObserver` script (vanilla JS,
  no dependency) that adds `data-active="true"` to the nav link whose
  section is in view, styled with the purple accent. The mobile menu
  now animates open/closed (max-height transition) instead of an
  instant show/hide. No nav items were added or removed.
- **Micro-interactions.** Button hover now includes a small lift +
  soft glow (`motion-safe:hover:-translate-y-px`); terminal, avatar,
  and nav-link hovers were added in the same restrained style. All new
  transitions/animations rely on the existing global
  `prefers-reduced-motion` rule (which already zeroes out animation
  and transition duration site-wide) or Tailwind's `motion-safe:`
  variant — no new reduced-motion handling was needed.
- **No new dependencies** were introduced. No React/Vue/Svelte, no
  animation library.

## Tech stack (fixed — do not change without explicit request)

- Astro (static output), TypeScript (strict), Tailwind CSS
- No React/Vue/Svelte — none is currently needed
- No backend yet. Data lives in `src/data/*.ts`, typed via
  `src/types/index.ts`, structured so it can later be swapped for a
  Laravel REST API response without touching component code
- As of Phase 09, the "Gill AI" assistant is also frontend-only: a
  rule-based engine (`src/lib/aiEngine.ts`) over the same local data,
  no AI provider, no API key, no network call. See the Phase 09 "what
  changed" and "Connecting a real AI provider later" notes above for
  the isolated, additive plan to swap in a real backend/provider
  without touching the chat UI.

## Design concept

"From minus to peak" — Gill's real story: an IPA/science background,
not getting into the originally intended school, landing in TJKT
without initial interest, and gradually finding direction through
learning, reflection, leadership, and competitions. The site must never
imply the peak has been reached — always "still climbing."

Visual direction chosen for Prompt 01 (see `src/styles/global.css` for
the token values):

- Dark, near-black base (`--color-void`, slightly cool-tinted rather
  than pure black) with a desaturated **signal purple/violet** accent
  (`--color-signal`, changed from teal in Phase 02) — deliberately not
  the generic "acid-green/vermilion on near-black" AI-portfolio
  default, not a warm terracotta/cream palette, and kept muted enough
  to avoid reading as neon cyberpunk/gaming/crypto. The accent reads
  as instrumentation (a status light, a trace on a scope) rather than
  decoration.
- Typography: Space Grotesk (display/headings), Inter (body), JetBrains
  Mono (terminal/system/metadata labels only — not the whole site)
- The mountain/elevation metaphor is rendered as instrumentation (a
  vertical scroll-progress "elevation rail," faint contour-line
  backdrops, a plotted ascent line) — never literal hiking/outdoor
  imagery
- Section numbering (01–08) is used because the content genuinely is a
  sequence (About → Journey → Education → Skills → Projects →
  Experience → Achievements → Contact). This note originally read
  "01–06" / "About → Journey → Skills → Projects → Achievements →
  Contact" — stale since Education was inserted in Phase 06 and
  Experience in Phase 07; it's corrected here to match the actual
  current sequence rather than left to drift further out of sync.

## Explicit constraints carried over from the original brief

These still apply to all future prompts unless the person says
otherwise:

- Do not invent fake projects, achievements, testimonials, GitHub
  activity, or statistics. `src/data/achievements.ts` is intentionally
  still empty. Sections render an honest "awaiting entries" empty
  state rather than filler content. As of Phase 04, `src/data/skills.ts`
  is no longer a placeholder, and as of Phase 05, `src/data/projects.ts`
  isn't either — see the Phase 04/05 notes above — but the same rule
  applies to both: every entry must trace back to the verified
  brief/context, never invented to look more complete. In particular:
  Smart-Lab was a **team** project and is **not deployed** — both
  facts must stay visible (`team: true`, `status:
  "complete-not-deployed"`) if this data is ever edited.
- Do not claim Gill is a professional or expert.
- The Laravel backend and Filament admin are still not implemented.
  As of Phase 09, the "Ask Gill AI" assistant **is** implemented — see
  the Phase 09 notes above — but only as a frontend-only, rule-based
  engine with no AI provider/API key; it is not connected to a real
  LLM yet, and none of its answers are anything an LLM generated.
- Keep the site lightweight: minimal JS (only two small vanilla
  `<script>` blocks — the mobile menu toggle and the scroll-progress
  rail — no framework, no animation library), Astro static rendering,
  `prefers-reduced-motion` respected.
- Gill has **not** completed an internship/PKL. In particular, do not
  present any internship (e.g. at a hotel) as completed work
  experience — if it's ever added, it must be framed as an upcoming
  opportunity/interview at most, never as finished experience, and
  only once actually verified/confirmed.

## Known TODOs left in the code (search for `TODO` comments)

- Real institution names in `src/data/education.ts`
- Real social links / location in `src/data/profile.ts`
- Real favicon/avatar photo/OG image (current SVGs in `public/` are
  intentional placeholders, styled to match the design system so
  they're not visually jarring, but are not final assets). As of
  Phase 02, `profile.avatarPlaceholder` **is** rendered in the Hero
  (see `AvatarElevation.astro`) — only the underlying image itself
  still needs to be a real photo.
- Real production domain in the `site` field of `astro.config.mjs`

As of Phase 03, `src/data/journey.ts` no longer has a "real years"
TODO — it now uses the verified "Grade 10 / 11 / 12 / Current" period
labels from the brief instead of placeholder years, and is not a
placeholder file anymore. As of Phase 04, `src/data/skills.ts` is in
the same position. As of Phase 05, `src/data/projects.ts` is too —
`src/data/achievements.ts` is now the only data file still
intentionally empty.

## Verification (as of Phase 03)

`npm install` and `npm run build` (`astro check && astro build`) were
run again against the Phase 03 changes, in an environment with npm
registry access:

- `npm install`: succeeded (448 packages)
- `astro check`: 0 errors, 0 warnings, 0 hints across 40 files
- `astro build`: completed successfully, generated `/index.html` and
  `/ai/index.html` in `dist/`
- The built HTML was spot-checked for: the new Journey section header
  (eyebrow, emphasized heading), all seven milestone cards rendering
  their period/stage/elevation/description/metric/tags correctly, the
  ascending `--elevation-indent` values (0 → 13 → 22 → 31 → 38 → 45 →
  50px) and the ascending `color-mix()` percentages (0% → 19% → 34% →
  47% → 57% → 68%) on the connecting lines, the pulsing ring on the
  final "Still climbing" node, and the closing statement. The Skills
  section (untouched at the time) was also checked to confirm
  `SectionHeader`'s new optional props didn't change its output.

Not done: no real browser/visual screenshot pass (no headless browser
available in this environment) and no manual mobile-device testing —
the responsive/indent classes were reviewed by hand and the indent is
disabled below `md` specifically to rule out mobile overflow, but a
real-viewport check is still worth doing before launch. Run
`npm run dev` locally to eyeball it.

## Verification (as of Phase 04)

This sandbox had **no npm registry access** for the Phase 04 session
(`npm install` failed with `403 Forbidden` fetching packages), so
`node_modules` could not be (re)installed and `npm run build`
(`astro check && astro build`) could **not** be run or re-verified
this time. This is a sandbox/network limitation, not a code issue —
see Phase 03's note above, where the same project *did* build cleanly
in an environment with registry access.

What was checked by hand instead:

- `src/types/index.ts`: the new `SkillStatus` / `TechnicalFocus` /
  `SkillProgressionStage` types and the extended `SkillCategory` type
  are internally consistent; grepped the whole `src/` tree to confirm
  the removed `Skill`/`SkillLevel` types had no other usages before
  deleting them.
- `src/data/skills.ts`: exports match the types exactly; every
  category has `id`, `label`, `description`, `status`, `skills`, and
  the four pillars have `primary: true`.
- `src/components/cards/SkillCard.astro` and
  `src/components/sections/Skills.astro`: import paths match existing
  aliases (`@/types`, `@components/*`, `@data/skills`), prop shapes
  match what's passed, and the Tailwind class strings were checked for
  the same-specificity override pitfall (two plain, non-hover classes
  setting the same CSS property) that would silently not apply — see
  the comment in `SkillCard.astro` explaining why primary/support
  styling only uses non-conflicting additions (border-style, hover
  variants) rather than trying to override `Card.astro`'s base border
  color directly.

**This has not been run through `astro check` or an actual browser.**
Before treating Phase 04 as done for real, please run `npm install`
(in an environment with registry access) and `npm run build` /
`npm run dev` locally and eyeball the Skills section, especially:
the two-column dashboard panel on mobile (it should stack, not
overflow), the primary-card grid at `lg` (4 across), and the "How it
connects" sequence wrapping correctly on narrow screens.

## Verification (as of Phase 06)

Same limitation as Phases 04–05: this sandbox still has **no npm
registry access** (`npm install` fails with `403 Forbidden`, e.g. on
fetching `zwitch@2.0.4` this time), so `npm run build` (`astro check &&
astro build`) could not be run or verified.

What was checked by hand instead:

- `src/types/index.ts`: grepped the whole `src/` tree for
  `achievement.date`, `achievement.issuer`, and any other reference to
  the old `Achievement` shape before replacing it — the only prior
  consumers were the (until now empty) `achievements.ts` and
  `AchievementCard.astro`, both rewritten in this phase, so this was a
  clean replacement, not a breaking change. `EducationEntry`'s new
  fields are all optional, so `About.astro` (unedited) still type-checks
  against the extended type.
- `src/data/education.ts` / `src/data/achievements.ts`: every field
  checked against the brief's verified list; confirmed no ranking,
  issuer, certificate number, or date is present anywhere that wasn't
  explicitly given (the MikroTik olympiad entry states participation
  only, matching the brief's explicit "do not invent the ranking"
  instruction).
- Re-read `EducationCard.astro`, `Education.astro`,
  `FeaturedAchievementCard.astro`, `AchievementCard.astro`, and
  `Achievements.astro` for import-path correctness (`@/types`,
  `@components/*`, `@data/*`, `@/lib/ui`), and manually counted
  `{`/`}` and JSX-tag balance in each (script-checked — all balanced).
- Confirmed `FeaturedAchievementCard.astro`'s permanent left-accent
  border is applied to a **fresh inner `div`**, not the `Card` root,
  to avoid the same base-vs-utility border-color specificity race
  that `SkillCard.astro` (Phase 04) explicitly documents and avoids —
  this was checked by inspection, not a real browser render.
- Confirmed the section `index` props read `01` through `07` in
  render order after inserting Education (`About` → `Journey` →
  `Education` → `Skills` → `Projects` → `Achievements` → `Contact`),
  and that `Nav.astro`/`ProgressRail.astro` needed no code changes
  since both already consume `navItems`/section IDs generically.

**Not run: `astro check`, `astro build`, or any real browser/viewport
check.** Before treating Phase 06 as done for real, please run `npm
install` (with registry access) and `npm run build` / `npm run dev`,
then check: the Education section's two-column layout on desktop vs.
stacked on mobile, the PKL panel's wording reads clearly as
unconfirmed, the featured achievement card's numeral/accent-bar layout
at small widths, and the Achievements section's three-tier layout
(featured → grid → certifications → medal chips) not overflowing on
narrow screens.

## Verification (as of Phase 05)

Same limitation as Phase 04: this sandbox still had **no npm registry
access** (`npm install` fails with the same `403 Forbidden`), so
`npm run build` could not be run or verified this time either.

What was checked by hand instead:

- `src/types/index.ts`: confirmed `Project`/`ProjectStatus` were only
  ever consumed by `src/data/projects.ts` and
  `src/components/cards/ProjectCard.astro` before this phase (both
  rewritten here), so extending the type and renaming `stack` →
  `technologies` doesn't leave any stale references — grepped the
  whole `src/` tree for `.stack` / bare `project.year` to confirm.
- `src/data/projects.ts`: both entries checked field-by-field against
  the brief — Smart-Lab's `team`/`contribution`/`status`/`links.live`
  values match exactly what was given, no invented dates or metrics on
  either entry.
- `ArchitectureFlow.astro`, `ProjectCard.astro`,
  `FeaturedProjectCard.astro`, `Projects.astro`: import paths checked
  against existing aliases; every conditional block (`contribution`,
  `architecture`, `links`, the `<details>` story) checked against
  which fields Automatic Gate actually has, so it renders cleanly with
  a partially-filled entry, not just the fully-filled Smart-Lab one.
  The named-group `<details>`/`group-open/details:` pattern used for
  the "Technical story" disclosure was checked against the installed
  Tailwind version (`^3.4.13`, which supports the `open`/`group-open`
  variant) — not run in a real browser, so still worth a manual click
  test.
- Re-read `src/lib/ui.ts` and its two importers to confirm the
  extracted class strings are byte-for-byte what `SkillCard.astro` had
  inline before, so Phase 04's Skills section is not visually affected
  by this refactor.

**Not run: `astro check`, `astro build`, or any real browser/viewport
check.** Before treating Phase 05 as done for real, please run
`npm install` (with registry access) and `npm run build` / `npm run
dev`, then check: the Smart-Lab featured card's two-column layout on
desktop vs. stacked on mobile, the "Technical story" disclosure
opening/closing, the vertical "System overview" flow not overflowing
on narrow screens, and the Automatic Gate card's horizontal flow
wrapping correctly.

## Verification (as of Phase 09)

Unlike every prior phase, this sandbox session **did** have npm
registry access:

- `npm install`: succeeded (448 packages).
- `npx tsc` was first run directly (standalone `tsconfig`, real
  project path aliases) against `src/data/aiKnowledge.ts`,
  `src/lib/aiEngine.ts`, `src/types/index.ts`, and every data file
  they import — **0 errors** — and separately against the extracted
  client `<script>` block from `AiAssistant.astro` (with `DOM` lib
  enabled) — **0 errors**.
- **`npm run build` (`astro check && astro build`) was run for real
  and succeeded**: `astro check` reported **0 errors, 0 warnings, 0
  hints across 56 files**, and `astro build` generated both
  `/index.html` and `/ai/index.html` in `dist/`. This is the first
  phase where the full real build pipeline — not just a standalone
  `tsc` pass — has actually been exercised.
- The built `dist/index.html` was grepped to confirm the `id="ai"`
  section, the "Ask Gill AI" heading, the "GILL AI" terminal title,
  the seeded greeting text, and the Hero button's `href="#ai"` all
  render as expected.
- The rule-based engine itself was exercised directly (via `tsx`,
  outside the browser) against every example question named in the
  brief's "GOAL" and "HALLUCINATION PREVENTION"/"SMART-LAB KNOWLEDGE"
  sections, including the two-turn follow-up example ("What project
  did he build?" → "What did he do in the first one?"). All responses
  matched the required wording/behavior: the exact employer and PKL
  fallback sentences, the "reached a completed development/prototype
  stage… not officially deployed…" Smart-Lab answer (never a
  deployment claim), the team-vs-personal-contribution split on
  Smart-Lab, an honest "I don't have Gill's contact information
  available yet." (since `profile.socials` still holds Phase 01
  placeholders), and a polite scope-redirect for an unrelated question
  ("What's the capital of France?").
- Manually counted `{}`/`()`/`[]` balance in every new/modified `.astro`
  and `.ts` file (script-checked — all balanced), and grepped the
  whole `src/` tree for `"coming soon"`/`"not deployed yet"` to
  confirm no stale placeholder copy was left behind after `ai.astro`
  and `terminal.ts`'s `ai` command were updated.
- Confirmed by inspection that the only DOM-writing calls in
  `AiAssistant.astro`'s script are `textContent`/`createTextNode`/
  `createElement`/`classList` — no `innerHTML`, no `eval`, no
  `new Function` — and that no API key, secret, or `.env` value is
  referenced anywhere in `src/` (grepped for `API_KEY`, `OPENAI`,
  `ANTHROPIC`, `GEMINI` — no matches outside this file's own
  documentation of what *not* to do).

**Not done:** no real browser/keyboard interaction test and no manual
mobile-viewport check (no headless browser available in this
environment). Before treating Phase 09 as done for real, please run
`npm run dev` and manually check: the quick-question chips actually
populate and submit; the message log scrolls instead of growing the
page on a long conversation; the Send button/input disable correctly
while "Generating response…" is showing; and the chat log wraps long
answers without horizontal overflow on a narrow (~375px) viewport.

## Verification (as of Phase 08)

Same limitation as Phases 04–07: this sandbox still has **no npm
registry access** (`npm install` fails with `403 Forbidden` fetching
`zwitch@2.0.4`), so `node_modules` was not present and `npm run build`
(`astro check && astro build`) could not be run end-to-end this
session either.

What was checked instead, specifically because a real type-checker was
reachable this time even without `node_modules`:

- Ran the actual TypeScript compiler (`tsc`, found on `PATH`) directly
  against `src/data/terminal.ts` plus every data/type file it imports
  (`profile.ts`, `journey.ts`, `skills.ts`, `projects.ts`,
  `experience.ts`, `education.ts`, `achievements.ts`,
  `types/index.ts`), using a standalone `tsconfig` that reproduces the
  project's real path aliases (`@/*`, `@data/*`, etc.) — **0 errors**.
  This is a genuine compile check of the new module's types and
  imports, not a hand-review.
- Extracted the client-side `<script>` block from
  `InteractiveTerminal.astro` and ran the same `tsc` check against it
  in isolation (with `DOM` lib enabled, since it's browser code) —
  **0 errors**. This confirms the DOM API usage (`HTMLInputElement`/
  `HTMLFormElement` casts, `querySelector` types, etc.) and the import
  of `runCommand`/`commandNames` from `@data/terminal` are all valid.
- Manually counted `{}`/`()`/`[]` balance in `terminal.ts`,
  `InteractiveTerminal.astro`, and the rewritten `HeroTerminal.astro`
  (script-checked — all balanced).
- Grepped `src/` to confirm `TerminalLine.astro`/`TypedText.astro` are
  still imported and used (by `src/pages/ai.astro`) after
  `HeroTerminal.astro` stopped using them — confirming they weren't
  silently orphaned or broken by this phase's change.
- Confirmed by inspection that the only `innerHTML` write in the new
  code is `clearOutput()`'s `output.innerHTML = ""` (clearing, never
  inserting), and that every other piece of dynamic text — command
  echoes, command output, autocomplete candidate lists — goes through
  `element.textContent = text`, never through template strings
  concatenated into `innerHTML`. Confirmed no `eval`, `new Function`,
  or dynamic `<script>` construction exists anywhere in the new files.
- Confirmed `profile.socials`' current placeholder values (`href="#"`
  and the `mailto:hello@example.com` TODO address) are correctly
  detected as non-real by `terminal.ts`'s `contact` command, so it
  prints "Contact information will be available soon." rather than the
  placeholder email — verified by tracing the `isRealSocial()` logic
  against the literal values in `src/data/profile.ts` by hand.

**Not run: `astro check`, `astro build`, `npm run dev`, or any real
browser/keyboard interaction test.** The `tsc`-based checks above are
a real compiler pass on the new TypeScript, which is stronger than the
by-hand review used in Phases 04–07, but they do not substitute for
Astro's own `astro check` (which also validates `.astro` template
syntax/prop types) or an actual browser. Before treating Phase 08 as
done for real, please run `npm install` (with registry access) and
`npm run build` / `npm run dev`, then manually check: every command
listed in `help` actually runs and prints sensible output; `↑`/`↓`
history navigation and `Ctrl+L` clearing work in a real browser;
`Tab`-completion on a partial command like `pro` completes to
`projects`; the terminal's `max-h-72` output area scrolls instead of
pushing the page layout on both desktop and a narrow mobile viewport;
and a screen reader announces new output lines from the `aria-live`
region without also re-announcing the whole log on every keystroke.

## Verification (as of Phase 07)

Same limitation as Phases 04–06: this sandbox still has **no npm
registry access** (`npm install` fails with `403 Forbidden` fetching
`zwitch@2.0.4`; a retry specifically for `typescript`/`astro` also hit
`403` on `astro`), so `npm run build` (`astro check && astro build`)
could not be run or verified this session either.

What was checked by hand instead:

- `src/types/index.ts`: the four new types (`ExperienceCategoryGroup`,
  `ExperienceType`, `ExperienceEntry`, `ExperienceCategoryMeta`) are
  purely additive — grepped the whole `src/` tree to confirm nothing
  else references them yet outside the new files, so there's no
  breaking change to an existing consumer.
- `src/data/experience.ts`: every one of the 13 entries checked
  against the brief's exact list (nothing added, nothing dropped);
  confirmed no company, client, salary, job title, certification, or
  exact date appears anywhere in the file; confirmed
  `relatedProjectIds` only references IDs that actually exist in
  `src/data/projects.ts` (`smart-lab`, `automatic-gate`).
- `src/components/cards/ExperienceCard.astro` and
  `src/components/sections/Experience.astro`: import paths checked
  against the existing aliases (`@/types`, `@components/*`,
  `@data/*`, `@/lib/ui`); manually counted brace and JSX-tag balance
  in both files (script-checked — balanced). Confirmed
  `ExperienceCard.astro`'s related-projects lookup degrades cleanly
  (renders nothing) if `relatedProjectIds` is empty or a referenced ID
  is ever removed from `projects.ts`.
- Confirmed the section `index` props read `01` through `08` in
  render order after inserting Experience
  (About → Journey → Education → Skills → Projects → Experience →
  Achievements → Contact), and that `Nav.astro`/`ProgressRail.astro`
  needed no code changes since both already consume
  `navItems`/section IDs generically — same as every prior section
  addition.
- Confirmed the category-filter `<script>` only toggles a `hidden`
  class (no animation), and that the grid's
  `motion-safe:animate-fade-up` entrance is the same keyframe already
  used by `AchievementCard.astro`, already covered by the global
  `prefers-reduced-motion` rule in `global.css` — no new
  reduced-motion handling was needed.
- Confirmed the only PKL-related content on the whole site is still
  the single `pklOpportunity` panel in `Education.astro` — grepped for
  "PKL"/"internship"/"Hotel Sunshine" across `src/` to confirm
  `Experience.astro` and `experience.ts` don't mention it.

**Not run: `astro check`, `astro build`, or any real browser/viewport
check.** Before treating Phase 07 as done for real, please run `npm
install` (with registry access) and `npm run build` / `npm run dev`,
then check: the approach-flow and networking-spotlight panels on
mobile (should stack, not overflow), the category filter actually
shows/hides the right cards for each of the five groups, the
experience grid at `sm`/`lg` breakpoints, and the "See Smart-Lab /
Automatic Gate" links on the Website Development and Arduino/ESP32
cards scrolling to the Projects section correctly.
