import { env, isJudgeConfigured } from "./env";
import type { TestCase } from "./models";

/**
 * Judge0 CE (RapidAPI) client.
 *
 * IMPORTANT: never surface raw compiler output to players. The public API
 * layer collapses results to pass/fail only. Raw fields are returned here so
 * the organizer console can inspect them.
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

type RawJudgeResponse = {
  status?: { id?: number; description?: string };
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  time?: string | null;
  memory?: number | null;
};

export async function runC(
  source: string,
  stdin = "",
  opts: { timeLimitSeconds?: number; base64?: boolean } = {},
): Promise<JudgeRunResult> {
  if (!isJudgeConfigured()) {
    return {
      status: "not_configured",
      statusId: 0,
      stdout: "",
      stderr: "",
      compileOutput: "",
      ok: false,
    };
  }

  const base64 = opts.base64 ?? false;
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

  let res: Response;
  try {
    res = await fetch(`${env.judge0.url}/submissions?${query.toString()}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": env.judge0.key,
        "X-RapidAPI-Host": env.judge0.host,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return {
      status: "internal_error",
      statusId: 0,
      stdout: "",
      stderr: "",
      compileOutput: "",
      ok: false,
    };
  }

  if (!res.ok) {
    return {
      status: "internal_error",
      statusId: 0,
      stdout: "",
      stderr: `judge http ${res.status}`,
      compileOutput: "",
      ok: false,
    };
  }

  const data = (await res.json()) as RawJudgeResponse;
  const decode = (v: string | null | undefined) =>
    base64 ? Buffer.from(v ?? "", "base64").toString("utf8") : (v ?? "");

  const statusId = data.status?.id ?? 0;
  const status = mapStatus(statusId);

  return {
    status,
    statusId,
    stdout: decode(data.stdout),
    stderr: decode(data.stderr) || decode(data.message),
    compileOutput: decode(data.compile_output),
    time: data.time ?? undefined,
    memory: data.memory ?? undefined,
    ok: statusId === 3,
  };
}

function normalise(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\s+$/g, "").trim();
}

/**
 * Run a list of test cases against the source.
 * Compilation errors short-circuit: every remaining test is marked failed
 * without spending more Judge0 calls.
 */
export async function runCTests(
  source: string,
  tests: TestCase[],
  opts: { timeLimitSeconds?: number } = {},
): Promise<{ results: TestRunResult[]; compileFailed: boolean; passed: number; total: number }> {
  const results: TestRunResult[] = [];
  let compileFailed = false;

  for (const test of tests) {
    const run = await runC(source, test.input, opts);

    if (run.status === "compilation_error" || run.status === "not_configured") {
      compileFailed = run.status === "compilation_error";
      results.push({
        name: test.name,
        ok: false,
        status: run.status,
        expected: test.expectedOutput,
        got: run.stdout,
        stderr: run.compileOutput || run.stderr,
      });
      // Remaining tests can't pass if it doesn't compile.
      for (const rest of tests.slice(results.length)) {
        results.push({ name: rest.name, ok: false, status: run.status });
      }
      break;
    }

    const ok =
      run.statusId === 3 && normalise(run.stdout) === normalise(test.expectedOutput);

    results.push({
      name: test.name,
      ok,
      status: ok ? "accepted" : run.status === "accepted" ? "wrong_answer" : run.status,
      expected: test.expectedOutput,
      got: run.stdout,
      stderr: run.stderr || run.compileOutput,
    });
  }

  const passed = results.filter((r) => r.ok).length;
  return { results, compileFailed, passed, total: tests.length };
}
