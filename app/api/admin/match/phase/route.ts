import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { Match, Team, type IMatch, type ITeam } from "@/lib/models";
import type { HydratedDocument } from "mongoose";
import { fail, ok, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/admin";
import { enterPhase, nextPhaseOf, syncPhases } from "@/lib/game/engine";
import { coderMembers } from "@/lib/game/service";

type Body = {
  matchId?: string;
  phase?: string;
  action?: "advance" | "set" | "sync";
  /** Apply the action to every non-complete match at once. */
  all?: boolean;
};

/** Set or advance the phase of a match (or every live match when `all`). */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJson<Body>(req);
  if (!body) return fail("Invalid request body");
  if (!body.all && !body.matchId) return fail("matchId is required");

  const action = body.action ?? (body.phase ? "set" : "advance");

  try {
    await dbConnect();

    if (body.all) {
      const matches = await Match.find({ phase: { $ne: "complete" } });
      if (matches.length === 0) return ok({ all: true, advanced: 0 });

      let advanced = 0;
      const completedTeamIds: Types.ObjectId[] = [];

      for (const match of matches) {
        const { members, target } = await resolveTarget(match, action, body.phase);
        if (!target) return fail("A target phase is required");
        enterPhase(match, target, members);
        await match.save();
        advanced += 1;
        if (match.phase === "complete") {
          if (match.coderTeamId) completedTeamIds.push(match.coderTeamId);
          if (match.detectiveTeamId) completedTeamIds.push(match.detectiveTeamId);
        }
      }

      if (completedTeamIds.length > 0) {
        await Team.updateMany({ _id: { $in: completedTeamIds } }, { $set: { status: "ready" } });
      }

      return ok({ all: true, advanced });
    }

    const match = await Match.findById(body.matchId);
    if (!match) return fail("Match not found", 404);

    const { members, target } = await resolveTarget(match, action, body.phase);

    if (action === "sync") {
      const changed = syncPhases(match, members);
      if (changed) await finaliseSideEffects(match);
      return ok({ phase: match.phase, changed });
    }

    if (!target) return fail("A target phase is required");

    enterPhase(match, target, members);
    await finaliseSideEffects(match);
    return ok({ phase: match.phase, phaseEndsAt: match.phaseEndsAt });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not change phase", 500);
  }
}

async function resolveTarget(
  match: HydratedDocument<IMatch>,
  action: "advance" | "set" | "sync",
  phase?: string,
): Promise<{ members: { userId: string; memberIndex: number }[]; target: IMatch["phase"] | undefined }> {
  const coderTeam = match.coderTeamId
    ? await Team.findById(match.coderTeamId).lean<ITeam>()
    : null;
  const members = coderMembers(coderTeam);
  const target =
    action === "advance"
      ? nextPhaseOf(match.phase as IMatch["phase"])
      : (phase as IMatch["phase"] | undefined);
  return { members, target };
}

/** Persist the match and keep team status in step with the phase. */
async function finaliseSideEffects(match: HydratedDocument<IMatch>) {
  await match.save();

  if (match.phase === "complete") {
    const ids = [match.coderTeamId, match.detectiveTeamId].filter(
      (id): id is NonNullable<typeof id> => Boolean(id),
    );
    await Team.updateMany({ _id: { $in: ids } }, { $set: { status: "ready" } });
  }
}
