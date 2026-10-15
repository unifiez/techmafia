import type { IMatch, MatchResult } from "../models";
import { isPlaceholderBody, parseModules } from "./code";
import {
  applyOverrides,
  scoreCoder,
  scoreDetective,
  type ManualOverride,
  type ScoringInput,
} from "./scoring";

export type ComputeResultParams = {
  match: IMatch;
  finalPublicPassed: boolean;
  hiddenPassed: number;
  hiddenTotal: number;
  overrides?: { coder?: ManualOverride[]; detective?: ManualOverride[] };
};

export function computeResult(params: ComputeResultParams): MatchResult {
  const { match, finalPublicPassed, hiddenPassed, hiddenTotal } = params;

  const modules = parseModules(match.code.current);
  const moduleBodies = match.modules.map((mod) => {
    const body = modules.find((m) => m.key === mod.key)?.body ?? "";
    return { key: mod.key, nontrivial: !isPlaceholderBody(body) };
  });

  const applied = match.attacks.filter((a) => a.applied);
  const unresolvedAttacks = finalPublicPassed ? 0 : applied.length;

  const contributors = new Set<string>();
  for (const mod of match.modules) {
    const body = modules.find((m) => m.key === mod.key)?.body ?? "";
    if (!isPlaceholderBody(body) && mod.authorUserId) contributors.add(String(mod.authorUserId));
  }
  for (const s of match.submissions) contributors.add(String(s.userId));

  const detectiveContributors = new Set(
    applied.map((a) => String(a.detectiveUserId)),
  ).size;
  const distinctModulesTargeted = new Set(
    applied.map((a) => a.moduleKey).filter(Boolean),
  ).size;
  const distinctTypesUsed = new Set(applied.map((a) => a.type)).size;

  const input: ScoringInput = {
    moduleBodies,
    baselinePassed: match.baselineClean,
    finalPublicPassed,
    hiddenPassed,
    hiddenTotal,
    coderContributors: contributors.size,
    attacks: match.attacks,
    appliedAttacks: applied.length,
    unresolvedAttacks,
    distinctModulesTargeted,
    distinctTypesUsed,
    detectiveContributors,
  };

  const coder = applyOverrides(scoreCoder(input), params.overrides?.coder);
  const detective = applyOverrides(scoreDetective(input), params.overrides?.detective);

  const hiddenAllPassed = hiddenTotal > 0 && hiddenPassed === hiddenTotal;
  const accepted = finalPublicPassed && hiddenAllPassed;
  let winner: MatchResult["winner"] = "draw";
  if (accepted) winner = "coder";
  else if (applied.length > 0) winner = "detective";
  else if (coder.total > detective.total) winner = "coder";
  else if (detective.total > coder.total) winner = "detective";

  return {
    coderScore: coder.total,
    detectiveScore: detective.total,
    coderBreakdown: coder.rows,
    detectiveBreakdown: detective.rows,
    winner,
    finalizedAt: new Date(),
  };
}
