import { Types, type HydratedDocument } from "mongoose";
import { dbConnect } from "../db";
import {
  Match,
  Team,
  type IMatch,
  type IProblem,
  type ITeam,
  type IUser,
} from "../models";
import { changedModules, isPlaceholderBody, parseModules } from "./code";
import { checkRepairPermissions, stripBodies, syncPhases } from "./engine";
import { ATTACK_CATALOGUE, type PresetKey } from "./config";
import { env } from "../env";

export type MemberLite = { userId: string; memberIndex: number; name: string };

export function coderMembers(team: ITeam | null): MemberLite[] {
  if (!team) return [];
  return team.members
    .filter((m) => m.joined && m.userId)
    .sort((a, b) => a.memberIndex - b.memberIndex)
    .map((m) => ({
      userId: String(m.userId),
      memberIndex: m.memberIndex,
      name: m.name,
    }));
}

export async function loadTeam(teamId?: Types.ObjectId | string): Promise<ITeam | null> {
  if (!teamId) return null;
  await dbConnect();
  return Team.findById(teamId).lean<ITeam>();
}

/** Find the live (non-complete) match a team is currently part of. */
export async function findLiveMatchForTeam(
  teamId: string,
): Promise<HydratedDocument<IMatch> | null> {
  await dbConnect();
  const id = new Types.ObjectId(teamId);
  return Match.findOne({
    $or: [{ coderTeamId: id }, { detectiveTeamId: id }],
    phase: { $ne: "complete" },
  }).sort({ createdAt: -1 });
}

export async function findLatestMatchForTeam(
  teamId: string,
): Promise<HydratedDocument<IMatch> | null> {
  await dbConnect();
  const id = new Types.ObjectId(teamId);
  return Match.findOne({
    $or: [{ coderTeamId: id }, { detectiveTeamId: id }],
  }).sort({ createdAt: -1 });
}

export function viewerRole(match: IMatch, teamId?: string): "coder" | "detective" | null {
  if (!teamId) return null;
  if (String(match.coderTeamId) === String(teamId)) return "coder";
  if (String(match.detectiveTeamId) === String(teamId)) return "detective";
  return null;
}

/** Sync phases for a match document, persisting when the phase advances. */
export async function autoAdvance(
  matchDoc: HydratedDocument<IMatch>,
): Promise<boolean> {
  const coderTeam = await loadTeam(matchDoc.coderTeamId);
  const changed = syncPhases(matchDoc, coderMembers(coderTeam));
  if (changed) await matchDoc.save();
  return changed;
}

function namesByUser(team: ITeam | null): Record<string, string> {
  const map: Record<string, string> = {};
  if (team) for (const m of team.members) if (m.userId) map[String(m.userId)] = m.name;
  return map;
}

export type PlayerMatchView = ReturnType<typeof buildPlayerView>;

export type ProblemView = {
  key: string;
  number: number;
  title: string;
  description: string;
  difficulty: string;
  weight: number;
  concepts: string[];
  modules: { key: string; description: string; role: string }[];
};

/** Build the sanitized match payload a player is allowed to see. */
export function buildPlayerView(
  match: IMatch,
  user: IUser,
  team: ITeam | null,
  coderTeam: ITeam | null,
  opts: { now?: Date; problem?: ProblemView | null } = {},
) {
  const now = opts.now ?? new Date();
  const role = viewerRole(match, team ? String(team._id) : undefined);
  const isCoderTeam = role === "coder";
  const teamId = team ? String(team._id) : "";

  const coderTeamNames = namesByUser(coderTeam);
  const userId = String(user._id);

  const modules = match.modules.map((mod) => {
    const isAuthor = String(mod.authorUserId ?? "") === userId;
    const isRepairOwner = String(mod.repairUserId ?? "") === userId;
    const authorName = mod.authorUserId
      ? coderTeamNames[String(mod.authorUserId)] ?? null
      : null;
    return {
      key: mod.key,
      title: mod.title,
      authorName,
      isMine: role === "coder" ? (match.phase === "repair" ? isRepairOwner : isAuthor) : false,
      repairOwnerName: isCoderTeam
        ? mod.repairUserId
          ? coderTeamNames[String(mod.repairUserId)] ?? null
          : null
        : null,
    };
  });

  const bodyByKey = new Map(parseModules(match.code.current).map((x) => [x.key, x.body]));
  const moduleProgress = modules.map((mod) => ({
    key: mod.key,
    title: mod.title,
    filled: !isPlaceholderBody(bodyByKey.get(mod.key) ?? ""),
  }));

  const remainingSeconds = Math.max(
    0,
    Math.round((new Date(match.phaseEndsAt).getTime() - now.getTime()) / 1000),
  );

  const lastRun = [...match.submissions].reverse().find((s) => s.kind === "run") ?? null;
  const finalSubmission = [...match.submissions].reverse().find((s) => s.kind === "submit") ?? null;

  const lastAttack = [...match.attacks].reverse()[0] ?? null;
  const cooldownRemaining =
    role === "detective" && match.config.attackCooldownSeconds > 0 && lastAttack
      ? Math.max(
          0,
          Math.round(
            (new Date(lastAttack.at).getTime() +
              match.config.attackCooldownSeconds * 1000 -
              now.getTime()) /
              1000,
          ),
        )
      : 0;

  const attackView =
    role === "detective"
      ? match.attacks.map((a) => ({
          type: a.type,
          label: ATTACK_CATALOGUE[a.type]?.label ?? a.type,
          cost: a.cost,
          moduleKey: a.moduleKey,
          applied: a.applied,
          detail: a.detail,
          at: a.at,
        }))
      : undefined;

  return {
    hasMatch: true,
    serverNow: now.toISOString(),
    problem: opts.problem ?? null,
    match: {
      id: String(match._id),
      label: match.label,
      round: match.round,
      phase: match.phase,
      phaseStartedAt: match.phaseStartedAt,
      phaseEndsAt: match.phaseEndsAt,
      remainingSeconds,
      role,
      teamId,
      baselineClean: match.baselineClean,
      config: {
        difficulty: match.config.difficulty,
        tokenBudget: match.config.tokenBudget,
        attackCooldownSeconds: match.config.attackCooldownSeconds,
        rotateRepairs: match.config.rotateRepairs,
      },
      code: match.code.current,
      modules,
      moduleProgress,
      tokens: {
        budget: match.config.tokenBudget,
        spent: match.tokensSpent,
        remaining: Math.max(0, match.config.tokenBudget - match.tokensSpent),
      },
      cooldownRemaining,
      attacks: attackView,
      catalogue: role === "detective" ? ATTACK_CATALOGUE : undefined,
      lastRun: lastRun
        ? { passed: lastRun.passed, total: lastRun.total, at: lastRun.at, kind: "run" }
        : null,
      finalSubmission: finalSubmission
        ? {
            passed: finalSubmission.passed,
            total: finalSubmission.total,
            status: finalSubmission.status,
            message: finalSubmission.message,
            at: finalSubmission.at,
          }
        : null,
      result: match.phase === "complete" ? match.result ?? null : undefined,
    },
  };
}

