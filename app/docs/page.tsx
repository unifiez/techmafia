"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/client/api";
import {
  docs,
  type Battleground,
  type BugTier,
  type Matchup,
  type MetaBadge,
  type Scorecard,
  type Stage,
  type TerminalLine,
  type TerminalToken,
} from "./docs-data";

/* ---------------------------------------------------------------- badges */

const META_TONE: Record<MetaBadge["tone"], string> = {
  secondary: "bg-secondary-container text-on-secondary-container",
  surface: "bg-surface-container-lowest text-on-surface",
  primary: "bg-primary-container text-on-primary-container",
};

const STAGE_CARD: Record<Stage["tone"], string> = {
  tertiary: "bg-surface-container-lowest border-black",
  primary: "bg-primary-fixed/40 border-primary ring-2 ring-primary",
  secondary: "bg-secondary-container/30 border-black",
  surface: "bg-surface-container-lowest border-black",
};

const STAGE_TIME: Record<Stage["tone"], string> = {
  tertiary: "bg-tertiary-fixed text-on-tertiary-container",
  primary: "bg-primary text-on-primary",
  secondary: "bg-secondary-fixed text-on-secondary-fixed",
  surface: "bg-surface-container-highest text-on-surface",
};

const STAGE_ACCENT: Record<Stage["tone"], string> = {
  tertiary: "text-tertiary",
  primary: "text-primary",
  secondary: "text-secondary",
  surface: "text-on-surface",
};

const MAP_TONE: Record<Battleground["mapTone"], string> = {
  tertiaryFixed: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  secondaryFixed: "bg-secondary-fixed text-on-secondary-fixed",
  primaryFixed: "bg-primary-fixed text-on-primary-fixed",
  surface: "bg-surface-container-highest text-on-surface",
};

const TIER_BADGE: Record<BugTier["tone"], string> = {
  secondary: "bg-secondary-fixed text-on-secondary-fixed",
  primary: "bg-primary-fixed text-on-primary-fixed",
  container: "bg-primary-container text-on-primary-container animate-pulse",
};

const SCORE_BADGE: Record<Scorecard["badgeTone"], string> = {
  tertiaryFixed: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  primaryFixed: "bg-primary-fixed text-on-primary-fixed",
};

const TOKEN_TONE: Record<NonNullable<TerminalToken["tone"]>, string> = {
  comment: "text-[#8c706f]",
  keyword: "text-secondary-fixed",
  string: "text-primary-container",
  inject: "text-primary font-bold bg-primary/20 px-1 border border-primary",
};

/* ------------------------------------------------------------ components */

function TerminalCode({ lines }: { lines: TerminalLine[] }) {
  return (
    <pre className="whitespace-pre">
      <code>
        {lines.map((line, i) => (
          <div key={i}>
            {line.map((token, j) => (
              <span key={j} className={token.tone ? TOKEN_TONE[token.tone] : undefined}>
                {token.text}
              </span>
            ))}
          </div>
        ))}
      </code>
    </pre>
  );
}

