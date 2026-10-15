import { dbConnect } from "./db";
import { isDbConfigured } from "./env";
import { Match, Team, type IMatch, type ITeam, type MatchPhase } from "./models";

/**
 * Public, read-only projections of the tournament state.
 *
 * These are safe for anonymous visitors: no emails, no password data and no
 * code. Everything degrades gracefully when MongoDB is not configured yet, so
 * the marketing / leaderboard pages always render something real — the teams
 * that have actually signed up.
 */

export type StandingStatus = "flagged" | "in_match" | "active" | "ready" | "forming";

export type PublicStanding = {
  teamId: string;
  name: string;
  code: string | null;
  college: string;
  membersJoined: number;
  membersTotal: number;
  matches: number;
  wins: number;
  coderPoints: number;
  detectivePoints: number;
  totalPoints: number;
  flagged: boolean;
  status: StandingStatus;
};

export type PublicRound = {
  label: string;
  round: number;
  phase: MatchPhase;
  endsAt: string | null;
  secondsLeft: number;
} | null;

export type PublicStats = {
  generatedAt: string;
  dbAvailable: boolean;
  registered: { teams: number; members: number };
  matches: { total: number; live: number; finalized: number; scheduled: number };
  tokensPlanted: number;
  round: PublicRound;
};

export type PublicBoard = {
  stats: PublicStats;
  standings: PublicStanding[];
};

const LIVE_PHASES: readonly MatchPhase[] = [
  "briefing",
  "coding",
  "attack",
  "repair",
  "testing",
];

type Snapshot = {
  dbAvailable: boolean;
  teams: ITeam[];
  matches: IMatch[];
};

async function snapshot(): Promise<Snapshot> {
  if (!isDbConfigured()) {
    return { dbAvailable: false, teams: [], matches: [] };
  }
  try {
    await dbConnect();
  } catch {
    return { dbAvailable: false, teams: [], matches: [] };
  }
  try {
    const [teams, matches] = await Promise.all([
      Team.find().lean<ITeam[]>(),
      Match.find().lean<IMatch[]>(),
    ]);
    return { dbAvailable: true, teams, matches };
  } catch {
    return { dbAvailable: false, teams: [], matches: [] };
  }
}

function millis(value: unknown): number {
  if (!value) return 0;
  const t = value instanceof Date ? value.getTime() : Date.parse(String(value));
  return Number.isFinite(t) ? t : 0;
}

export async function publicBoard(): Promise<PublicBoard> {
  const snap = await snapshot();

  const teamById = new Map<string, ITeam>();
  for (const t of snap.teams) teamById.set(String(t._id), t);

  const rows = new Map<string, PublicStanding>();

  const ensure = (teamId: string): PublicStanding | null => {
    const existing = rows.get(teamId);
    if (existing) return existing;
    const dbTeam = teamById.get(teamId);
    if (!dbTeam) return null;
    const row: PublicStanding = {
      teamId,
      name: dbTeam.name,
      code: dbTeam.code,
      college: dbTeam.college || "",
      membersJoined: dbTeam.members.filter((m) => m.joined).length,
      membersTotal: 4,
      matches: 0,
      wins: 0,
      coderPoints: 0,
      detectivePoints: 0,
      totalPoints: 0,
      flagged: Boolean(dbTeam.flagged),
      status: "forming",
    };
    rows.set(teamId, row);
    return row;
  };

  // Every registered team shows on the board, even before its first match.
  for (const t of snap.teams) ensure(String(t._id));

  let finalized = 0;
  let live = 0;
  let tokensPlanted = 0;

  for (const m of snap.matches) {
    if (LIVE_PHASES.includes(m.phase)) live += 1;
    tokensPlanted += m.tokensSpent ?? 0;

    const result = m.result;
    if (!result?.finalizedAt) continue;
    finalized += 1;

    if (m.coderTeamId) {
      const row = ensure(String(m.coderTeamId));
      if (row) {
        row.matches += 1;
        row.coderPoints += result.coderScore ?? 0;
        if (result.winner === "coder") row.wins += 1;
      }
    }
    if (m.detectiveTeamId) {
      const row = ensure(String(m.detectiveTeamId));
      if (row) {
        row.matches += 1;
        row.detectivePoints += result.detectiveScore ?? 0;
        if (result.winner === "detective") row.wins += 1;
      }
    }
  }

  for (const row of rows.values()) {
    row.totalPoints = row.coderPoints + row.detectivePoints;
    const dbTeam = teamById.get(row.teamId);
    row.status = row.flagged
      ? "flagged"
      : dbTeam?.status === "in_match"
        ? "in_match"
        : row.matches > 0
          ? "active"
          : row.membersJoined >= row.membersTotal
            ? "ready"
            : "forming";
  }

  const standings = [...rows.values()].sort(
    (a, b) =>
      b.totalPoints - a.totalPoints ||
      b.wins - a.wins ||
      b.matches - a.matches ||
      a.name.localeCompare(b.name),
  );

  const now = Date.now();
  const byEnd = (a: IMatch, b: IMatch) =>
    millis(b.phaseEndsAt) - millis(a.phaseEndsAt);
  const liveMatches = snap.matches.filter((m) => LIVE_PHASES.includes(m.phase));
  const pick = [...liveMatches].sort(byEnd)[0] ?? [...snap.matches].sort(byEnd)[0];

  const round: PublicRound = pick
    ? {
        label: pick.label || `Round ${pick.round}`,
        round: pick.round,
        phase: pick.phase,
        endsAt: pick.phaseEndsAt ? new Date(millis(pick.phaseEndsAt)).toISOString() : null,
        secondsLeft: pick.phaseEndsAt
          ? Math.max(0, Math.round((millis(pick.phaseEndsAt) - now) / 1000))
          : 0,
      }
    : null;

  const registeredMembers = snap.teams.reduce(
    (sum, t) => sum + t.members.filter((m) => m.joined).length,
    0,
  );

  const stats: PublicStats = {
    generatedAt: new Date().toISOString(),
    dbAvailable: snap.dbAvailable,
    registered: { teams: snap.teams.length, members: registeredMembers },
    matches: {
      total: snap.matches.length,
      live,
      finalized,
      scheduled: Math.max(0, snap.matches.length - live - finalized),
    },
    tokensPlanted,
    round,
  };

  return { stats, standings };
}
