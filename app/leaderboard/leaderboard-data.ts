// All dynamic data for the Leaderboard page. Edit only this file — UI reads everything from this module.

export type MetaBadge = {
  text: string;
  tone: "secondary" | "surface" | "primary";
  icon?: string;
  ping?: boolean;
}

export type LeaderboardRank = {
  rank: number
  team: string
  solved: number
  planted: number
  repaired: number
  integrity: string
  points: number
  status: string
  statusIcon?: string
  statusTone: "primary" | "secondary" | "surface" | "container"
  isCurrentTeam?: boolean
  matches?: number
  college?: string
}

export type LeaderboardRow = LeaderboardRank

export type LeaderboardData = {
  hero: { badge: string; title: string }
  bracketModal: {
    label: string
    title: string
    file: string
    resetLabel: string
    injectLabel: string
    compiler: string
    cleanCode: string[]
    poisonedCode: string[]
    hint: string
  }
}

export const leaderboard: LeaderboardData = {
  hero: { badge: "\u{1F579}\uFE0F RETRO BATTLE ROYALE MODE", title: "TOURNAMENT STANDINGS & BRACKET" },

  bracketModal: {
    label: "LIVE BRACKET MATRIX // ROUND 07",
    title: "LIVE BRACKET MATRIX // ROUND 07",
    file: "bracket-matrix",
    resetLabel: "Reset Clean Code",
    injectLabel: "Inject 2-Token Flaw",
    compiler: "Compiler: GCC 11.4 \u2022 Flag: -Wall -O2",
    hint: "Click \"Inject 2-Token Flaw\" to observe how the Detective Team introduces sneaky calculation drift during the 2-minute window.",
    cleanCode: [
      "// MODULE 2: ARITHMETIC CALCULATION (Coder 2)",
      "float calculate(float a, float b, char op) {",
      "  if (op == '+') return a + b;",
      "  if (op == '-') return a - b;",
      "  if (op == '*') return a * b;",
      "  if (op == '/') {",
      "    if (b == 0) return -1; // div-by-zero check",
      "    return a / b;",
      "}",
      "",
      "// simple main",
      "int main() { return 0; }",
    ],
    poisonedCode: [
      "// MODULE 2: ARITHMETIC CALCULATION (Coder 2)",
      "float calculate(float a, float b, char op) {",
      "  if (op == '+') return a + b; /* INJECTED: TIER 2 DEFECT (-2 TOKENS) */",
      "  if (op == '-') return a - b;",
      "  if (op == '*') return a * b;",
      "  if (op == '/') {",
      "    if (b == 0) return -1; // div-by-zero check",
      "    return a / b;",
      "}",
      "",
      "// simple main",
      "int main() { return 0; }",
    ],
  },
}