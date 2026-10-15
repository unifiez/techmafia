import { resolveMatch } from "@/lib/game/service";
import { fail, ok, readJson } from "@/lib/http";
import { applyAttack, countTargets } from "@/lib/game/attacks";
import { ATTACK_CATALOGUE, ATTACK_TYPES } from "@/lib/game/config";
import type { AttackType } from "@/lib/models";

type Body = { type?: string; moduleKey?: string; occurrence?: number };

/**
 * Detective attack. Only the attacking team, only during the attack window,
 * only allowlisted mutations, and only while tokens + cooldown permit.
 * Rejected attacks do NOT consume a token (see GameOverviewFTH.txt §5.2).
 */
export async function POST(req: Request) {
  const r = await resolveMatch();
  if (!r.ok) return fail(r.message, r.status);
  const { user, match, role } = r;

  if (role !== "detective") return fail("Only the Detective team can attack.", 403);
  if (match.phase !== "attack") {
    return fail("The attack window is closed.", 409);
  }

  const body = await readJson<Body>(req);
  const type = body?.type as AttackType | undefined;
  if (!type || !ATTACK_TYPES.includes(type)) return fail("Unknown attack type.");
  const moduleKey = body?.moduleKey;
  if (!moduleKey) return fail("Choose a module to attack.");

  const meta = ATTACK_CATALOGUE[type];
  const remaining = match.config.tokenBudget - match.tokensSpent;
  if (meta.cost > remaining) {
    return fail(`Not enough tokens: this attack costs ${meta.cost}, you have ${remaining}.`, 409);
  }

  // Cooldown between attacks.
  if (match.config.attackCooldownSeconds > 0) {
    const last = match.attacks[match.attacks.length - 1];
    if (last) {
      const since = (Date.now() - new Date(last.at).getTime()) / 1000;
      const wait = match.config.attackCooldownSeconds - since;
      if (wait > 0) {
        return fail(`Cooling down: ${Math.ceil(wait)}s before the next attack.`, 429);
      }
    }
  }

  // Same location may not be attacked twice in a row without a repair.
  const lastApplied = [...match.attacks].reverse().find((a) => a.applied);
  if (lastApplied && lastApplied.type === type && lastApplied.moduleKey === moduleKey) {
    return fail("That exact location was just attacked. Pick a different target.", 409);
  }

  const targets = countTargets(match.code.current, moduleKey, type);
  if (targets === 0) {
    // Log the attempt but consume nothing.
    match.attacks.push({
      detectiveUserId: user._id,
      type,
      cost: meta.cost,
      moduleKey,
      applied: false,
      detail: "no valid target in this module",
      at: new Date(),
    });
    await match.save();
    return ok({
      applied: false,
      message: `${meta.label} found no valid target in ${moduleKey}. No token consumed.`,
      tokens: { budget: match.config.tokenBudget, spent: match.tokensSpent, remaining },
    });
  }

  const occurrence = Math.max(0, Math.min(Number(body?.occurrence) || 0, targets - 1));
  const result = applyAttack(match.code.current, moduleKey, type, occurrence);
  if (!result.applied) {
    return fail("That attack could not be applied.", 409);
  }

  match.code.current = result.source;
  match.tokensSpent += meta.cost;
  match.attacks.push({
    detectiveUserId: user._id,
    type,
    cost: meta.cost,
    moduleKey,
    applied: true,
    detail: result.detail,
    at: new Date(),
  });
  await match.save();

  return ok({
    applied: true,
    detail: result.detail,
    message: `${meta.label} planted in ${moduleKey}. (-${meta.cost} token${meta.cost > 1 ? "s" : ""})`,
    tokens: {
      budget: match.config.tokenBudget,
      spent: match.tokensSpent,
      remaining: Math.max(0, match.config.tokenBudget - match.tokensSpent),
    },
    cooldownSeconds: match.config.attackCooldownSeconds,
  });
}
