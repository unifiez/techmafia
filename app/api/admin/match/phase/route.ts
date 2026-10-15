import { dbConnect } from "@/lib/db";
import { Match, Team, type IMatch, type ITeam } from "@/lib/models";
import type { HydratedDocument } from "mongoose";
import { fail, ok, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/admin";
import { enterPhase, nextPhaseOf, syncPhases } from "@/lib/game/engine";
import { coderMembers } from "@/lib/game/service";

type Body = { matchId?: string; phase?: string; action?: "advance" | "set" | "sync" };

/** Set or advance the phase of a match. */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJson<Body>(req);
  if (!body?.matchId) return fail("matchId is required");

  try {
    await dbConnect();
    const match = await Match.findById(body.matchId);
    if (!match) return fail("Match not found", 404);

    const coderTeam = match.coderTeamId
      ? await Team.findById(match.coderTeamId).lean<ITeam>()
      : null;
    const members = coderMembers(coderTeam);

    const action = body.action ?? (body.phase ? "set" : "advance");

    if (action === "sync") {
      const changed = syncPhases(match, members);
      if (changed) await finaliseSideEffects(match);
      return ok({ phase: match.phase, changed });
    }

    const target =
      action === "advance"
        ? nextPhaseOf(match.phase as IMatch["phase"])
        : (body.phase as IMatch["phase"] | undefined);

    if (!target) return fail("A target phase is required");

    enterPhase(match, target, members);
    await finaliseSideEffects(match);
    return ok({ phase: match.phase, phaseEndsAt: match.phaseEndsAt });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not change phase", 500);
  }
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
