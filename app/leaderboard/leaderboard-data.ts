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
}

export type LeaderboardRow = LeaderboardRank

export type LeaderboardData = {
  hero: { badge: string; title: string }
  round: { label: string; status: string; clock: string }
  podium: LeaderboardRank[]
  tableRows: LeaderboardRow[]
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

const META_TONE = {
  secondary: "bg-secondary-container text-on-secondary-container",
  surface: "bg-surface-container-lowest text-on-surface",
  primary: "bg-primary-container text-on-primary-container",
}

const STATUS_TONE_BG = {
  primary: "bg-primary-container text-on-primary-container",
  secondary: "bg-secondary-container text-on-secondary-container",
  surface: "bg-surface-container-lowest text-on-surface",
  container: "bg-primary-container text-on-primary-container animate-pulse",
}

const STATUS_TONE_TEXT = {
  primary: "text-on-primary-container",
  secondary: "text-on-secondary-container",
  surface: "text-on-surface",
  container: "text-on-primary-container",
}

const TOKEN_TONE = {
  comment: "text-[#8c706f]",
  keyword: "text-secondary-fixed",
  string: "text-primary-container",
  inject: "text-primary font-bold bg-primary/20 px-1 border border-primary",
}

export const leaderboard: LeaderboardData = {
  hero: { badge: "\u{1F579}\uFE0F RETRO BATTLE ROYALE MODE", title: "TOURNAMENT STANDINGS & BRACKET" },

  round: { label: "ROUND 07 // LIVE", status: "MATCH CLOCK: 14:28 REMAINING", clock: "14:28" },

  podium: [
    {
      rank: 1,
      team: "NullPointer Guild",
      solved: 34,
      planted: 19,
      repaired: 28,
      integrity: "98.4%",
      points: 960,
      status: "DEFENDING",
      statusIcon: "military_tech",
      statusTone: "primary",
      isCurrentTeam: false,
    },
    {
      rank: 2,
      team: "ByteBandits",
      solved: 31,
      planted: 24,
      repaired: 22,
      integrity: "94.2%",
      points: 915,
      status: "ACTIVE",
      statusTone: "secondary",
      isCurrentTeam: false,
    },
    {
      rank: 3,
      team: "Sher Syndicate",
      solved: 29,
      planted: 15,
      repaired: 26,
      integrity: "92.0%",
      points: 850,
      status: "LIVE LOCK",
      statusTone: "container",
      isCurrentTeam: true,
    },
  ],

  tableRows: [
    {
      rank: 1,
      team: "NullPointer Guild",
      solved: 34,
      planted: 19,
      repaired: 28,
      integrity: "98.4%",
      points: 960,
      status: "DEFENDING",
      statusTone: "primary",
      isCurrentTeam: false,
    },
    {
      rank: 2,
      team: "ByteBandits",
      solved: 31,
      planted: 24,
      repaired: 22,
      integrity: "94.2%",
      points: 915,
      status: "ACTIVE",
      statusTone: "secondary",
      isCurrentTeam: false,
    },
    {
      rank: 3,
      team: "Sher Syndicate",
      solved: 29,
      planted: 15,
      repaired: 26,
      integrity: "92.0%",
      points: 850,
      status: "LIVE LOCK",
      statusTone: "container",
      isCurrentTeam: true,
    },
    {
      rank: 4,
      team: "Cipher Syndicate",
      solved: 26,
      planted: 18,
      repaired: 21,
      integrity: "88.5%",
      points: 790,
      status: "ACTIVE",
      statusTone: "secondary",
      isCurrentTeam: false,
    },
    {
      rank: 5,
      team: "Kernel Panic Collective",
      solved: 24,
      planted: 20,
      repaired: 19,
      integrity: "84.1%",
      points: 745,
      status: "STANDBY",
      statusTone: "surface",
      isCurrentTeam: false,
    },
    {
      rank: 6,
      team: "ZeroDay Vanguard",
      solved: 21,
      planted: 14,
      repaired: 17,
      integrity: "80.6%",
      points: 680,
      status: "STANDBY",
      statusTone: "surface",
      isCurrentTeam: false,
    },
    {
      rank: 7,
      team: "HexOverflow Club",
      solved: 19,
      planted: 16,
      repaired: 14,
      integrity: "76.3%",
      points: 620,
      status: "ACTIVE",
      statusTone: "secondary",
      isCurrentTeam: false,
    },
    {
      rank: 8,
      team: "Rootkit Rebels",
      solved: 17,
      planted: 11,
      repaired: 12,
      integrity: "71.0%",
      points: 570,
      status: "LIVE LOCK",
      statusTone: "container",
      isCurrentTeam: false,
    },
  ],

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