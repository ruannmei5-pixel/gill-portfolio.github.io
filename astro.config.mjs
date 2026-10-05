import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  site: "https://vahleviataraxia.my.id", // TODO: replace with the production domain
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  // Gill AI real-backend upgrade: every existing page stays static/
  // prerendered exactly as before ("hybrid" defaults to static unless
  // a route opts out) — only `src/pages/api/chat.ts` opts into
  // on-demand server rendering via `export const prerender = false`.
  // No other page needed to change for this.
  output: "hybrid",
  adapter: node({
    // "standalone" runs its own Node HTTP server (`node ./dist/server/entry.mjs`)
    // — the simplest option for a generic Node host/VPS. If you deploy to
    // Vercel/Netlify/Cloudflare instead, swap this one adapter package
    // (e.g. `@astrojs/vercel`, `@astrojs/netlify`) — nothing else in the
    // project needs to change.
    mode: "standalone",
  }),
  compressHTML: true,
});
