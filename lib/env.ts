/**
 * Centralised environment access.
 * Never read `process.env` directly elsewhere — go through `env`.
 */

function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const env = {
  mongodbUri: process.env.MONGODB_URI ?? "",
  mongodbDb: process.env.MONGODB_DB ?? "techmafia",

  jwtSecret:
    process.env.JWT_SECRET ?? "tech-mafia-insecure-dev-secret-change-me",

  organizerPasscode: process.env.ORGANIZER_PASSCODE ?? "mafia-admin",

  judge0: {
    url: (process.env.JUDGE0_API_URL ?? "https://judge0-ce.p.rapidapi.com").replace(
      /\/+$/,
      "",
    ),
    host: process.env.JUDGE0_RAPIDAPI_HOST ?? "judge0-ce.p.rapidapi.com",
    key: process.env.JUDGE0_RAPIDAPI_KEY ?? "",
    cLanguageId: num(process.env.JUDGE0_C_LANGUAGE_ID, 50),
  },

  heartbeatTimeoutSeconds: num(process.env.HEARTBEAT_TIMEOUT_SECONDS, 20),
} as const;

export function isDbConfigured(): boolean {
  return env.mongodbUri.trim().length > 0;
}

export function isJudgeConfigured(): boolean {
  return env.judge0.key.trim().length > 0;
}
