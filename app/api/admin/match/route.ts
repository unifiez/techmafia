import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { Match, Problem, Team, type IMatch, type ITeam } from "@/lib/models";
import { fail, ok, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/admin";
import { MATCH_PRESETS } from "@/lib/game/config";
import { buildMatchModules, stripBodies } from "@/lib/game/engine";
import { coderMembers, presetFromKey } from "@/lib/game/service";

type Body = {
  problemKey?: string;
  coderTeamId?: string;
  detectiveTeamId?: string;
  presetKey?: string;
  label?: string;
  round?: number;
  config?: Partial<IMatch["config"]>;
};

/** Create a new 4v4 match between two joined teams. */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJson<Body>(req);
  if (!body) return fail("Invalid request body");

  const { problemKey, coderTeamId, detectiveTeamId } = body;
  if (!problemKey) return fail("Choose a problem");
  if (!coderTeamId || !detectiveTeamId) return fail("Choose both teams");
  if (coderTeamId === detectiveTeamId) return fail("A team cannot play against itself");

  try {
    await dbConnect();

    const [problem, coderTeam, detectiveTeam] = await Promise.all([
      Problem.findOne({ key: problemKey }).lean(),
      Team.findById(coderTeamId).lean<ITeam>(),
      Team.findById(detectiveTeamId).lean<ITeam>(),
    ]);

    if (!problem) return fail("Problem not found", 404);
    if (!coderTeam) return fail("Coder team not found", 404);
    if (!detectiveTeam) return fail("Detective team not found", 404);

    const members = coderMembers(coderTeam);
    if (members.length < 1) {
      return fail("The coder team has no joined members yet", 409);
    }

    const presetKey = presetFromKey(body.presetKey);
    const base = MATCH_PRESETS[presetKey];
    const config: IMatch["config"] = { ...base, ...(body.config ?? {}) };

    const titles: Record<string, string> = {};
    for (const mod of problem.modules) titles[mod.key] = mod.title;

    const modules = buildMatchModules(problem.template, members, titles);
    const blank = stripBodies(problem.template);

    const round =
      typeof body.round === "number" && body.round > 0
        ? Math.floor(body.round)
        : (await Match.countDocuments()) + 1;

    const match = await Match.create({
      round,
      label: (body.label ?? "").trim() || `Round ${round}`,
      problemKey: problem.key,
      config,
      phase: "lobby",
      coderTeamId: new Types.ObjectId(coderTeamId),
      detectiveTeamId: new Types.ObjectId(detectiveTeamId),
      phaseStartedAt: new Date(),
      phaseEndsAt: new Date(),
      code: { baseline: blank, current: blank },
      baselineClean: false,
      modules,
      tokensSpent: 0,
      attacks: [],
      submissions: [],
    });

    await Team.updateMany(
      { _id: { $in: [coderTeam._id, detectiveTeam._id] } },
      { $set: { status: "in_match" } },
    );

    return ok({ matchId: String(match._id), presetKey, config });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not create match", 500);
  }
}
