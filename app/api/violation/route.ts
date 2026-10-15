import { dbConnect } from "@/lib/db";
import { Team, User, Violation, type ViolationType } from "@/lib/models";
import { readSession } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/http";

type Body = { type?: ViolationType; detail?: string; matchId?: string };

const CRITICAL: ViolationType[] = [
  "blur",
  "visibility_hidden",
  "fullscreen_exit",
  "devtools",
  "multi_session",
];

const KNOWN: ViolationType[] = [
  ...CRITICAL,
  "copy",
  "cut",
  "paste",
  "context_menu",
];

/**
 * Fair-play reporter.
 * Critical signals (window blur, tab hidden, leaving fullscreen, devtools) are
 * instant disqualifications: the participant is locked and the team is flagged.
 * Clipboard attempts are logged for the organizer but do not auto-disqualify.
 */
export async function POST(req: Request) {
  const session = await readSession();
  if (!session?.sub) return fail("Not signed in", 401);

  const body = await readJson<Body>(req);
  const type = body?.type;
  if (!type || !KNOWN.includes(type)) return fail("Unknown violation type");

  try {
    await dbConnect();
    const user = await User.findById(session.sub);
    if (!user) return fail("Account not found", 404);

    const critical = CRITICAL.includes(type);

    await Violation.create({
      userId: user._id,
      teamId: user.teamId,
      matchId: body?.matchId,
      type,
      detail: body?.detail ?? "",
      disqualified: critical,
      at: new Date(),
    });

    if (critical && !user.disqualified) {
      user.disqualified = true;
      user.disqualification = {
        reason: `Fair-play violation: ${type}`,
        detail: body?.detail ?? "",
        at: new Date(),
      };
      await user.save();

      if (user.teamId) {
        await Team.updateOne(
          { _id: user.teamId },
          { $set: { flagged: true, flagReason: `Member ${user.name} disqualified (${type})` } },
        );
      }
    }

    return ok({
      type,
      disqualified: user.disqualified,
      action: critical ? "disqualified" : "logged",
      message: critical
        ? "Fair-play violation recorded. You have been disqualified and locked out."
        : "Clipboard action recorded.",
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not record violation", 500);
  }
}
