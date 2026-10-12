// All dynamic content for the Compete page lives here.
// Swap these values (or later wire them to an API/store) without touching the UI.

export type OutputTone =
  | "muted"
  | "ok"
  | "default"
  | "error"
  | "warn"
  | "info"
  | "pulse";

export type OutputLine = {
  text: string;
  tone: OutputTone;
};

export type TeamInfo = {
  /** e.g. "ALPHA NODE" */
  label: string;
  /** e.g. "ACME-8492" */
  name: string;
  /** e.g. "CODERS" */
  role: string;
};

export type ProblemSpec = {
  cve: string;
  number: string;
  title: string;
  weight: number;
  difficulty: string;
  description: string;
};

export type DetectiveTokenState = {
  total: number;
  remaining: number;
  description: string;
};

export type CodeFile = {
  /** file shown in the editor tab, e.g. "calculate_core.c" */
  name: string;
  /** editor tab badge, e.g. "MODIFIED" */
  status: string;
  cursor: { line: number; col: number };
  /** Initial contents of the placeholder write pad. */
  source: string;
};

export type FooterBadge = {
  label: string;
  variant: "plain" | "primary";
};

export type CompetitionData = {
  liveLabel: string;
  round: { label: string; number: string };
  teams: { alpha: TeamInfo; target: TeamInfo };
  timer: { label: string; initialSeconds: number; recording: boolean };
  problem: ProblemSpec;
  detectiveToken: DetectiveTokenState;
  codeFile: CodeFile;
  output: OutputLine[];
  footer: {
    title: string;
    subtitle: string;
    badges: FooterBadge[];
    copyright: string;
    clearance: string;
  };
};

export const competition: CompetitionData = {
  liveLabel: "LIVE ARENA",
  round: { label: "ROUND", number: "01" },

  teams: {
    alpha: { label: "ALPHA NODE", name: "ACME-8492", role: "CODERS" },
    target: { label: "TARGET", name: "SHADOW SYNDICATE", role: "DETECTIVES" },
  },

  // 08:36 on the clock
  timer: { label: "COUNTDOWN EXPIRATION", initialSeconds: 8 * 60 + 36, recording: true },

  problem: {
    cve: "CVE-TRAP #049",
    number: "01",
    title: "Simple Calculator Engine",
    weight: 1200,
    difficulty: "MED-FATAL",
    description:
      "Evaluate mathematical tokens from stdin string buffers. A covert operative inserted logic that silently mutates state when executing chained modular divisions. Eliminate all unintended memory corruption and restore deterministic evaluation before time expires.",
  },

  detectiveToken: {
    total: 6,
    remaining: 3,
    description:
      "Each token burns 1 accusatory query or forensic dump against syndicate suspects.",
  },

  codeFile: {
    name: "calculate_core.c",
    status: "MODIFIED",
    cursor: { line: 15, col: 24 },
    source: [
      "#include <stdio.h>",
      "#include <stdlib.h>",
      '#include "calc_engine.h"',
      "",
      "// Core numeric evaluation engine - handles infix tokens",
      "int64_t exec_op(int64_t a, int64_t b, char op) {",
      "  switch (op) {",
      "    case '+': return a + b;",
      "    case '-': return a - b;",
      "    case '*': return a * b;",
      "    case '/':",
      "      // Verify denominator validity before arithmetic",
      "      if (b == 0) {",
      "        return ERR_ZERO_DIVISION;",
      "      }",
      "      // [INJECTED BACKDOOR] Operative altered overflow clamp:",
      "      if (a == INT64_MIN && b == -1) return (int64_t)0xDEADBEEF; // <- SUSPECT",
      "      return (a / b) + (op_secret_seed & 0x01); // <- POISON DRIFT",
      "  }",
      "}",
    ].join("\n"),
  },

  output: [
    { text: "$ gcc -Wall -O2 test_runner.c calculate_core.c -o out.bin", tone: "muted" },
    { text: "> [OK] Compilation succeeded in 142ms. Zero syntax errs.", tone: "ok" },
    { text: "> Running verification matrix on 5 vectors...", tone: "default" },
    { text: "> TC-01: OK (1.2ms)", tone: "ok" },
    { text: "> TC-02: OK (0.8ms)", tone: "ok" },
    { text: "> TC-03: OK (1.9ms)", tone: "ok" },
    {
      text: "> [ASSERT FAIL] TC-04 (chained_div): expected 42, received 43",
      tone: "error",
    },
    {
      text: "> Diff dump: delta +1 detected at offset calculate_core.c:16",
      tone: "warn",
    },
    {
      text: "> Seed trace: op_secret_seed=0x01 injected via thread hook",
      tone: "info",
    },
    { text: "> Ready for hotfix patch buffer input..._", tone: "pulse" },
  ],

  footer: {
    title: "TECH MAFIA \u2022 INTRUSION DIRECTIVE",
    subtitle:
      "High-stakes distributed forensic cyber competition platform. Find the hacker before time expires.",
    badges: [
      { label: "SERVER_NODE: TOKYO-09", variant: "plain" },
      { label: "FIREWALL: ARMED", variant: "plain" },
      { label: "LATENCY: 18MS", variant: "primary" },
    ],
    copyright:
      "\u00A9 2025 Tech Mafia Cyber Syndicate. System specifications calibrated under neo-brutalist protocol.",
    clearance: "DEFENSE_CLEARANCE_IV",
  },
};
