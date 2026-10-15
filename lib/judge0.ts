import { env, isJudgeConfigured } from "./env";
import type { TestCase } from "./models";

/**
 * Code judge client — resilient, keyless by default.
 *
 * Primary: Judge0 CE (free public `https://ce.judge0.com`, or a RapidAPI key, or
 * a self-hosted instance). Backup: Wandbox (also free & keyless). If the
 * primary judge is unreachable or rate-limited, the backup runs the code, so
 * participants can always be checked.
 *
 * Resilience features:
 *  - a process-wide concurrency gate so a burst of runs doesn't flood the judge;
 *  - retry with exponential backoff on 429 / 5xx / network errors;
 *  - automatic failover to Wandbox;
 *  - callers can distinguish "judge unavailable" from "your code is wrong".
 *
 * IMPORTANT: never surface raw compiler output to players. The public API layer
 * collapses results to pass/fail only. Raw fields are returned here so the
 * organizer console can inspect them.
 */

export type JudgeStatus =
  | "accepted"
  | "wrong_answer"
  | "compilation_error"
  | "runtime_error"
  | "time_limit_exceeded"
  | "internal_error"
  | "not_configured"
  | "unknown";

export type JudgeRunResult = {
  status: JudgeStatus;
  statusId: number;
  stdout: string;
  stderr: string;
  compileOutput: string;
  time?: string;
  memory?: number;
  ok: boolean;
  /** Which engine produced the result. */
  engine?: "judge0" | "wandbox";
};

export type TestRunResult = {
  name: string;
  ok: boolean;
  status: JudgeStatus;
  /** Only populated for organizers. */
  expected?: string;
  got?: string;
  stderr?: string;
};

const STATUS_BY_ID: Record<number, JudgeStatus> = {
  3: "accepted",
  4: "wrong_answer",
  5: "time_limit_exceeded",
  6: "compilation_error",
  7: "runtime_error",
  8: "runtime_error",
  9: "runtime_error",
  10: "runtime_error",
  11: "runtime_error",
  12: "runtime_error",
  13: "internal_error",
  14: "internal_error",
};

function mapStatus(id: number | undefined): JudgeStatus {
  if (!id) return "unknown";
  return STATUS_BY_ID[id] ?? "unknown";
}

function b64encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ── process-wide concurrency gates ──────────────────────── */

function makeGate(max: number) {
  let active = 0;
  const waiters: (() => void)[] = [];
  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (active < max) {
      active += 1;
    } else {
      await new Promise<void>((resolve) => waiters.push(resolve));
      active += 1;
    }
    try {
      return await fn();
    } finally {
      active -= 1;
      const next = waiters.shift();
      if (next) next();
    }
  };
}

/** Protects the primary Judge0 instance from bursts of runs/submits. */
const withPrimarySlot = makeGate(Math.max(1, env.judge0.concurrencyMax));
/** Wandbox tolerates only a couple of simultaneous requests at once. */
const withFallbackSlot = makeGate(Math.max(1, env.judge0.fallbackConcurrencyMax));

/* ── primary judge: Judge0 CE ────────────────────────────── */

type RawJudgeResponse = {
  status?: { id?: number; description?: string };
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  time?: string | null;
  memory?: number | null;
};

const NOT_CONFIGURED: JudgeRunResult = {
  status: "not_configured",
  statusId: 0,
  stdout: "",
  stderr: "",
  compileOutput: "",
  ok: false,
};

function internalError(detail = ""): JudgeRunResult {
  return {
    status: "internal_error",
    statusId: 0,
    stdout: "",
    stderr: detail,
    compileOutput: "",
    ok: false,
  };
}

