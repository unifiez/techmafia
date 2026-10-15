import { dbConnect } from "@/lib/db";
import { Match, Problem, Team } from "@/lib/models";
import { fail, ok, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/admin";
import { computeResult } from "@/lib/game/finalize";
import { runCTests } from "@/lib/judge0";
import { isJudgeConfigured } from "@/lib/env";
import type { ManualOverride } from "@/lib/game/scoring";

type Body = {
  matchId?: string;
  runHidden?: boolean;
  finalPublicPassed?: boolean;
  hiddenPassed?: number;
  hiddenTotal?: number;
  overrides?: { coder?: ManualOverride[]; detective?: ManualOverride[] };
};

/**
 * Finalise a match: optionally re-run the hidden tests, compute the scorecard,
 * and lock the match as complete.
 */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJson<Body>(req);
  if (!body?.matchId) return fail("matchId is required");

  try {
    await dbConnect();
    const match = await Match.findById(body.matchId);
    if (!match) return fail("Match not found", 404);

    const problem = await Problem.findOne({ key: match.problemKey }).lean();
    if (!problem) return fail("Problem not found", 404);

    let finalPublicPassed = Boolean(body.finalPublicPassed);
    let hiddenPassed = body.hiddenPassed ?? 0;
    let hiddenTotal = body.hiddenTotal ?? problem.hiddenTests.length;

    if (body.runHidden) {
      if (!isJudgeConfigured()) {
        return fail("The code checker is not configured, cannot run hidden tests", 503);
      }
      const pub = await runCTests(match.code.current, problem.publicTests ?? [], {
        timeLimitSeconds: 4,
      });
      const hid = await runCTests(match.code.current, problem.hiddenTests ?? [], {
        timeLimitSeconds: 4,
      });
      if (pub.infrastructureError || hid.infrastructureError) {
        return fail(
          "The code checker is busy right now. Please try again in a few seconds.",
          503,
        );
      }
      finalPublicPassed = pub.total > 0 && pub.passed === pub.total;
      hiddenPassed = hid.passed;
      hiddenTotal = hid.total;
    }

    const result = computeResult({
      match,
      finalPublicPassed,
      hiddenPassed,
      hiddenTotal,
      overrides: body.overrides,
    });

    match.result = result;
    match.phase = "complete";
    match.endedAt = new Date();
    await match.save();

    const ids = [match.coderTeamId, match.detectiveTeamId].filter(
      (id): id is NonNullable<typeof id> => Boolean(id),
    );
    await Team.updateMany({ _id: { $in: ids } }, { $set: { status: "ready" } });

    return ok({
      result,
      checked: Boolean(body.runHidden),
      hidden: { passed: hiddenPassed, total: hiddenTotal },
      finalPublicPassed,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not finalise match", 500);
  }
}
