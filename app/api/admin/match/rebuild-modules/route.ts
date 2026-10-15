import { dbConnect } from "@/lib/db";
import { Match, Problem, Team } from "@/lib/models";
import { fail, ok, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/admin";
import { buildMatchModules } from "@/lib/game/engine";
import { coderMembers } from "@/lib/game/service";

type Body = { matchId?: string };

/**
 * Rebuild module authorship for a match based on CURRENT joined members of
 * the coder team. This fixes "late joiners can't write" — when members joined
 * after the round was created, run this to re-assign modules round-robin to all
 * joined members.
 *
 * IMPORTANT: reassignment changes which member can edit which module in the
 * coding phase (checks authorUserId). The actual code text and template remain
 * unchanged.
 */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJson<Body>(req);
  if (!body?.matchId) return fail("matchId is required");

  try {
    await dbConnect();

    const [match, problem] = await Promise.all([
      Match.findById(body.matchId),
      Problem.findOne().sort({ number: 1 }).lean(), // not ideal; better find by key
    ]);
    if (!match) return fail("Match not found", 404);

    const prob = problem?.key === match.problemKey ? problem : await Problem.findOne({ key: match.problemKey }).lean();
    if (!prob) return fail("Problem not found", 404);

    const coderTeam = match.coderTeamId ? await Team.findById(match.coderTeamId).lean() : null;
    if (!coderTeam) return fail("Coder team not found", 404);

    const members = coderMembers(coderTeam);
    if (members.length < 1) {
      return fail("The coder team has no joined members", 409);
    }

    const titles: Record<string, string> = {};
    for (const mod of prob.modules) titles[mod.key] = mod.title;

    const rebuilt = buildMatchModules(prob.template, members, titles);
    match.modules = rebuilt;

    await match.save();
    return ok({ message: `Modules reassigned to ${members.length} joined coder member(s) round-robin.` });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not rebuild modules", 500);
  }
}