async function callJudge0(
  source: string,
  stdin: string,
  opts: { timeLimitSeconds?: number; base64?: boolean },
): Promise<JudgeRunResult> {
  const base64 = opts.base64 ?? env.judge0.mode === "public";
  const query = new URLSearchParams({
    base64_encoded: String(base64),
    wait: "true",
    fields: "*",
  });

  const body = {
    source_code: base64 ? b64encode(source) : source,
    language_id: env.judge0.cLanguageId,
    stdin: base64 ? b64encode(stdin) : stdin,
    cpu_time_limit: opts.timeLimitSeconds ?? 4,
    wall_time_limit: (opts.timeLimitSeconds ?? 4) + 3,
    memory_limit: 128000,
  };

  const headers: Record<string, string> = { "content-type": "application/json" };
  if (env.judge0.mode === "rapidapi") {
    headers["X-RapidAPI-Key"] = env.judge0.key;
    headers["X-RapidAPI-Host"] = env.judge0.host;
  } else if (env.judge0.authToken) {
    headers["X-Auth-Token"] = env.judge0.authToken;
  }

  let lastError = "judge unavailable";
  for (let attempt = 0; attempt < 3; attempt++) {
    let res: Response;
    try {
      res = await fetch(`${env.judge0.url}/submissions?${query.toString()}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      });
    } catch (e) {
      lastError = e instanceof Error ? e.message : "network error";
      if (attempt < 2) {
        await sleep(300 * 2 ** attempt);
        continue;
      }
      return internalError(lastError);
    }

    // Retry only on transient conditions.
    if (res.status === 429 || res.status >= 500) {
      lastError = `judge http ${res.status}`;
      if (attempt < 2) {
        await sleep(400 * 2 ** attempt);
        continue;
      }
      return internalError(lastError);
    }
    if (!res.ok) return internalError(`judge http ${res.status}`);

    let data: RawJudgeResponse;
    try {
      data = (await res.json()) as RawJudgeResponse;
    } catch {
      lastError = "bad judge response";
      if (attempt < 2) {
        await sleep(300 * 2 ** attempt);
        continue;
      }
      return internalError(lastError);
    }

    const decode = (v: string | null | undefined) =>
      base64 ? Buffer.from(v ?? "", "base64").toString("utf8") : (v ?? "");
    const statusId = data.status?.id ?? 0;

    return {
      status: mapStatus(statusId),
      statusId,
      stdout: decode(data.stdout),
      stderr: decode(data.stderr) || decode(data.message),
      compileOutput: decode(data.compile_output),
      time: data.time ?? undefined,
      memory: data.memory ?? undefined,
      ok: statusId === 3,
      engine: "judge0",
    };
  }

  return internalError(lastError);
}

/* ── backup judge: Wandbox ───────────────────────────────── */

type RawWandboxResponse = {
  status?: string;
  signal?: string;
  compiler_output?: string;
  compiler_error?: string;
  program_output?: string;
  program_error?: string;
  program_message?: string;
};

async function callWandbox(
  source: string,
  stdin: string,
): Promise<JudgeRunResult | null> {
  if (!env.judge0.fallbackEnabled || !env.judge0.wandboxUrl) return null;
  const payload = JSON.stringify({
    compiler: env.judge0.wandboxCompiler,
    code: source,
    stdin,
    "compiler-option-raw": "",
    "runtime-option-raw": "",
  });

  // Wandbox aggressively rate-limits (429); back off and retry a few times.
  for (let attempt = 0; attempt < 4; attempt++) {
    let res: Response;
    try {
      res = await fetch(env.judge0.wandboxUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: payload,
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      if (attempt < 3) {
        await sleep(400 * 2 ** attempt);
        continue;
      }
      return null;
    }

    if (res.status === 429) {
      if (attempt < 3) {
        await sleep(500 * 2 ** attempt);
        continue;
      }
      return null;
    }
    if (!res.ok) return null;

    let data: RawWandboxResponse;
    try {
      data = (await res.json()) as RawWandboxResponse;
    } catch {
      if (attempt < 3) {
        await sleep(400 * 2 ** attempt);
        continue;
      }
      return null;
    }

    if (data.compiler_error) {
      return {
        status: "compilation_error",
        statusId: 6,
        stdout: data.program_output ?? "",
        stderr: data.compiler_error,
        compileOutput: data.compiler_error,
        ok: false,
        engine: "wandbox",
      };
    }

    const out = data.program_output ?? "";
    const err = data.program_error ?? "";
    const signal = data.signal ?? "";
    if (err || signal) {
      const timedOut = /time|kill|sigkill|alarm/i.test(`${signal} ${err}`);
      return {
        status: timedOut ? "time_limit_exceeded" : "runtime_error",
        statusId: timedOut ? 5 : 7,
        stdout: out,
        stderr: err,
        compileOutput: "",
        ok: false,
        engine: "wandbox",
      };
    }

    return {
      status: "accepted",
      statusId: 3,
      stdout: out,
      stderr: "",
      compileOutput: "",
      ok: true,
      engine: "wandbox",
    };
  }

  return null;
}

/* ── public API ──────────────────────────────────────────── */

export async function runC(
  source: string,
  stdin = "",
  opts: { timeLimitSeconds?: number; base64?: boolean } = {},
): Promise<JudgeRunResult> {
  if (!isJudgeConfigured()) return NOT_CONFIGURED;

  const primary = await withPrimarySlot(() => callJudge0(source, stdin, opts));
  if (primary.status !== "internal_error") return primary;

  // Primary failed — try the free backup judge (best-effort, low concurrency).
  const backup = await withFallbackSlot(() => callWandbox(source, stdin));
  return backup ?? primary;
}

function normalise(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\s+$/g, "").trim();
}

function toTestResult(
  test: TestCase,
  run: JudgeRunResult,
): TestRunResult {
  const ok =
    run.statusId === 3 && normalise(run.stdout) === normalise(test.expectedOutput);
  return {
    name: test.name,
    ok,
    status: ok ? "accepted" : run.status === "accepted" ? "wrong_answer" : run.status,
    expected: test.expectedOutput,
    got: run.stdout,
    stderr: run.stderr || run.compileOutput,
  };
}

/**
 * Run a list of test cases against the source.
 *
 * The first case runs alone so a compilation error short-circuits (most edits
 * during the coding phase don't compile — no point spending more judge calls).
 * Once it runs, the remaining cases run concurrently. When the judge is down
 * for every case, `infrastructureError` is true so callers can show a friendly
 * "checker busy, try again" instead of blaming the participant's code.
 */
export async function runCTests(
  source: string,
  tests: TestCase[],
  opts: { timeLimitSeconds?: number } = {},
): Promise<{
  results: TestRunResult[];
  compileFailed: boolean;
  passed: number;
  total: number;
  infrastructureError: boolean;
}> {
  if (tests.length === 0) {
    return { results: [], compileFailed: false, passed: 0, total: 0, infrastructureError: false };
  }

  const [first, ...rest] = tests;
  const firstRun = await runC(source, first.input, opts);

  if (
    firstRun.status === "compilation_error" ||
    firstRun.status === "not_configured" ||
    firstRun.status === "internal_error"
  ) {
    const compileFailed = firstRun.status === "compilation_error";
    const results = tests.map((test, i) =>
      i === 0
        ? toTestResult(test, firstRun)
        : { name: test.name, ok: false, status: firstRun.status },
    );
    return {
      results,
      compileFailed,
      passed: 0,
      total: tests.length,
      infrastructureError: firstRun.status === "internal_error",
    };
  }

  const restRuns = await Promise.all(rest.map((t) => runC(source, t.input, opts)));
  const results = [toTestResult(first, firstRun), ...rest.map((t, i) => toTestResult(t, restRuns[i]))];
  const passed = results.filter((r) => r.ok).length;

  return { results, compileFailed: false, passed, total: tests.length, infrastructureError: false };
}
