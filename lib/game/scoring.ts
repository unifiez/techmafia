import type { AttackLog } from "../models";

export type ScoreRow = { label: string; awarded: number; max: number };

export type Scorecard = {
  rows: ScoreRow[];
  total: number;
  max: number;
};

export type ScoringInput = {
  /** Coder-side */
  moduleBodies: { key: string; nontrivial: boolean }[];
  baselinePassed: boolean;
  finalPublicPassed: boolean;
  hiddenPassed: number;
  hiddenTotal: number;
  /** Members who actually contributed (authored a module or performed a repair). */
  coderContributors: number;
  /** Attack-side */
  attacks: AttackLog[];
  appliedAttacks: number;
  unresolvedAttacks: number;
  distinctModulesTargeted: number;
  distinctTypesUsed: number;
  detectiveContributors: number;
};

function clamp(n: number, max: number): number {
  return Math.max(0, Math.min(max, Math.round(n)));
}

/**
 * Automatic Coder scorecard (max 100) — mirrors static/GameOverviewFTH.txt §8.
 * These are the auto-computed baseline values; the organizer may override any
 * row in the admin console before finalising.
 */
export function scoreCoder(input: ScoringInput): Scorecard {
  const nontrivial = input.moduleBodies.filter((m) => m.nontrivial).length;
  const modulesMax = input.moduleBodies.length || 4;

  const rows: ScoreRow[] = [
    {
      label: "Four modules implemented correctly",
      awarded: clamp((nontrivial / modulesMax) * 20, 20),
      max: 20,
    },
    {
      label: "Initial solution works before attacks",
      awarded: input.baselinePassed ? 10 : 0,
      max: 10,
    },
    {
      label: "Introduced errors identified and repaired",
      awarded:
        input.appliedAttacks === 0
          ? 25
          : clamp(
              ((input.appliedAttacks - input.unresolvedAttacks) / input.appliedAttacks) * 25,
              25,
            ),
      max: 25,
    },
    {
      label: "Final program passes hidden test cases",
      awarded:
        input.hiddenTotal > 0
          ? clamp((input.hiddenPassed / input.hiddenTotal) * 20, 20)
          : 0,
      max: 20,
    },
    {
      label: "Correct integration and output",
      awarded: input.finalPublicPassed ? 15 : 0,
      max: 15,
    },
    {
      label: "Individual participation and verification",
      awarded: clamp((input.coderContributors / modulesMax) * 10, 10),
      max: 10,
    },
  ];

  return { rows, total: rows.reduce((a, r) => a + r.awarded, 0), max: 100 };
}

/**
 * Automatic Detective scorecard (max 100) — mirrors static/GameOverviewFTH.txt §8.
 */
export function scoreDetective(input: ScoringInput): Scorecard {
  const applied = input.appliedAttacks;

  const rows: ScoreRow[] = [
    {
      label: "Four successful valid attacks (10 each)",
      awarded: clamp(Math.min(applied, 4) * 10, 40),
      max: 40,
    },
    {
      label: "Attacks that remain effective after debugging",
      awarded: applied === 0 ? 0 : clamp((input.unresolvedAttacks / applied) * 20, 20),
      max: 20,
    },
    {
      label: "Strategic targeting and diversity of attacks",
      awarded: clamp(
        (input.distinctModulesTargeted / 4) * 10 + (input.distinctTypesUsed / 4) * 10,
        20,
      ),
      max: 20,
    },
    {
      label: "Accurate attack records and compliance",
      awarded: input.attacks.some((a) => !a.applied) ? 6 : 10,
      max: 10,
    },
    {
      label: "Coordination and individual participation",
      awarded: clamp((input.detectiveContributors / 4) * 10, 10),
      max: 10,
    },
  ];

  return { rows, total: rows.reduce((a, r) => a + r.awarded, 0), max: 100 };
}

export type ManualOverride = { label: string; awarded: number };

/** Apply organizer overrides by row label (0..max). */
export function applyOverrides(card: Scorecard, overrides?: ManualOverride[]): Scorecard {
  if (!overrides || overrides.length === 0) return card;
  const rows = card.rows.map((row) => {
    const o = overrides.find((x) => x.label === row.label);
    if (!o) return row;
    return { ...row, awarded: clamp(o.awarded, row.max) };
  });
  return { rows, total: rows.reduce((a, r) => a + r.awarded, 0), max: 100 };
}
