// All dynamic data for the Home page. Edit only this file.

export type Tone = "primary" | "secondary" | "surface" | "container";

export type HomeCard = {
  id: string;
  badge: string;
  eyebrow: string;
  title: string;
  description?: string;
  showClock?: boolean;
  rank?: string;
  points?: string;
  roster?: { label: string; name: string; lead?: boolean }[];
  tags?: string[];
  buttonText: string;
  buttonHref: string;
  buttonIcon: string;
  icon: string;
  tone: Tone;
};

export const hero = {
  title: "FIND THE HACKER",
  agent: "Agent Aarav",
  team: "Team Sher-8492",
  tagline:
    "Coders build and defend the C program, Detectives burn attack tokens. Let's go, yaar!",
};

export const cards: HomeCard[] = [
  {
    id: "compete",
    badge: "ROUND 1 LIVE",
    eyebrow: "01 // CODING PHASE",
    title: "ARENA",
    description:
      "4v4 face-off: Coders vs Detectives. Beginner-level C, 20-minute match. Timer full speed pe chal raha hai!",
    showClock: true,
    buttonText: "ENTER ARENA",
    buttonHref: "/compete",
    buttonIcon: "arrow_forward",
    icon: "swords",
    tone: "primary",
  },
  {
    id: "leaderboard",
    badge: "LEADERBOARD // TOP 5%",
    eyebrow: "02 // SCOREBOARD",
    title: "RANKS",
    rank: "#03",
    points: "850 PTS",
    description: "Delta to #01: -45 PTS. Clean repair streak going strong, bro.",
    buttonText: "FULL STANDINGS",
    buttonHref: "/leaderboard",
    buttonIcon: "trending_up",
    icon: "military_tech",
    tone: "secondary",
  },
  {
    id: "squad",
    badge: "CODER TEAM 4/4",
    eyebrow: "03 // CODER TEAM ROSTER",
    title: "SQUAD",
    roster: [
      { label: "CODER 1", name: "Aarav (L)", lead: true },
      { label: "CODER 2", name: "Diya" },
      { label: "CODER 3", name: "Rohan" },
      { label: "CODER 4", name: "Meera" },
    ],
    buttonText: "TEAM SETUP",
    buttonHref: "/team",
    buttonIcon: "manage_accounts",
    icon: "groups",
    tone: "surface",
  },
  {
    id: "docs",
    badge: "RULEBOOK V1.0",
    eyebrow: "04 // FAIR PLAY",
    title: "RULES",
    description:
      "Coders set up a working baseline before attacks begin. Detectives spend 6 shared attack tokens to plant valid bugs. No tampering with the judge, yaar.",
    tags: ["6 ATTACK TOKENS", "C ONLY // FAIR PLAY"],
    buttonText: "READ RULEBOOK",
    buttonHref: "/docs",
    buttonIcon: "terminal",
    icon: "menu_book",
    tone: "container",
  },
];

export const matchStatus = {
  totalSeconds: 1182,
};