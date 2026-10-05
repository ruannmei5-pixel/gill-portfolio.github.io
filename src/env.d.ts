/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /**
   * Server-only. Read exclusively in `src/pages/api/chat.ts`. Never
   * prefix this with `PUBLIC_` — that prefix is what makes an Astro
   * env var reach the client bundle, which must never happen here.
   */
  readonly AI_API_KEY?: string;
  /** Server-only, optional. Overrides the default model in src/pages/api/chat.ts. */
  readonly AI_MODEL?: string;
  /** Server-only, optional. "nvidia" | "anthropic". Kalau kosong, ditebak dari awalan key ("nvapi-" = nvidia). */
  readonly AI_PROVIDER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}