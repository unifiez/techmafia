import { Problem, type TestCase } from "@/lib/models";
import { resolveMatch, validateAndApplyCode } from "@/lib/game/service";
import { fail, ok, readJson } from "@/lib/http";
import { runCTests } from "@/lib/judge0";
import { isJudgeConfigured } from "@/lib/env";

type Body = { code?: string };

const RUN_PHASES = ["coding", "attack", "repair", "testing"] as const;

/**
 * Run the PUBLIC test cases against the current (or just-saved) code.
 * The response NEVER reveals compilation errors, which test failed, or why —
 * only a pass count and a generic message.
 */
export async function POST(req: Request) {
  const r = await resolveMatch();
  if (!r.ok) return fail(r.message, r.status);
  const { user, match, role } = r;

  if (!RUN_PHASES.includes(match.phase as (typeof RUN_PHASES)[number])) {
    return fail("Test runs are not available during this phase.", 409);
  }

  const body = await readJson<Body>(req).catch(() => null);
  if (body?.code && role === "coder" && body.code !== match.code.current) {
    const applied = validateAndApplyCode(match, String(user._id), role, body.code);
    if (!applied.ok) return fail(applied.message ?? "Invalid edit", 409);
  }

  if (!isJudgeConfigured()) {
    return ok({
      passed: 0,
      total: 0,
      status: "unavailable",
      message: "The code checker is not configured yet. Please inform the organizer.",
    });
  }

  const problem = await Problem.findOne({ key: match.problemKey }).lean();
  if (!problem) return fail("Problem not found", 404);

  const tests: TestCase[] = problem.publicTests ?? [];
  const { passed, total, compileFailed, infrastructureError } = await runCTests(
    match.code.current,
    tests,
    { timeLimitSeconds: 4 },
  );

  // Judge unreachable (both engines) — don't blame the participant's code.
  if (infrastructureError) {
    return ok({
      passed: 0,
      total: tests.length,
      status: "busy",
      message: "The code checker is busy right now. Please try again in a few seconds.",
    });
  }

  const allPassed = total > 0 && passed === total;
  const message = allPassed
    ? "All public test cases passed."
    : "There is a problem with your code. Fix it and try again.";

  match.submissions.push({
    userId: user._id,
    kind: "run",
    passed,
    total,
    status: allPassed ? "ok" : compileFailed ? "error" : "fail",
    message,
    at: new Date(),
  });

  // The baseline is considered "clean" if it passed public tests during coding.
  if (match.phase === "coding" && allPassed) {
    match.baselineClean = true;
  }

  await match.save();
  return ok({ passed, total, status: allPassed ? "ok" : "fail", message });
}
