import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { Match, Problem, Team, type IMatch, type ITeam } from "@/lib/models";
import { fail, ok, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/admin";
import { MATCH_PRESETS } from "@/lib/game/config";
import { buildMatchModules, stripBodies } from "@/lib/game/engine";
import { coderMembers, presetFromKey } from "@/lib/game/service";

type Body = {
  presetKey?: string;
  problemKey?: string;
  labelPrefix?: string;
  config?: Partial<IMatch["config"]>;
};

/** Fisher–Yates shuffle on a copy. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * One-click round.
 *
 * Pairs every eligible team at random, assigns the SAME problem to every match,
 * and creates the matches in the lobby (the organizer advances them). Rules:
 *  - a team is eligible when it has at least one joined member, is not
 *    disqualified and is not already committed to a live match;
 *  - every team appears in at most one match (no overlap / no mixing);
 *  - with an odd team count, one team receives a bye.
 */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = (await readJson<Body>(req)) ?? {};

  try {
    await dbConnect();

    const active = await Problem.find({ active: { $ne: false } })
      .sort({ number: 1 })
      .lean();
    if (active.length === 0) {
      return fail("No problems seeded yet. Seed the problem bank first.", 409);
    }

    const problem = body.problemKey
      ? active.find((p) => p.key === body.problemKey)
      : active[Math.floor(Math.random() * active.length)];
    if (!problem) return fail("Problem not found", 404);

    const allTeams = await Team.find({ status: { $ne: "disqualified" } }).lean<ITeam[]>();
    const eligible = allTeams.filter(
      (t) => t.status !== "in_match" && coderMembers(t).length >= 1,
    );

    if (eligible.length < 2) {
      return fail(
        "Need at least two eligible teams (each with a joined member and not already in a match).",
        409,
      );
    }

    const shuffled = shuffle(eligible);
    const pairs: [ITeam, ITeam][] = [];
    for (let i = 0; i + 1 < shuffled.length; i += 2) {
      pairs.push([shuffled[i], shuffled[i + 1]]);
    }
    const bye = shuffled.length % 2 === 1 ? shuffled[shuffled.length - 1] : null;

    const presetKey = presetFromKey(body.presetKey);
    const config: IMatch["config"] = { ...MATCH_PRESETS[presetKey], ...(body.config ?? {}) };

    const titles: Record<string, string> = {};
    for (const mod of problem.modules) titles[mod.key] = mod.title;

    const last = await Match.findOne().sort({ round: -1 }).lean<IMatch>();
    const round = (last?.round ?? 0) + 1;
    const labelPrefix = (body.labelPrefix ?? "").trim() || `Round ${round}`;

    const created: {
      id: string;
      label: string;
      coderTeam: string;
      detectiveTeam: string;
    }[] = [];
    const committedTeamIds: Types.ObjectId[] = [];

    let matchNo = 0;
    for (const [a, b] of pairs) {
      matchNo += 1;
      // Randomly pick which side codes and which attacks.
      const [coderTeam, detectiveTeam] = Math.random() < 0.5 ? [a, b] : [b, a];

      const members = coderMembers(coderTeam);
      const modules = buildMatchModules(problem.template, members, titles);
      const blank = stripBodies(problem.template);
      const label = `${labelPrefix} · M${matchNo}`;

      const match = await Match.create({
        round,
        label,
        problemKey: problem.key,
        config,
        phase: "lobby",
        coderTeamId: coderTeam._id,
        detectiveTeamId: detectiveTeam._id,
        phaseStartedAt: new Date(),
        phaseEndsAt: new Date(),
        code: { baseline: blank, current: blank },
        baselineClean: false,
        modules,
        tokensSpent: 0,
        attacks: [],
        submissions: [],
        createdBy: "auto",
      });

      created.push({
        id: String(match._id),
        label,
        coderTeam: coderTeam.name,
        detectiveTeam: detectiveTeam.name,
      });
      committedTeamIds.push(coderTeam._id, detectiveTeam._id);
    }

    if (committedTeamIds.length > 0) {
      await Team.updateMany(
        { _id: { $in: committedTeamIds } },
        { $set: { status: "in_match" } },
      );
    }

    const message =
      created.length === 0
        ? "No matches created."
        : `${labelPrefix}: ${created.length} match${created.length === 1 ? "" : "es"} on "${problem.title}"` +
          `${bye ? ` · ${bye.name} has a bye` : ""}.`;

    return ok({
      round,
      labelPrefix,
      problemKey: problem.key,
      problemTitle: problem.title,
      presetKey,
      config,
      eligible: eligible.length,
      created,
      bye: bye ? { id: String(bye._id), name: bye.name } : null,
      message,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not start round", 500);
  }
}
