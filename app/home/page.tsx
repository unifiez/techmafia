"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { hero, cards, matchStatus, HomeCard, Tone } from "./home-data";

// Full class strings so Tailwind can see them (no `bg-${tone}-...`)
const TONE: Record<
  Tone,
  { card: string; badge: string; icon: string; eyebrow: string; title: string; body: string; btn: string }
> = {
  primary: {
    card: "bg-primary-container",
    badge: "bg-surface-container-lowest text-on-surface",
    icon: "text-on-primary-container",
    eyebrow: "text-on-primary-container",
    title: "text-on-primary-container",
    body: "text-on-primary-container",
    btn: "bg-surface-container-lowest hover:bg-secondary-container",
  },
  secondary: {
    card: "bg-secondary-container",
    badge: "bg-surface-container-lowest text-on-surface",
    icon: "text-on-secondary-container",
    eyebrow: "text-on-secondary-container",
    title: "text-on-secondary-container",
    body: "text-on-secondary-container",
    btn: "bg-surface-container-lowest hover:bg-surface",
  },
  surface: {
    card: "bg-surface-container-lowest",
    badge: "bg-surface-container-high text-on-surface",
    icon: "text-tertiary",
    eyebrow: "text-outline",
    title: "text-on-surface",
    body: "text-on-surface-variant",
    btn: "bg-surface-container hover:bg-surface-container-high",
  },
  container: {
    card: "bg-tertiary-fixed",
    badge: "bg-surface-container-lowest text-on-surface",
    icon: "text-tertiary",
    eyebrow: "text-on-tertiary-fixed-variant",
    title: "text-on-tertiary-fixed",
    body: "text-on-tertiary-fixed",
    btn: "bg-surface-container-lowest hover:bg-surface",
  },
};

function formatClock(total: number) {
  const m = Math.floor(total / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function HomeCardComponent({ card, clock }: { card: HomeCard; clock?: string }) {
  const t = TONE[card.tone];
  return (
    <div
      className={`relative ${t.card} border-[3px] border-black p-6 flex flex-col justify-between group hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform`}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span
            className={`px-2.5 py-1 ${t.badge} border-[2px] border-black font-label-sm text-label-sm uppercase font-bold flex items-center gap-1.5`}
          >
            {card.id === "compete" && (
              <span className="w-2 h-2 rounded-full bg-error animate-ping" />
            )}
            {card.badge}
          </span>
          <span className={`material-symbols-outlined text-[32px] ${t.icon}`}>
            {card.icon}
          </span>
        </div>

        <div>
          <span className={`font-code text-code ${t.eyebrow} tracking-wider uppercase`}>
            {card.eyebrow}
          </span>
          <h2 className={`font-headline-lg text-headline-lg ${t.title} uppercase leading-none mt-1`}>
            {card.title}
          </h2>

          {card.rank && (
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`font-headline-xl text-headline-xl leading-none ${t.title}`}>
                {card.rank}
              </span>
              <span className={`font-label-md text-label-md ${t.title} uppercase font-bold`}>
                {card.points}
              </span>
            </div>
          )}

          {card.description && (
            <p className={`font-body-sm text-body-sm ${t.body} mt-2 ${card.id === "compete" ? "opacity-90" : ""}`}>
              {card.description}
            </p>
          )}

          {card.roster && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {card.roster.map((r) => (
                <div key={r.label} className="p-1.5 bg-surface-container border border-black text-center">
                  <span className="font-code text-[11px] block text-on-surface-variant">{r.label}</span>
                  <span
                    className={`font-label-sm text-label-sm uppercase font-bold ${r.lead ? "text-primary" : "text-on-surface"}`}
                  >
                    {r.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {clock && (
          <div className="p-3 bg-surface border-[2px] border-black">
            <div className="flex justify-between items-center font-code text-code text-on-surface">
              <span>MATCH CLOCK:</span>
              <span className="font-bold text-primary text-[16px]">{clock}</span>
            </div>
          </div>
        )}

        {card.tags && (
          <div className="flex items-center gap-2 pt-1">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="inline-block px-2 py-0.5 bg-surface-container-lowest border border-black font-code text-[11px] font-bold"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-6">
        <Link
          href={card.buttonHref}
          className={`w-full inline-flex items-center justify-center gap-2 py-3 ${t.btn} text-on-surface border-[2.5px] border-black hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px] transition-all font-label-md text-label-md uppercase`}
        >
          <span>{card.buttonText}</span>
          <span className="material-symbols-outlined text-[18px]">{card.buttonIcon}</span>
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [timerSeconds, setTimerSeconds] = useState(matchStatus.totalSeconds);

  useEffect(() => {
    const id = setInterval(() => setTimerSeconds((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-8 w-full space-y-10">
        {/* HERO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-[3px] border-black pb-8">
          <div className="space-y-3">
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight uppercase leading-none">
              {hero.title}
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              Welcome back,{" "}
              <strong className="text-on-surface underline decoration-primary decoration-4">
                {hero.agent}
              </strong>{" "}
              [{hero.team}]. Matchday 2026 is{" "}
              <span className="bg-primary-container text-on-primary-container px-2 py-0.5 border border-black font-label-md uppercase">
                LIVE
              </span>
              . {hero.tagline}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-end">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest text-on-surface border-[2.5px] border-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4.5px_4.5px_0_0_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all font-label-md text-label-md uppercase">
              <span className="material-symbols-outlined text-[18px]">terminal</span>
              Lets Cook
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary border-[2.5px] border-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4.5px_4.5px_0_0_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all font-label-md text-label-md uppercase">
              <span className="material-symbols-outlined text-[18px]">emergency</span>
              Panic Pause
            </button>
          </div>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <HomeCardComponent
              key={card.id}
              card={card}
              clock={card.showClock ? formatClock(timerSeconds) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}