function MatchupCard({ matchup }: { matchup: Matchup }) {
  return (
    <div className="bg-surface-container-lowest border-[3px] border-black p-6 space-y-4">
      <div className="flex items-center justify-between border-b-[2px] border-black pb-3">
        <span className="px-2.5 py-0.5 bg-surface-container border border-black font-code text-label-sm font-bold">
          {matchup.code}
        </span>
        <span className="text-xl">{matchup.icons}</span>
      </div>
      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
        {matchup.title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 bg-tertiary-fixed/30 border-[2px] border-black space-y-1">
          <div className="font-label-sm text-label-sm font-bold text-tertiary">
            {matchup.coder.label}
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
            <strong>Your Mission:</strong> {matchup.coder.mission}
          </p>
        </div>
        <div className="p-3 bg-primary-fixed/40 border-[2px] border-black space-y-1">
          <div className="font-label-sm text-label-sm font-bold text-primary">
            {matchup.detective.label}
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
            <strong>Your Mission:</strong> {matchup.detective.mission}
          </p>
        </div>
      </div>
    </div>
  );
}

function ScorecardView({ card }: { card: Scorecard }) {
  return (
    <div className="lg:col-span-4 bg-surface-container-lowest border-[3px] border-black p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b-[2px] border-black mb-4">
          <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
            {card.title}
          </span>
          <span
            className={`px-3 py-1 border-[2px] border-black font-code text-label-sm font-bold ${SCORE_BADGE[card.badgeTone]}`}
          >
            {card.badge}
          </span>
        </div>
        <div className="space-y-2.5 font-body-sm text-body-sm">
          {card.rows.map((row) => (
            <div
              key={row.label}
              className={
                row.muted
                  ? "flex justify-between items-center p-2 bg-surface-container-high border border-black text-label-sm opacity-80"
                  : "flex justify-between items-center p-2 bg-surface-container-low border border-black"
              }
            >
              <span>{row.label}</span>
              <span
                className={`font-code font-bold ${
                  card.ptTone === "tertiary" ? "text-tertiary" : "text-primary"
                }`}
              >
                {row.pts}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div
        className={`mt-6 pt-3 border-t-[2px] border-black font-label-sm text-label-sm font-bold text-center ${
          card.ptTone === "tertiary" ? "text-tertiary" : "text-primary"
        }`}
      >
        {card.victory}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- page */

type LiveStats = {
  dbAvailable: boolean;
  registered: { teams: number; members: number };
  matches: { total: number; live: number; finalized: number; scheduled: number };
  tokensPlanted: number;
  round: { label: string; round: number; phase: string; secondsLeft: number } | null;
};

export default function DocsPage() {
  const [injected, setInjected] = useState(false);
  const [live, setLive] = useState<LiveStats | null>(null);

  useEffect(() => {
    let stop = false;
    const load = async () => {
      const res = await apiGet<{ stats: LiveStats }>("/api/overview");
      if (!stop && res.ok) setLive(res.data.stats);
    };
    void load();
    const id = setInterval(() => void load(), 10000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  const {
    metaBadges,
    hero,
    chapter1,
    chapter2,
    chapter3,
    chapter4,
    chapter5,
    terminal,
  } = docs;

  return (
    <div className="w-full">
      <div className="max-w-[1400px] mx-auto w-full px-gutter py-space-lg flex flex-col gap-space-xl">
        {/* ==================== 1. HERO / VS ARENA ==================== */}
        <section className="relative">
          {/* Top Meta Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex flex-wrap items-center gap-2">
              {metaBadges.slice(0, 2).map((badge) => (
                <span
                  key={badge.text}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 border-[2.5px] border-black font-label-sm text-label-sm uppercase ${META_TONE[badge.tone]}`}
                >
                  {badge.ping ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                  ) : null}
                  {badge.text}
                </span>
              ))}
            </div>
            {metaBadges.slice(2).map((badge) => (
              <div
                key={badge.text}
                className={`inline-flex items-center gap-1.5 px-3 py-1 border-[2.5px] border-black font-label-sm text-label-sm font-bold ${META_TONE[badge.tone]}`}
              >
                {badge.icon ? (
                  <span className="material-symbols-outlined text-[16px]">{badge.icon}</span>
                ) : null}
                {badge.text}
              </div>
            ))}
          </div>

          {/* Live event status (dynamic) */}
          <div className="mb-5 grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="bg-surface-container-low border-[2.5px] border-black px-3 py-2">
              <div className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">Teams Registered</div>
              <div className="font-headline-sm text-headline-sm text-primary font-bold">
                {live ? live.registered.teams : "—"}
              </div>
            </div>
            <div className="bg-surface-container-low border-[2.5px] border-black px-3 py-2">
              <div className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">Players Checked In</div>
              <div className="font-headline-sm text-headline-sm text-primary font-bold">
                {live ? live.registered.members : "—"}
              </div>
            </div>
            <div className="bg-surface-container-low border-[2.5px] border-black px-3 py-2">
              <div className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">Matches Live</div>
              <div className="font-headline-sm text-headline-sm text-primary font-bold">
                {live ? live.matches.live : "—"}
                <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">
                  {live ? ` · ${live.matches.finalized} done` : ""}
                </span>
              </div>
            </div>
            <div className="bg-surface-container-low border-[2.5px] border-black px-3 py-2">
              <div className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">Current Round</div>
              <div className="font-headline-sm text-headline-sm text-primary font-bold truncate">
                {live?.round ? `R${String(live.round.round).padStart(2, "0")} · ${live.round.phase.toUpperCase()}` : "STANDBY"}
              </div>
            </div>
          </div>
          {live && !live.dbAvailable ? (
            <div className="mb-5 px-3 py-1.5 bg-surface-container border-[2px] border-black font-body-sm text-body-sm text-on-surface-variant">
              Live database not connected — stats will appear once the event store is online.
            </div>
          ) : null}

          {/* Hero Banner */}
          <div className="bg-surface-container-lowest border-[3.5px] border-black p-6 sm:p-10 space-y-6 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-fixed border-[2px] border-black font-label-sm text-label-sm text-on-secondary-fixed uppercase tracking-wider font-extrabold">
                  {hero.badge}
                </div>
                <h1 className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight">
                  {hero.titlePrefix}{" "}
                  <span className="bg-primary text-on-primary px-3 py-0.5 border-[3px] border-black">
                    {hero.titleHighlight}
                  </span>
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant font-medium">
                  <strong className="text-on-surface underline decoration-primary decoration-4">
                    {hero.questionLead}
                  </strong>{" "}
                  {hero.question}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-row sm:flex-col gap-3 min-w-[220px]">
                {hero.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className={
                      stat.tone === "low"
                        ? "flex-1 bg-surface-container-low border-[2.5px] border-black p-3.5"
                        : "flex-1 bg-secondary-container/40 border-[2.5px] border-black p-3.5"
                    }
                  >
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                      {stat.label}
                    </div>
                    <div
                      className={`font-headline-sm text-headline-sm font-bold ${
                        stat.tone === "low" ? "text-primary" : "text-on-surface"
                      }`}
                    >
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* VS Face-off */}
            <div className="relative bg-surface border-[3px] border-black p-6 sm:p-8 mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-center">
                {/* Blue corner */}
                <div className="lg:col-span-5 bg-tertiary-fixed/40 border-[3px] border-black p-5 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-tertiary text-on-tertiary font-label-sm text-label-sm font-bold border-[1.5px] border-black">
                      {hero.corners.blue.tag}
                    </span>
                    <span className="text-2xl">{hero.corners.blue.icon}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                    {hero.corners.blue.title}
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant italic">
                    {hero.corners.blue.description}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {hero.corners.blue.traits.map((trait) => (
                      <span
                        key={trait}
                        className="px-2 py-0.5 bg-surface-container-lowest border border-black font-code text-label-sm font-bold text-on-surface"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>

                {/* VS emblem */}
                <div className="lg:col-span-1 flex flex-col items-center justify-center -my-2 lg:-my-0">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-secondary-fixed border-[3.5px] border-black rounded-full flex items-center justify-center transform hover:rotate-12 transition-transform cursor-pointer">
                    <span className="font-headline-xl text-3xl font-extrabold text-on-secondary-fixed">
                      VS
                    </span>
                    <span className="absolute -top-2 -right-2 text-xl">&#9889;</span>
                    <span className="absolute -bottom-2 -left-2 text-xl">&#128165;</span>
                  </div>
                </div>

                {/* Red corner */}
                <div className="lg:col-span-5 bg-primary-fixed/50 border-[3px] border-black p-5 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-primary text-on-primary font-label-sm text-label-sm font-bold border-[1.5px] border-black">
                      {hero.corners.red.tag}
                    </span>
                    <span className="text-2xl">{hero.corners.red.icon}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                    {hero.corners.red.title}
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant italic">
                    {hero.corners.red.description}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {hero.corners.red.traits.map((trait) => (
                      <span
                        key={trait}
                        className="px-2 py-0.5 bg-surface-container-lowest border border-black font-code text-label-sm font-bold text-on-surface"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 2. CHAPTER 1 ==================== */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-extrabold">
                {chapter1.kicker}
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">
                {chapter1.title}
              </h2>
            </div>
            <div className="font-code text-code text-on-surface-variant bg-surface-container-high px-3 py-1 border-[2px] border-black">
              {chapter1.timer}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {chapter1.stages.map((stage) => (
              <div
                key={stage.time}
                className={`border-[3px] p-5 flex flex-col justify-between hover:translate-y-[-2px] transition-all ${STAGE_CARD[stage.tone]}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 border border-black font-code text-label-sm font-bold ${STAGE_TIME[stage.tone]}`}
                    >
                      {stage.time}
                    </span>
                    <span className={`text-2xl ${stage.emojiAnimate ? "animate-bounce" : ""}`}>
                      {stage.emoji}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`font-label-sm text-label-sm font-bold uppercase tracking-wider ${STAGE_ACCENT[stage.tone]}`}
                    >
                      {stage.label}
                    </span>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      {stage.title}
                    </h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {stage.description}
                  </p>
                </div>
                <div
                  className={`mt-4 pt-3 border-t border-black/20 font-label-sm text-label-sm font-bold ${STAGE_ACCENT[stage.tone]}`}
                >
                  {stage.status}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ==================== 3. CHAPTER 2 ==================== */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="font-label-sm text-label-sm text-tertiary uppercase tracking-widest font-extrabold">
                {chapter2.kicker}
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">
                {chapter2.title}
              </h2>
            </div>
            <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed px-3 py-1 border-[2px] border-black font-bold">
              {chapter2.hint}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {chapter2.matchups.map((matchup) => (
              <MatchupCard key={matchup.code} matchup={matchup} />
            ))}
          </div>
        </section>

        {/* ==================== 4. CHAPTER 3 ==================== */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="font-label-sm text-label-sm text-primary uppercase tracking-widest font-extrabold">
                {chapter3.kicker}
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">
                {chapter3.title}
              </h2>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-surface-container-highest border-[2.5px] border-black">
              <span className="font-label-sm text-label-sm text-on-surface font-extrabold uppercase mr-1">
                {chapter3.wallet.label}
              </span>
              {Array.from({ length: chapter3.wallet.coins }, (_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-secondary-fixed border-[2px] border-black flex items-center justify-center font-bold text-on-secondary-fixed text-label-sm animate-bounce"
                  style={{ animationDelay: `${(i + 1) * 0.1}s` }}
                >
                  &#129689;
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {chapter3.tiers.map((tier) => (
              <div
                key={tier.tier}
                className={`bg-surface-container-lowest p-6 flex flex-col justify-between hover:translate-y-[-2px] transition-transform ${
                  tier.tone === "container"
                    ? "border-[3.5px] border-black relative overflow-hidden"
                    : "border-[3px] border-black"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 border-[2px] border-black font-label-sm text-label-sm font-bold ${TIER_BADGE[tier.tone]}`}
                    >
                      {tier.tier}
                    </span>
                    <span className="px-2.5 py-0.5 bg-surface-container border border-black font-label-sm text-label-sm font-bold">
                      {tier.cost}
                    </span>
                  </div>
                  <div>
                    <h3
                      className={`font-headline-sm text-headline-sm font-bold ${
                        tier.tone === "container" ? "text-primary" : "text-on-surface"
                      }`}
                    >
                      {tier.title}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      {tier.description}
                    </p>
                  </div>
                  <div className="p-3 bg-surface-container-highest border-[2px] border-black font-code text-label-sm space-y-1">
                    {tier.diff.map((line, i) => (
                      <div
                        key={i}
                        className={
                          line.kind === "removed"
                            ? "text-on-surface-variant line-through opacity-70"
                            : "text-primary font-bold flex items-center gap-1"
                        }
                      >
                        {line.text}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-black/20 font-label-sm text-label-sm text-on-surface-variant font-bold">
                  {tier.effect}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ==================== 5. CHAPTER 4 ==================== */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="font-label-sm text-label-sm text-tertiary uppercase tracking-widest font-extrabold">
                {chapter4.kicker}
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">
                {chapter4.title}
              </h2>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
              {chapter4.note}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chapter4.battlegrounds.map((bg) => (
              <div
                key={bg.map}
                className="bg-surface-container-lowest border-[3px] border-black p-5 flex flex-col justify-between hover:translate-y-[-2px] transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 border border-black font-code text-label-sm font-bold ${MAP_TONE[bg.mapTone]}`}
                    >
                      {bg.map}
                    </span>
                    <span className="font-label-sm font-bold px-2 py-0.5 bg-secondary-fixed border border-black">
                      {bg.danger}
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {bg.title}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {bg.description}
                  </p>
                  <div className="p-2.5 bg-surface-container-low border border-black font-body-sm text-body-sm text-on-surface-variant italic">
                    &#128161; <strong>Mafia Trivia:</strong> {bg.trivia}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-black/20 font-label-sm text-label-sm font-bold text-on-surface">
                  {bg.modules}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ==================== 6. CHAPTER 5 ==================== */}
        <section className="space-y-6">
          <div>
            <div className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-extrabold">
              {chapter5.kicker}
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              {chapter5.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <ScorecardView card={chapter5.coder} />
            <ScorecardView card={chapter5.detective} />

            {/* Golden Mafia Code */}
            <div className="lg:col-span-4 bg-secondary-container/20 border-[3px] border-black p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b-[2px] border-black mb-4">
                  <span className="text-2xl">{chapter5.golden.icon}</span>
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {chapter5.golden.title}
                  </span>
                </div>
                <ul className="space-y-3 font-body-sm text-body-sm text-on-surface">
                  {chapter5.golden.rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary font-bold">
                        {String(i + 1).padStart(2, "0")}.
                      </span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 p-2.5 bg-surface-container-lowest border-[2px] border-black text-center">
                <span className="font-label-sm text-label-sm text-secondary uppercase font-extrabold">
                  {chapter5.golden.footer}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== INTERACTIVE TERMINAL SIMULATOR ==================== */}
        <section className="bg-surface-container-lowest border-[3.5px] border-black p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-[2.5px] border-black mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface-container-highest border-[2px] border-black flex items-center justify-center font-bold">
                &gt;_
              </div>
              <div>
                <div className="font-label-sm text-label-sm text-primary uppercase font-bold">
                  {terminal.label}
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  {terminal.title}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInjected(false)}
                className="px-3 py-1.5 bg-surface-container-low hover:bg-surface-container border-[2px] border-black font-label-sm text-label-sm text-on-surface active:translate-x-[1px] active:translate-y-[1px] transition-all"
              >
                {terminal.resetLabel}
              </button>
              <button
                type="button"
                onClick={() => setInjected(true)}
                className="px-3.5 py-1.5 bg-primary-container hover:bg-primary-container/90 border-[2px] border-black font-label-sm text-label-sm text-on-primary-container active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1 font-bold"
              >
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                {terminal.injectLabel}
              </button>
            </div>
          </div>

          {/* Code terminal */}
          <div className="bg-[#1e1c10] text-[#f4eeda] p-4 sm:p-6 border-[2.5px] border-black font-code text-code leading-relaxed overflow-x-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#8c706f]/40 text-[#8c706f] font-label-sm text-label-sm">
              <span>{terminal.file}</span>
              <span
                className={
                  injected
                    ? "text-primary-container font-bold animate-pulse"
                    : "text-tertiary-container font-bold"
                }
              >
                {injected ? terminal.poisonedStatus : terminal.cleanStatus}
              </span>
            </div>
            <TerminalCode lines={injected ? terminal.poisonedCode : terminal.cleanCode} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between text-on-surface-variant font-body-sm text-body-sm gap-2">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">info</span>
              {terminal.hint}
            </span>
            <span className="font-code text-label-sm text-on-surface">
              {terminal.compiler}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
