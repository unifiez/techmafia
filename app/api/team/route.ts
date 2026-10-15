import { dbConnect } from "@/lib/db";
import { currentUserWithTeam } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/http";
import { HEARTBEAT_STALE_MS } from "@/lib/game/service";
import type { ITeam } from "@/lib/models";

export async function GET() {
  const ctx = await currentUserWithTeam();
  if (!ctx) return fail("Not signed in", 401);
  const { user, team } = ctx;
  if (!team) return ok({ hasTeam: false });

  const now = Date.now();
  const onlineIds = await onlineTeamMemberIds(team);
  return ok({
    hasTeam: true,
    team: {
      id: String(team._id),
      name: team.name,
      code: team.code,
      college: team.college,
      status: team.status,
      flagged: team.flagged,
      isCaptain: user.isCaptain,
      members: team.members.map((m) => ({
        name: m.name,
        roll: m.roll,
        memberIndex: m.memberIndex,
        joined: m.joined,
        online: m.userId ? onlineIds.has(String(m.userId)) : false,
        isSelf: m.userId && String(m.userId) === String(user._id),
      })),
    },
    staleMs: HEARTBEAT_STALE_MS,
    serverNow: new Date(now).toISOString(),
  });
}

async function onlineTeamMemberIds(team: ITeam): Promise<Set<string>> {
  await dbConnect();
  const { User } = await import("@/lib/models");
  const ids = team.members
    .map((m) => m.userId)
    .filter((id): id is NonNullable<typeof id> => Boolean(id));
  if (ids.length === 0) return new Set();
  const cutoff = new Date(Date.now() - HEARTBEAT_STALE_MS);
  const users = await User.find({ _id: { $in: ids }, lastSeenAt: { $gte: cutoff } })
    .select("_id")
    .lean<{ _id: unknown }[]>();
  return new Set(users.map((u) => String(u._id)));
}

export async function PATCH(req: Request) {
  const ctx = await currentUserWithTeam();
  if (!ctx) return fail("Not signed in", 401);
  const { user, team } = ctx;
  if (!team) return fail("You are not on a team yet", 400);
  if (!user.isCaptain) return fail("Only the captain can rename the team", 403);

  const body = await readJson<{ name?: string }>(req);
  const name = (body?.name ?? "").trim();
  if (name.length < 2 || name.length > 40) {
    return fail("Team name must be 2–40 characters");
  }
  await dbConnect();
  const { Team } = await import("@/lib/models");
  await Team.updateOne({ _id: team._id }, { $set: { name } });
  return ok({ name });
}