export const HEARTBEAT_STALE_MS = env.heartbeatTimeoutSeconds * 1000;

/**
 * Resolve the current player + team + live match for use inside route handlers.
 * Returns a discriminated result rather than throwing.
 */
export async function resolveMatch(): Promise<
  | { ok: false; status: number; message: string }
  | {
      ok: true;
      user: IUser;
      team: ITeam;
      match: HydratedDocument<IMatch>;
      role: "coder" | "detective";
      coderTeam: ITeam | null;
    }
> {
  const { currentUserWithTeam } = await import("../auth");
  const ctx = await currentUserWithTeam();
  if (!ctx) return { ok: false, status: 401, message: "Not signed in" };
  const { user, team } = ctx;
  if (user.disqualified) {
    return {
      ok: false,
      status: 403,
      message: "You have been disqualified (fair-play violation).",
    };
  }
  if (!team) return { ok: false, status: 400, message: "You are not on a team yet" };

  let match = await findLiveMatchForTeam(String(team._id));
  if (!match) match = await findLatestMatchForTeam(String(team._id));
  if (!match) return { ok: false, status: 404, message: "No active match for your team" };

  await autoAdvance(match);

  const role = viewerRole(match, String(team._id));
  if (!role) return { ok: false, status: 403, message: "You are not part of this match" };

  const coderTeam = await loadTeam(match.coderTeamId);
  return { ok: true, user, team, match, role, coderTeam };
}

export async function teamRoster() {
  await dbConnect();
  return Team.find().lean<ITeam[]>();
}

export function presetFromKey(key: string | undefined): PresetKey {
  if (key === "rulebook20" || key === "easy" || key === "hard" || key === "medium") {
    return key;
  }
  return "rulebook20";
}

/** Build the sanitized problem payload shown to players. */
export function toProblemView(problem: IProblem): ProblemView {
  return {
    key: problem.key,
    number: problem.number,
    title: problem.title,
    description: problem.description,
    difficulty: problem.difficulty,
    weight: problem.weight,
    concepts: problem.concepts ?? [],
    modules: (problem.modules ?? []).map((m) => ({
      key: m.key,
      description: m.description,
      role: m.role,
    })),
  };
}

/**
 * Validate a code edit against per-participant module ownership and, when
 * valid, apply it to the match document (caller still saves).
 */
export function validateAndApplyCode(
  match: IMatch,
  userId: string,
  role: "coder" | "detective",
  submitted: string,
): { ok: boolean; message?: string; changed: string[] } {
  if (role !== "coder") {
    return { ok: false, message: "Only the Coder team can edit code.", changed: [] };
  }
  if (match.phase !== "coding" && match.phase !== "repair") {
    return { ok: false, message: "The editor is closed during this phase.", changed: [] };
  }

  const current = match.code.current;
  if (stripBodies(submitted) !== stripBodies(current)) {
    return { ok: false, message: "You may only edit your assigned module(s).", changed: [] };
  }
  const a = parseModules(current).map((m) => m.key).sort().join(",");
  const b = parseModules(submitted).map((m) => m.key).sort().join(",");
  if (a !== b) return { ok: false, message: "Invalid module structure.", changed: [] };

  const changed = changedModules(current, submitted);
  if (changed.length === 0) return { ok: false, message: "No changes to save.", changed: [] };

  for (const key of changed) {
    const mod = match.modules.find((m) => m.key === key);
    if (!mod) return { ok: false, message: "Unknown module.", changed: [] };
    const owner =
      match.phase === "repair"
        ? String(mod.repairUserId ?? "")
        : String(mod.authorUserId ?? "");
    if (owner !== String(userId)) {
      return {
        ok: false,
        message:
          match.phase === "repair"
            ? "That module was rotated to another teammate to repair."
            : "That module belongs to a different teammate.",
        changed: [],
      };
    }
  }

  match.code.current = submitted;
  return { ok: true, changed };
}

export { changedModules, checkRepairPermissions };
