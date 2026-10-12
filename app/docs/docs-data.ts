// All content for the Docs / "Story Mode" page lives here.
// Edit values here only — the UI reads everything from this object.

export type MetaBadge = {
  text: string;
  tone: "secondary" | "surface" | "primary";
  icon?: string;
  ping?: boolean;
};

export type HeroStat = {
  label: string;
  value: string;
  tone: "low" | "secondary";
};

export type Corner = {
  tone: "blue" | "red";
  tag: string;
  icon: string;
  title: string;
  description: string;
  traits: string[];
};

export type Stage = {
  time: string;
  emoji: string;
  label: string;
  title: string;
  description: string;
  status: string;
  tone: "tertiary" | "primary" | "secondary" | "surface";
  active?: boolean;
  emojiAnimate?: boolean;
};

export type MatchupSide = {
  label: string;
  mission: string;
};

export type Matchup = {
  code: string;
  icons: string;
  title: string;
  coder: MatchupSide;
  detective: MatchupSide;
};

export type BugDiff = {
  kind: "removed" | "added";
  text: string;
};

export type BugTier = {
  tier: string;
  cost: string;
  title: string;
  description: string;
  diff: BugDiff[];
  effect: string;
  tone: "secondary" | "primary" | "container";
  pulse?: boolean;
};

export type Battleground = {
  map: string;
  danger: string;
  mapTone: "tertiaryFixed" | "secondaryFixed" | "primaryFixed" | "surface";
  title: string;
  description: string;
  trivia: string;
  modules: string;
};

export type ScoreRow = {
  label: string;
  pts: string;
  muted?: boolean;
};

export type Scorecard = {
  title: string;
  badge: string;
  badgeTone: "tertiaryFixed" | "primaryFixed";
  rows: ScoreRow[];
  victory: string;
  ptTone: "tertiary" | "primary";
  containerTone: "surface" | "secondary";
};

export type TerminalToken = {
  text: string;
  tone?: "comment" | "keyword" | "string" | "inject";
};

export type TerminalLine = TerminalToken[];

export type DocsData = {
  metaBadges: MetaBadge[];
  hero: {
    badge: string;
    titlePrefix: string;
    titleHighlight: string;
    questionLead: string;
    question: string;
    stats: HeroStat[];
    corners: { blue: Corner; red: Corner };
  };
  chapter1: { kicker: string; title: string; timer: string; stages: Stage[] };
  chapter2: { kicker: string; title: string; hint: string; matchups: Matchup[] };
  chapter3: {
    kicker: string;
    title: string;
    wallet: { label: string; coins: number };
    tiers: BugTier[];
  };
  chapter4: { kicker: string; title: string; note: string; battlegrounds: Battleground[] };
  chapter5: {
    kicker: string;
    title: string;
    coder: Scorecard;
    detective: Scorecard;
    golden: { icon: string; title: string; rules: string[]; footer: string };
  };
  terminal: {
    label: string;
    title: string;
    file: string;
    cleanStatus: string;
    poisonedStatus: string;
    resetLabel: string;
    injectLabel: string;
    hint: string;
    compiler: string;
    cleanCode: TerminalLine[];
    poisonedCode: TerminalLine[];
  };
  footer: {
    title: string;
    subtitle: string;
    badges: { label: string; variant: "plain" | "primary" }[];
    copyright: string;
    clearance: string;
  };
};

