import type { AiAnswer, ChatMessage } from "@/types";

/**
 * Gill AI — browser-side network client.
 *
 * ARCHITECTURE NOTE (real-backend upgrade): this file used to *be*
 * the whole assistant (a local rule-based matcher running in the
 * visitor's browser). That logic still exists — see
 * `src/lib/localAiEngine.ts` — but it now runs on the server as the
 * no-API-key fallback inside `POST /api/chat`
 * (`src/pages/api/chat.ts`).
 *
 * This module is the one thing that changed shape for
 * `AiAssistant.astro`: instead of matching intent locally, it POSTs
 * the visitor's full conversation so far to `/api/chat` and returns
 * whatever the server answers. No AI provider key lives here or
 * anywhere else in browser-shipped code — only `fetch` to our own
 * same-origin endpoint.
 */

const CHAT_ENDPOINT = "/api/chat";

// Generous, but bounded — a request that hangs forever (dead
// provider, network hiccup) must still resolve into the same
// "Gill AI is having trouble" retry state the UI already has for any
// other failure, rather than leaving the visitor staring at the
// thinking animation indefinitely.
const REQUEST_TIMEOUT_MS = 25_000;

/**
 * Sends the full message history to the server and returns the next
 * assistant turn. Throws on any non-success outcome (network failure,
 * timeout, non-2xx response, malformed body) — `AiAssistant.astro`'s
 * existing `catch` block turns that into the friendly
 * "Gill AI is having trouble connecting" message with a Retry button;
 * this function never needs to know about that UI itself.
 */
export class ChatRequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function sendChatMessage(messages: ChatMessage[]): Promise<AiAnswer> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    // The server never puts anything sensitive in this body (see
    // src/pages/api/chat.ts), but it's still not shown to the
    // visitor directly — only used here to decide to throw.
    throw new ChatRequestError(response.status, `Gill AI request failed with status ${response.status}`);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("Gill AI returned a malformed response");
  }

  if (
    !data ||
    typeof data !== "object" ||
    typeof (data as { text?: unknown }).text !== "string" ||
    !(data as { text: string }).text.trim()
  ) {
    throw new Error("Gill AI returned an empty or malformed response");
  }

  const lang = (data as { lang?: unknown }).lang;
  return {
    text: (data as { text: string }).text,
    lang: lang === "id" ? "id" : "en",
  };
}
