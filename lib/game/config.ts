import type { AttackType, MatchConfig } from "../models";

export type PresetKey = "rulebook20" | "easy" | "medium" | "hard";

/**
 * Match presets.
 * - `rulebook20` follows static/GameOverviewFTH.txt (20 min, 6 shared tokens).
 * - `easy|medium|hard` follow static/TECH_MAFIA_EVENT_GUIDE.pdf
 *   (per-difficulty windows + token budgets, 7s attack cooldown).
 * The organizer may override any field per match.
 */
export const MATCH_PRESETS: Record<PresetKey, MatchConfig> = {
  rulebook20: {
    difficulty: "Medium",
    briefingSeconds: 60,
    codingSeconds: 540,
    attackSeconds: 120,
    repairSeconds: 300,
    testingSeconds: 180,
    tokenBudget: 6,
    attackCooldownSeconds: 0,
    rotateRepairs: true,
  },
  easy: {
    difficulty: "Easy",
    briefingSeconds: 10,
    codingSeconds: 90,
    attackSeconds: 30,
    repairSeconds: 40,
    testingSeconds: 10,
    tokenBudget: 8,
    attackCooldownSeconds: 7,
    rotateRepairs: true,
  },
  medium: {
    difficulty: "Medium",
    briefingSeconds: 20,
    codingSeconds: 150,
    attackSeconds: 60,
    repairSeconds: 60,
    testingSeconds: 10,
    tokenBudget: 12,
    attackCooldownSeconds: 7,
    rotateRepairs: true,
  },
  hard: {
    difficulty: "Hard",
    briefingSeconds: 30,
    codingSeconds: 240,
    attackSeconds: 96,
    repairSeconds: 100,
    testingSeconds: 14,
    tokenBudget: 15,
    attackCooldownSeconds: 7,
    rotateRepairs: true,
  },
};

export const PHASE_ORDER = [
  "lobby",
  "briefing",
  "coding",
  "attack",
  "repair",
  "testing",
  "complete",
] as const;

export function phaseDuration(config: MatchConfig, phase: string): number {
  switch (phase) {
    case "briefing":
      return config.briefingSeconds;
    case "coding":
      return config.codingSeconds;
    case "attack":
      return config.attackSeconds;
    case "repair":
      return config.repairSeconds;
    case "testing":
      return config.testingSeconds;
    default:
      return 0;
  }
}

export function nextPhase(phase: string): string {
  const idx = PHASE_ORDER.indexOf(phase as (typeof PHASE_ORDER)[number]);
  if (idx === -1 || idx === PHASE_ORDER.length - 1) return "complete";
  return PHASE_ORDER[idx + 1];
}

/** Attack catalogue — cost, label, icon, and how it maps to the docs tiers. */
export const ATTACK_CATALOGUE: Record<
  AttackType,
  { label: string; cost: number; icon: string; description: string; tier: 1 | 2 | 3 }
> = {
  flip_operator: {
    label: "Flip Arithmetic Operator",
    cost: 2,
    icon: "swap_horiz",
    description: "Turns a + into -, * into /, etc. Corrupts core maths.",
    tier: 2,
  },
  boundary: {
    label: "Break Boundary",
    cost: 1,
    icon: "border_outer",
    description: "Changes <= to < (or similar) so edge cases fail.",
    tier: 1,
  },
  logical: {
    label: "Swap Logical Operator",
    cost: 2,
    icon: "join_inner",
    description: "Changes && to || (or vice-versa).",
    tier: 2,
  },
  loop_bound: {
    label: "Off-by-one Loop",
    cost: 1,
    icon: "repeat",
    description: "Tweaks a loop bound so it runs one time too few/many.",
    tier: 1,
  },
  zero_compare: {
    label: "Flip Zero Comparison",
    cost: 1,
    icon: "exposure_zero",
    description: "Inverts a comparison against zero.",
    tier: 1,
  },
  increment: {
    label: "Invert Increment",
    cost: 1,
    icon: "exposure_plus_1",
    description: "Changes ++ to -- or += to -=.",
    tier: 1,
  },
  semicolon: {
    label: "Remove Semicolon",
    cost: 1,
    icon: "backspace",
    description: "Deletes a statement terminator.",
    tier: 1,
  },
  token_misspell: {
    label: "Misspell Token",
    cost: 1,
    icon: "spellcheck",
    description: "Corrupts a keyword such as return.",
    tier: 1,
  },
  bracket: {
    label: "Break Brackets",
    cost: 2,
    icon: "data_object",
    description: "Removes a bracket in an expression.",
    tier: 2,
  },
};

export const ATTACK_TYPES = Object.keys(ATTACK_CATALOGUE) as AttackType[];
