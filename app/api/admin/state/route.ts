import { dbConnect } from "@/lib/db";
import { Match, Problem, Team, User, Violation } from "@/lib/models";
import { ok, fail } from "@/lib/http";
import { requireAdmin } from "@/lib/admin";
import { ATTACK_CATALOGUE, MATCH_PRESETS } from "@/lib/game/config";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    await dbConnect();
    const [teams, matches, problems, violations, users] = await Promise.all([
      Team.find().sort({ createdAt: 1 }).lean(),
      Match.find().sort({ createdAt: -1 }).limit(40).lean(),
      Problem.find().sort({ number: 1 }).lean(),
      Violation.find().sort({ at: -1 }).limit(50).lean(),
      User.find().select("name email roll teamId disqualified lastSeenAt").lean(),
    ]);

    const teamById = new Map(teams.map((t) => [String(t._id), t]));
    const userById = new Map(users.map((u) => [String(u._id), u]));

    const cutoff = Date.now() - 20_000;

    return ok({
      teams: teams.map((t) => ({
        id: String(t._id),
        name: t.name,
        code: t.code,
        college: t.college,
        status: t.status,
        flagged: t.flagged,
        flagReason: t.flagReason ?? null,
        joined: t.members.filter((m) => m.joined).length,
        members: t.members.map((m) => {
          const u = m.userId ? userById.get(String(m.userId)) : null;
          return {
            name: m.name,
            roll: m.roll,
            memberIndex: m.memberIndex,
            joined: m.joined,
            userId: m.userId ? String(m.userId) : null,
            disqualified: u?.disqualified ?? false,
            online: u ? new Date(u.lastSeenAt).getTime() > cutoff : false,
          };
        }),
      })),
      matches: matches.map((m) => ({
        id: String(m._id),
        label: m.label,
        round: m.round,
        problemKey: m.problemKey,
        phase: m.phase,
        phaseEndsAt: m.phaseEndsAt,
        coderTeam: m.coderTeamId ? teamById.get(String(m.coderTeamId))?.name ?? "—" : "—",
        detectiveTeam: m.detectiveTeamId
          ? teamById.get(String(m.detectiveTeamId))?.name ?? "—"
          : "—",
        coderTeamId: m.coderTeamId ? String(m.coderTeamId) : null,
        detectiveTeamId: m.detectiveTeamId ? String(m.detectiveTeamId) : null,
        tokens: { budget: m.config.tokenBudget, spent: m.tokensSpent },
        attacks: m.attacks.length,
        appliedAttacks: m.attacks.filter((a) => a.applied).length,
        baselineClean: m.baselineClean,
        result: m.result ?? null,
        config: m.config,
      })),
      problems: problems.map((p) => ({
        key: p.key,
        number: p.number,
        title: p.title,
        difficulty: p.difficulty,
        publicTests: p.publicTests.length,
        hiddenTests: p.hiddenTests.length,
      })),
      violations: violations.map((v) => ({
        id: String(v._id),
        type: v.type,
        detail: v.detail,
        disqualified: v.disqualified,
        at: v.at,
        user: v.userId ? userById.get(String(v.userId))?.name ?? "—" : "—",
        team: v.teamId ? teamById.get(String(v.teamId))?.name ?? "—" : "—",
      })),
      presets: MATCH_PRESETS,
      attacks: ATTACK_CATALOGUE,
      counts: {
        teams: teams.length,
        ready: teams.filter((t) => t.status !== "forming").length,
        matches: matches.length,
        problems: problems.length,
      },
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Admin state failed", 500);
  }
}
