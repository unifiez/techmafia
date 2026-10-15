import { currentUserWithTeam } from "@/lib/auth";
import { ok, fail } from "@/lib/http";
import { Problem } from "@/lib/models";
import {
  autoAdvance,
  buildPlayerView,
  findLatestMatchForTeam,
  findLiveMatchForTeam,
  loadTeam,
  toProblemView,
} from "@/lib/game/service";

export async function GET() {
  const ctx = await currentUserWithTeam();
  if (!ctx) return ok({ hasMatch: false, authenticated: false });
  const { user, team } = ctx;

  if (user.disqualified) {
    return ok({
      authenticated: true,
      hasMatch: false,
      disqualified: true,
      disqualification: user.disqualification ?? null,
    });
  }

  if (!team) {
    return ok({ authenticated: true, hasMatch: false, hasTeam: false });
  }

  try {
    let match = await findLiveMatchForTeam(String(team._id));
    if (!match) match = await findLatestMatchForTeam(String(team._id));
    if (!match) return ok({ authenticated: true, hasTeam: true, hasMatch: false });

    await autoAdvance(match);

    const coderTeam = await loadTeam(match.coderTeamId);
    const problem = await Problem.findOne({ key: match.problemKey }).lean();
    const view = buildPlayerView(match, user, team, coderTeam, {
      problem: problem ? toProblemView(problem) : null,
    });
    return ok({ authenticated: true, hasTeam: true, ...view });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not load match", 500);
  }
}
