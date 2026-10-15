import { dbConnect } from "@/lib/db";
import { Team, User, Violation } from "@/lib/models";
import { fail, ok, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/admin";

type Body = { userId?: string; disqualified?: boolean; reason?: string };

/** Disqualify or reinstate a single participant (and flag their team). */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJson<Body>(req);
  if (!body?.userId) return fail("userId is required");
  const disqualified = Boolean(body.disqualified);

  try {
    await dbConnect();
    const user = await User.findById(body.userId);
    if (!user) return fail("User not found", 404);

    if (disqualified) {
      user.disqualified = true;
      user.disqualification = {
        reason: (body.reason ?? "Disqualified by organizer").trim(),
        at: new Date(),
      };
      await Violation.create({
        userId: user._id,
        teamId: user.teamId,
        type: "multi_session",
        detail: user.disqualification.reason,
        disqualified: true,
        at: new Date(),
      });
    } else {
      user.disqualified = false;
      user.disqualification = undefined;
    }
    await user.save();

    if (user.teamId) {
      await Team.updateOne(
        { _id: user.teamId },
        disqualified
          ? { $set: { flagged: true, flagReason: `Member ${user.name} disqualified` } }
          : { $set: { flagged: false, flagReason: undefined } },
      );
    }

    return ok({
      userId: String(user._id),
      disqualified: user.disqualified,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not update participant", 500);
  }
}