export const docs: DocsData = {
  metaBadges: [
    {
      text: "ROUND 1: CODERS VS DETECTIVES (THE TECH MAFIA) \u{1F94A}\u26A1",
      tone: "secondary",
      ping: true,
    },
    { text: "IAI LAB // BTECH EDITION", tone: "surface" },
    {
      text: "OFFICIAL STORY MODE BATTLE LOG",
      tone: "primary",
      icon: "local_fire_department",
    },
  ],

  hero: {
    badge: "\u{1F579}\uFE0F RETRO BATTLE ROYALE MODE",
    titlePrefix: "CODERS VS DETECTIVES:",
    titleHighlight: "THE TECH MAFIA",
    questionLead: "The Burning Question:",
    question:
      "Can 4 innocent 1st-year C coders survive 2 minutes in a dark room with 4 evil bug-injecting detectives?",
    stats: [
      { label: "Battle Stakes", value: "Pride & Glory (and 100 PTS)", tone: "low" },
      { label: "Danger Level", value: "\u{1F6A8} 6 Sneaky Bug Coins", tone: "secondary" },
    ],
    corners: {
      blue: {
        tone: "blue",
        tag: "\u{1F7E6} BLUE CORNER // DEFENDERS",
        icon: "\u{1F6E1}\uFE0F",
        title: '"The Builders" (Coders)',
        description:
          '"Crying over missing semicolons, sweating under GCC -Wall, and desperately trying to build clean, honest modular C code before the clock strikes zero!"',
        traits: ["4 Coders", "Target: 100% Pass", "Weapon: Panic Fixes"],
      },
      red: {
        tone: "red",
        tag: "\u{1F7E5} RED CORNER // SABOTEURS",
        icon: "\u{1F575}\uFE0F\u200D\u2642\uFE0F",
        title: '"The Tech Mafia" (Detectives)',
        description:
          '"Armed with 6 sneaky attack tokens, ready to flip your + into -, invert boundary conditions, break return values, and laugh maniacally while tests fail!"',
        traits: ["4 Attackers", "Budget: 6 Tokens", "Weapon: Poison Diffs"],
      },
    },
  },

  chapter1: {
    kicker: "CHAPTER 01 // ARCADE CHRONOLOGY",
    title: "How The Heist Goes Down (20-Minute Match)",
    timer: "\u23F1\uFE0F MATCH TIMER: 1200 SECONDS",
    stages: [
      {
        time: "00:00 - 09:00",
        emoji: "\u{1F3D6}\uFE0F",
        label: "STAGE 01",
        title: '"The Honeymoon"',
        description:
          "Coders happily write their modular C code side-by-side, thinking life is good and compilers are their best friends. Everything compiles. Sunshine and rainbows.",
        status: "STATUS: FALSE SENSE OF SECURITY",
        tone: "tertiary",
      },
      {
        time: "09:00 - 11:00",
        emoji: "\u{1F6A8}",
        label: "STAGE 02 (2 MIN BLITZ)",
        title: '"The Infiltration"',
        description:
          "The lights flicker! Coders must take hands OFF keyboards! The Tech Mafia storms the workstation, spending up to 6 Attack Tokens to plant devious math traps and boundary landmines!",
        status: "STATUS: 6 TOKENS UNLEASHED",
        tone: "primary",
        active: true,
        emojiAnimate: true,
      },
      {
        time: "11:00 - 17:00",
        emoji: "\u{1F631}",
        label: "STAGE 03 (5 MIN REPAIR)",
        title: '"The Panic Room"',
        description:
          "Coders return and discover their calculator outputs 42 for every single number. Pure adrenaline! Stare down git diffs, hunt down corrupted logic, and patch the leaks before time expires!",
        status: "STATUS: CODE EMERGENCY SURGERY",
        tone: "secondary",
      },
      {
        time: "17:00 - 20:00",
        emoji: "\u2696\uFE0F",
        label: "STAGE 04",
        title: '"Judgment Day"',
        description:
          "Lead Judge executes the secret test harness with wicked edge-case values. Coders present oral defense. Did the code survive or does the Mafia take the championship bounty?",
        status: "STATUS: LIVE VERDICT & TROPHY",
        tone: "surface",
      },
    ],
  },

  chapter2: {
    kicker: "CHAPTER 02 // ROSTER ARCHETYPES",
    title: "Pick Your Fighter: 4v4 Tactical Face-Off",
    hint: "\u{1F3AF} DIRECT HEAD-TO-HEAD MATCHUPS",
    matchups: [
      {
        code: "MATCHUP 01: INPUT ZONE",
        icons: "\u{1F6AA}\u{1F4A5}",
        title: '"The Bouncer" vs "The Smuggler"',
        coder: {
          label: "Coder 1: The Bouncer \u{1F6E1}\uFE0F",
          mission:
            "Scan inputs with scanf, guard range limits, reject garbage strings, sanitize input buffers.",
        },
        detective: {
          label: "Detective 1: The Smuggler \u{1F9B9}",
          mission:
            "Break scanf format tags (%d into %c), remove bounds checking, let illegal negative numbers slide.",
        },
      },
      {
        code: "MATCHUP 02: MATH CORE",
        icons: "\u{1F9EE}\u{1F9E8}",
        title: '"The Mathematician" vs "The Saboteur"',
        coder: {
          label: "Coder 2: The Mathematician \u{1F4D0}",
          mission:
            "Craft the core mathematical formulas, handle division-by-zero checks, maintain precise variable accumulation.",
        },
        detective: {
          label: "Detective 2: The Saboteur \u{1F4A3}",
          mission:
            "Invert arithmetic operators (+ to -), sneak in off-by-one loop limits, subtly corrupt accumulator variables.",
        },
      },
      {
        code: "MATCHUP 03: BRANCH LOGIC",
        icons: "\u{1F511}\u{1F0CF}",
        title: '"The Gatekeeper" vs "The Trickster"',
        coder: {
          label: "Coder 3: The Gatekeeper \u26E9\uFE0F",
          mission:
            "Ensure rigid if/else conditions (e.g. marks >= 40), handle equal-value edge cases, trap zero values cleanly.",
        },
        detective: {
          label: "Detective 3: The Trickster \u{1F3AD}",
          mission:
            "Mutate boundary operators (>= into >), swap logical && with ||, introduce sneaky tie-breaker failures.",
        },
      },
      {
        code: "MATCHUP 04: SYSTEM INTEGRATION",
        icons: "\u{1F3DB}\uFE0F\u2702\uFE0F",
        title: '"The Architect" vs "The Cable Cutter"',
        coder: {
          label: "Coder 4: The Architect \u{1F3D7}\uFE0F",
          mission:
            "Glue all 4 functions in main(), verify clean argument passing, output strictly formatted final strings.",
        },
        detective: {
          label: "Detective 4: The Cable Cutter \u{1F50C}",
          mission:
            "Misdirect return values, alter parameter order, corrupt output printf specifiers to break automated graders.",
        },
      },
    ],
  },

  chapter3: {
    kicker: "CHAPTER 03 // EXPLOIT ECONOMY",
    title: "The Mafia Black Market (6 Bug Tokens)",
    wallet: { label: "MAFIA WALLET:", coins: 6 },
    tiers: [
      {
        tier: "TIER 01 EXPLOIT",
        cost: "1 \u{1FA99} COIN",
        title: '"The Annoying Pebble"',
        description:
          "Minor single-character boundary sabotage. Doesn't crash the program, but secretly fails borderline passing students!",
        diff: [
          { kind: "removed", text: "if (marks >= 40) // Pass mark" },
          { kind: "added", text: "+ if (marks > 40) // Rip student with 40" },
        ],
        effect: "Effect: Strips borderline cases cleanly.",
        tone: "secondary",
      },
      {
        tier: "TIER 02 EXPLOIT",
        cost: "2 \u{1FA99}\u{1FA99} COINS",
        title: '"The Wrecking Ball"',
        description:
          "Destroys core arithmetic calculation or loop counters. Instant fail on baseline multiplication or summation tests!",
        diff: [
          { kind: "removed", text: "total = a + b;" },
          { kind: "added", text: "+ total = a - b; /* HAHAHA */" },
        ],
        effect: "Effect: Fails all mathematical assertions.",
        tone: "primary",
      },
      {
        tier: "TIER 03 ULTIMATE",
        cost: "3 \u{1FA99}\u{1FA99}\u{1FA99} COINS",
        title: '"Dual Sabotage Chaos"',
        description:
          "Two coordinated simultaneous bugs across two different teammate modules. Coders blame each other while the Mafia giggles!",
        diff: [
          { kind: "added", text: "1: Mod 1 (scanf strips negative sign)" },
          { kind: "added", text: "2: Mod 4 (main prints inverted bool)" },
        ],
        effect: "Effect: Maximum cognitive disruption!",
        tone: "container",
        pulse: true,
      },
    ],
  },

  chapter4: {
    kicker: "CHAPTER 04 // THE BATTLEGROUND POOL",
    title: "The 6 Beginner C Battlegrounds",
    note: "One arena chosen at random by the Judge at 00:00 sharp. No external libraries allowed\u2014pure standard C!",
    battlegrounds: [
      {
        map: "MAP 01",
        danger: "DANGER: \u2B50\u2B50\u2B50",
        mapTone: "tertiaryFixed",
        title: "Simple Calculator",
        description:
          "Takes two floats and an arithmetic operator (+, -, *, /). Guards against the dreaded division by zero crash.",
        trivia:
          "Detectives love turning a + into - right before testing addition.",
        modules: "4 Modules: Parse \u2022 Choose Op \u2022 Calculate \u2022 Print Result",
      },
      {
        map: "MAP 02",
        danger: "DANGER: \u2B50\u2B50\u2B50",
        mapTone: "secondaryFixed",
        title: "Student Marks Calc",
        description:
          "Reads 3 subjects (0-100), validates passing rule (>= 40 in each), computes total sum and percentage grade.",
        trivia:
          "Target the 39 vs 40 mark boundary for instant edge-case elimination!",
        modules: "4 Modules: Validation \u2022 Summation \u2022 Percentage \u2022 Final Verdict",
      },
      {
        map: "MAP 03",
        danger: "DANGER: \u2B50\u2B50",
        mapTone: "primaryFixed",
        title: "Number Analyzer",
        description:
          "Determines if integer is positive, negative, or zero, plus checks parity (even or odd) using modulo %.",
        trivia:
          "What is zero? Neither positive nor negative. A golden trap for detectives.",
        modules: "4 Modules: Ingest \u2022 Sign Logic \u2022 Parity Modulo \u2022 Status Message",
      },
      {
        map: "MAP 04",
        danger: "DANGER: \u2B50\u2B50\u2B50",
        mapTone: "surface",
        title: "Multiplication Table",
        description:
          "Accepts integer N and prints formatted multiplication from 1 through 10 using a crisp for loop.",
        trivia: "Changing `i <= 10` to `i < 10` is subtle, brutal, and deadly.",
        modules: "4 Modules: Reader \u2022 Loop Bounds \u2022 Product Math \u2022 Print Grid",
      },
      {
        map: "MAP 05",
        danger: "DANGER: \u2B50\u2B50\u2B50\u2B50",
        mapTone: "secondaryFixed",
        title: "Largest of Three",
        description:
          "Ingests three arbitrary integers and returns the strictly largest number, rigorously handling tie cases!",
        trivia: "Test vector: (7, 7, 3). Does your algorithm break on duplicates?",
        modules: "4 Modules: Triplet Read \u2022 Logic Branch 1 \u2022 Logic Branch 2 \u2022 Winner",
      },
      {
        map: "MAP 06",
        danger: "DANGER: \u2B50\u2B50\u2B50\u2B50",
        mapTone: "primaryFixed",
        title: "Factorial Calculator",
        description:
          "Calculates factorial of non-negative integer N. Special validation for 0! = 1 and negative rejection.",
        trivia:
          "The zero factorial edge (0! = 1) is the ultimate trap for innocent coders!",
        modules: "4 Modules: Negative Trap \u2022 Zero Case \u2022 Loop Product \u2022 Print",
      },
    ],
  },

  chapter5: {
    kicker: "CHAPTER 05 // THE FINAL SCORE",
    title: "Scoring HUD & The Mafia Code of Honor",
    coder: {
      title: "Coder Scorecard \u{1F6E1}\uFE0F",
      badge: "MAX 100 PTS",
      badgeTone: "tertiaryFixed",
      rows: [
        { label: "4 Modules Implemented Correctly", pts: "20 PTS" },
        { label: "Initial Baseline Compiles Clean", pts: "10 PTS" },
        { label: "Introduced Bugs Found & Repaired", pts: "25 PTS" },
        { label: "Passes Hidden Automated Tests", pts: "20 PTS" },
        { label: "Proper Output Formatting Specs", pts: "15 PTS" },
        { label: "Oral Code Defense to the Judge", pts: "10 PTS" },
      ],
      victory: "VICTORY COND: 100% SUITE PASS & DEFENSE",
      ptTone: "tertiary",
      containerTone: "surface",
    },
    detective: {
      title: "Detective Scorecard \u{1F9B9}",
      badge: "MAX 100 PTS",
      badgeTone: "primaryFixed",
      rows: [
        { label: "4 Valid Planted Bug Attacks (10 ea)", pts: "40 PTS" },
        { label: "Attacks Unresolved Post-Debug", pts: "20 PTS" },
        { label: "Strategic Multi-Module Diversity", pts: "20 PTS" },
        { label: "Accurate Exploit Attack Log", pts: "10 PTS" },
        { label: "Team Coordination & Speed", pts: "10 PTS" },
        { label: "Useless whitespace change penalty", pts: "0 PTS", muted: true },
      ],
      victory: "VICTORY COND: UNRESOLVED BUGS TRIPPING HARNESS",
      ptTone: "primary",
      containerTone: "surface",
    },
    golden: {
      icon: "\u{1F4DC}",
      title: "Golden Mafia Code",
      rules: [
        "All code must be written live on the stage arena. No pre-written thumb-drive scripts!",
        "Original baseline code is snapshotted to git before the 2-minute infiltration starts.",
        "Detectives may only mutate the candidate C functions\u2014no deleting the test runner!",
        "Every single builder must orally explain their assigned function to the lead judge.",
        "Judges' automated test harness decisions are absolute and final!",
      ],
      footer: "\u2694\uFE0F May the best C programmers win \u2694\uFE0F",
    },
  },

  terminal: {
    label: "SANDBOX SIMULATOR",
    title: "Live Bug Injection Previewer",
    file: "solution_p1_calculator.c",
    cleanStatus: "STATUS: CLEAN (0 INJECTIONS)",
    poisonedStatus: "STATUS: \u{1F6A8} INJECTED (FAILING MULTIPLICATION CASES)",
    resetLabel: "Reset Clean Code",
    injectLabel: "Inject 2-Token Flaw",
    hint: 'Click "Inject 2-Token Flaw" to observe how the Detective Team introduces sneaky calculation drift during the 2-minute window.',
    compiler: "Compiler: GCC 11.4 \u2022 Flag: -Wall -O2",
    cleanCode: [
      [
        { text: "// MODULE 2: ARITHMETIC CALCULATION (Coder 2)", tone: "comment" },
      ],
      [
        { text: "float", tone: "keyword" },
        { text: " calculate(" },
        { text: "float", tone: "keyword" },
        { text: " a, " },
        { text: "float", tone: "keyword" },
        { text: " b, " },
        { text: "char", tone: "keyword" },
        { text: " op) {" },
      ],
      [
        { text: "    " },
        { text: "if", tone: "keyword" },
        { text: " (op == " },
        { text: "'+'", tone: "string" },
        { text: ") " },
        { text: "return", tone: "keyword" },
        { text: " a + b;" },
      ],
      [
        { text: "    " },
        { text: "if", tone: "keyword" },
        { text: " (op == " },
        { text: "'-'", tone: "string" },
        { text: ") " },
        { text: "return", tone: "keyword" },
        { text: " a - b;" },
      ],
      [
        { text: "    " },
        { text: "if", tone: "keyword" },
        { text: " (op == " },
        { text: "'*'", tone: "string" },
        { text: ") " },
        { text: "return", tone: "keyword" },
        { text: " a * b;" },
      ],
      [
        { text: "    " },
        { text: "if", tone: "keyword" },
        { text: " (op == " },
        { text: "'/'", tone: "string" },
        { text: ") {" },
      ],
      [
        { text: "        " },
        { text: "if", tone: "keyword" },
        { text: " (b == 0) " },
        { text: "return", tone: "keyword" },
        { text: " -1; " },
        { text: "// div-by-zero check", tone: "comment" },
      ],
      [
        { text: "        " },
        { text: "return", tone: "keyword" },
        { text: " a / b;" },
      ],
      [{ text: "    }" }],
      [
        { text: "    " },
        { text: "return", tone: "keyword" },
        { text: " 0;" },
      ],
      [{ text: "}" }],
    ],
    poisonedCode: [
      [
        { text: "// MODULE 2: ARITHMETIC CALCULATION (Coder 2)", tone: "comment" },
      ],
      [
        { text: "float", tone: "keyword" },
        { text: " calculate(" },
        { text: "float", tone: "keyword" },
        { text: " a, " },
        { text: "float", tone: "keyword" },
        { text: " b, " },
        { text: "char", tone: "keyword" },
        { text: " op) {" },
      ],
      [
        { text: "    " },
        { text: "if", tone: "keyword" },
        { text: " (op == " },
        { text: "'+'", tone: "string" },
        { text: ") " },
        { text: "return", tone: "keyword" },
        { text: " a + b;" },
      ],
      [
        { text: "    " },
        { text: "if", tone: "keyword" },
        { text: " (op == " },
        { text: "'-'", tone: "string" },
        { text: ") " },
        { text: "return", tone: "keyword" },
        { text: " a - b;" },
      ],
      [
        { text: "    " },
        { text: "if", tone: "keyword" },
        { text: " (op == " },
        { text: "'*'", tone: "string" },
        { text: ") " },
        {
          text: "return a + b; /* INJECTED: TIER 2 DEFECT (-2 TOKENS) */",
          tone: "inject",
        },
      ],
      [
        { text: "    " },
        { text: "if", tone: "keyword" },
        { text: " (op == " },
        { text: "'/'", tone: "string" },
        { text: ") {" },
      ],
      [
        { text: "        " },
        { text: "if", tone: "keyword" },
        { text: " (b == 0) " },
        { text: "return", tone: "keyword" },
        { text: " -1; " },
        { text: "// div-by-zero check", tone: "comment" },
      ],
      [
        { text: "        " },
        { text: "return", tone: "keyword" },
        { text: " a / b;" },
      ],
      [{ text: "    }" }],
      [
        { text: "    " },
        { text: "return", tone: "keyword" },
        { text: " 0;" },
      ],
      [{ text: "}" }],
    ],
  },

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
