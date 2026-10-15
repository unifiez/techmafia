// Static copy + shared types for the Home page.
// The cards themselves are built from live API data in page.tsx.

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
  tagline:
    "Coders build and defend the C program, Detectives burn attack tokens. Let's go, yaar!",
};

// NOTE: the home page cards are now built from live API data (see page.tsx).
// Only genuine static copy lives here.