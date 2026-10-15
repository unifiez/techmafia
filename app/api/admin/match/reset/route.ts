import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { Match, Team } from "@/lib/models";
import { fail, ok, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/admin";

type Body = { scope?: "live" | "all"; round?: number };

/**
 * Clear a round so the organizer can recover from a mistake and restart fast.
 *
 * - `scope: "live"` (default) deletes only unfinished matches (phase !== complete).
 * - `scope: "all"` deletes every match, including completed ones.
 * - `round` (optional) limits the wipe to a single round number.
 *
 * Every team that was tied up by the deleted matches is returned to the
 * "ready" pool, so the next "Start round" picks them up immediately.
 */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = (await readJson<Body>(req)) ?? {};
  const scope = body.scope === "all" ? "all" : "live";

  try {
    await dbConnect();

    const query: Record<string, unknown> = {};
    if (scope === "live") query.phase = { $ne: "complete" };
    if (typeof body.round === "number" && body.round > 0) query.round = body.round;

    const doomed = await Match.find(query)
      .select("coderTeamId detectiveTeamId")
      .lean();

    if (doomed.length === 0) {
      return ok({
        deleted: 0,
        teamsReleased: 0,
        scope,
        message: "Nothing to clear — no matching rounds.",
      });
    }

    const teamIds = new Set<string>();
    for (const m of doomed) {
      if (m.coderTeamId) teamIds.add(String(m.coderTeamId));
      if (m.detectiveTeamId) teamIds.add(String(m.detectiveTeamId));
    }

    const { deletedCount } = await Match.deleteMany(query);

    let teamsReleased = 0;
    if (teamIds.size > 0) {
      const res = await Team.updateMany(
        {
          _id: { $in: [...teamIds].map((id) => new Types.ObjectId(id)) },
          status: "in_match",
        },
        { $set: { status: "ready" } },
      );
      teamsReleased = res.modifiedCount ?? 0;
    }

    const message =
      scope === "all"
        ? `Cleared ${deletedCount ?? 0} match(es) — all rounds. ${teamsReleased} team(s) freed.`
        : `Cleared ${deletedCount ?? 0} live match(es). ${teamsReleased} team(s) freed — ready for a fresh round.`;

    return ok({ deleted: deletedCount ?? 0, teamsReleased, scope, message });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not reset round", 500);
  }
}
