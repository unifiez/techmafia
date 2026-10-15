import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models";
import { readSession } from "@/lib/auth";
import { ok, fail, readJson } from "@/lib/http";
import { HEARTBEAT_STALE_MS } from "@/lib/game/service";

type Body = { focus?: boolean };

/**
 * Presence ping. Called every few seconds by the active match screen.
 * Returns the live disqualification state so the client can eject instantly.
 */
export async function POST(req: Request) {
  const session = await readSession();
  if (!session?.sub) return fail("Not signed in", 401);

  const body = await readJson<Body>(req).catch(() => null);
  void body;

  try {
    await dbConnect();
    const user = await User.findByIdAndUpdate(
      session.sub,
      { $set: { lastSeenAt: new Date() } },
      { new: true },
    ).lean();
    if (!user) return fail("Account not found", 404);

    return ok({
      disqualified: user.disqualified,
      disqualification: user.disqualification ?? null,
      serverNow: new Date().toISOString(),
      staleMs: HEARTBEAT_STALE_MS,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Heartbeat failed", 500);
  }
}
