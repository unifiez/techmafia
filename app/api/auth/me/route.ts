import { currentUserWithTeam } from "@/lib/auth";
import { ok } from "@/lib/http";

export async function GET() {
  const ctx = await currentUserWithTeam();
  if (!ctx) {
    return ok({ authenticated: false });
  }
  const { user, team } = ctx;
  return ok({
    authenticated: true,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      roll: user.roll,
      isCaptain: user.isCaptain,
      memberIndex: user.memberIndex,
      disqualified: user.disqualified,
      disqualification: user.disqualification ?? null,
    },
    team: team
      ? {
          id: String(team._id),
          name: team.name,
          code: team.code,
          college: team.college,
          status: team.status,
          flagged: team.flagged,
          members: team.members.map((m) => ({
            name: m.name,
            roll: m.roll,
            memberIndex: m.memberIndex,
            joined: m.joined,
            isSelf: m.userId && String(m.userId) === String(user._id),
          })),
        }
      : null,
  });
}
