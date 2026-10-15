import { Problem } from "@/lib/models";
import { resolveMatch, validateAndApplyCode } from "@/lib/game/service";
import { fail, ok, readJson } from "@/lib/http";
import { runCTests } from "@/lib/judge0";
import { isJudgeConfigured } from "@/lib/env";
import { computeResult } from "@/lib/game/finalize";

type Body = { code?: string };

const SUBMIT_PHASES = ["repair", "testing"] as const;

/**
 * Final submission. Runs public + hidden cases server-side. The player only
 * learns whether the submission was ACCEPTED or that "there is a problem".
 * Hidden-test details and compiler output are never returned.
 */
export async function POST(req: Request) {
  const r = await resolveMatch();
  if (!r.ok) return fail(r.message, r.status);
  const { user, match, role } = r;

  if (role !== "coder") return fail("Only the Coder team can submit.", 403);
  if (!SUBMIT_PHASES.includes(match.phase as (typeof SUBMIT_PHASES)[number])) {
    return fail("Final submission is only allowed during the repair/testing phase.", 409);
  }
  if (!isJudgeConfigured()) {
    return fail("The code checker is not configured yet.", 503);
  }

  const body = await readJson<Body>(req).catch(() => null);
  if (body?.code && body.code !== match.code.current) {
    const applied = validateAndApplyCode(match, String(user._id), role, body.code);
    if (!applied.ok) return fail(applied.message ?? "Invalid edit", 409);
  }

  const problem = await Problem.findOne({ key: match.problemKey }).lean();
  if (!problem) return fail("Problem not found", 404);

  const pub = await runCTests(match.code.current, problem.publicTests ?? [], {
    timeLimitSeconds: 4,
  });
  const pubOk = pub.total > 0 && pub.passed === pub.total;

  const hid = await runCTests(match.code.current, problem.hiddenTests ?? [], {
    timeLimitSeconds: 4,
  });
  const hidOk = hid.total > 0 && hid.passed === hid.total;

  const accepted = pubOk && hidOk;
  const message = accepted
    ? "Submission accepted. Your team's solution passed all checks."
    : "There is a problem with your code. Keep fixing and resubmit before time runs out.";

  match.submissions.push({
    userId: user._id,
    kind: "submit",
    passed: pub.passed + hid.passed,
    total: pub.total + hid.total,
    status: accepted ? "accepted" : "rejected",
    message,
    at: new Date(),
  });

  if (accepted) {
    match.result = computeResult({
      match,
      finalPublicPassed: true,
      hiddenPassed: hid.passed,
      hiddenTotal: hid.total,
    });
    match.phase = "complete";
    match.endedAt = new Date();
  }

  await match.save();

  return ok({
    accepted,
    message,
    phase: match.phase,
  });
}
