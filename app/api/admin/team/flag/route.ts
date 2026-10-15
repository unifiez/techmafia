import { dbConnect } from "@/lib/db";
import { Team } from "@/lib/models";
import { fail, ok, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/admin";

type Body = { teamId?: string; flagged?: boolean; reason?: string };

/** Flag or clear a team (fair-play). */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJson<Body>(req);
  if (!body?.teamId) return fail("teamId is required");
  const flagged = Boolean(body.flagged);

  try {
    await dbConnect();
    const team = await Team.findByIdAndUpdate(
      body.teamId,
      {
        $set: {
          flagged,
          ...(flagged
            ? { flagReason: (body.reason ?? "Flagged by organizer").trim() }
            : { flagReason: undefined }),
        },
      },
      { new: true },
    ).lean();

    if (!team) return fail("Team not found", 404);
    return ok({ teamId: String(team._id), flagged: team.flagged });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not flag team", 500);
  }
}
