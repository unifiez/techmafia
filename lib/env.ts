/**
 * Centralised environment access.
 * Never read `process.env` directly elsewhere — go through `env`.
 */

function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const RAW_JUDGE_KEY = (process.env.JUDGE0_RAPIDAPI_KEY ?? "").trim();
const RAW_JUDGE_HOST = (process.env.JUDGE0_RAPIDAPI_HOST ?? "judge0-ce.p.rapidapi.com").trim();
const RAW_JUDGE_URL = (process.env.JUDGE0_API_URL ?? "").trim();
const RAW_JUDGE_PUBLIC_URL = (process.env.JUDGE0_PUBLIC_URL ?? "https://ce.judge0.com").trim();

/** Free, keyless public Judge0 CE instance (rate-limited, good for events). */
const DEFAULT_PUBLIC_JUDGE = "https://ce.judge0.com";

/**
 * Judge provider selection:
 *  - if `JUDGE0_RAPIDAPI_KEY` is set → use the RapidAPI-hosted Judge0;
 *  - otherwise → use the free public Judge0 CE instance (no key required).
 * Any Judge0-compatible URL works via `JUDGE0_PUBLIC_URL` / `JUDGE0_AUTH_TOKEN`.
 */
const useRapidApi = RAW_JUDGE_KEY.length > 0;
const judgeUrl = (useRapidApi
  ? RAW_JUDGE_URL || `https://${RAW_JUDGE_HOST}`
  : RAW_JUDGE_PUBLIC_URL || DEFAULT_PUBLIC_JUDGE
).replace(/\/+$/, "");

export const env = {
  mongodbUri: process.env.MONGODB_URI ?? "",
  mongodbDb: process.env.MONGODB_DB ?? "techmafia",

  jwtSecret:
    process.env.JWT_SECRET ?? "tech-mafia-insecure-dev-secret-change-me",

  organizerPasscode: process.env.ORGANIZER_PASSCODE ?? "mafia-admin",

  judge0: {
    mode: useRapidApi ? ("rapidapi" as const) : ("public" as const),
    url: judgeUrl,
    host: RAW_JUDGE_HOST,
    key: RAW_JUDGE_KEY,
    /** Optional `X-Auth-Token` for a self-hosted Judge0 instance. */
    authToken: (process.env.JUDGE0_AUTH_TOKEN ?? "").trim(),
    cLanguageId: num(process.env.JUDGE0_C_LANGUAGE_ID, 50),
    /** Max simultaneous outbound judge requests (protects the public instance). */
    concurrencyMax: num(process.env.JUDGE_MAX_CONCURRENCY, 8),
    /** Free keyless backup judge (Wandbox), used when Judge0 is unavailable. */
    fallbackEnabled: (process.env.JUDGE_FALLBACK ?? "true") !== "false",
    /** Wandbox only tolerates ~2 simultaneous requests before it 429s. */
    fallbackConcurrencyMax: num(process.env.JUDGE_FALLBACK_CONCURRENCY, 2),
    wandboxUrl: (
      process.env.JUDGE_WANDBOX_URL ?? "https://wandbox.org/api/compile.json"
    ).trim(),
    wandboxCompiler: (process.env.JUDGE_WANDBOX_COMPILER ?? "gcc-13.2.0").trim(),
  },

  heartbeatTimeoutSeconds: num(process.env.HEARTBEAT_TIMEOUT_SECONDS, 20),
} as const;

export function isDbConfigured(): boolean {
  return env.mongodbUri.trim().length > 0;
}

/**
 * The judge is available whenever we have a URL — the public instance needs no
 * key, so code checking works out of the box.
 */
export function isJudgeConfigured(): boolean {
  return env.judge0.url.trim().length > 0;
}
