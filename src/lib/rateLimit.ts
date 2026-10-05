const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

// Ubah angka ini sesuai kuota API-mu.
const PER_IP_PER_MINUTE = 5;
const PER_IP_PER_DAY = 40;
const GLOBAL_PER_DAY = 500;

const hitsByIp = new Map<string, number[]>();
let globalWindow = { start: Date.now(), count: 0 };

export type LimitResult =
  | { ok: true }
  | { ok: false; reason: "ip" | "global"; retryAfterSeconds: number };

function prune(now: number) {
  for (const [ip, hits] of hitsByIp) {
    const fresh = hits.filter((t) => now - t < DAY);
    if (fresh.length) hitsByIp.set(ip, fresh);
    else hitsByIp.delete(ip);
  }
}

export function checkRateLimit(ip: string): LimitResult {
  const now = Date.now();

  if (now - globalWindow.start >= DAY) globalWindow = { start: now, count: 0 };
  if (globalWindow.count >= GLOBAL_PER_DAY) {
    return {
      ok: false,
      reason: "global",
      retryAfterSeconds: Math.ceil((globalWindow.start + DAY - now) / 1000),
    };
  }

  const hits = (hitsByIp.get(ip) ?? []).filter((t) => now - t < DAY);
  const lastMinute = hits.filter((t) => now - t < MINUTE);

  if (lastMinute.length >= PER_IP_PER_MINUTE) {
    return { ok: false, reason: "ip", retryAfterSeconds: Math.ceil((lastMinute[0] + MINUTE - now) / 1000) };
  }
  if (hits.length >= PER_IP_PER_DAY) {
    return { ok: false, reason: "ip", retryAfterSeconds: Math.ceil((hits[0] + DAY - now) / 1000) };
  }

  hits.push(now);
  hitsByIp.set(ip, hits);
  globalWindow.count += 1;

  if (hitsByIp.size > 5000) prune(now); // cegah memori membengkak
  return { ok: true };
}