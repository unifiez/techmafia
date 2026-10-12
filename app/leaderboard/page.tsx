"use client";

import { useState } from "react";
import { leaderboard } from "./leaderboard-data";

/* ------------------------------------------------------ theme helpers */

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

/* ---------------------------------------------------------- components */

function StatusBadge({ tone, label, icon }: { tone: "primary" | "secondary" | "surface" | "container"; label: string; icon?: string }) {
  const bg = STATUS_TONE_BG[tone]
  const txt = STATUS_TONE_TEXT[tone]
  return (
    <span className={`inline-block px-2 py-0.5 ${bg} border-[1.5px] border-black font-label-sm text-label-sm uppercase font-bold ${txt}`}>
      {icon ? (
        <span className="material-symbols-outlined text-[10px]">{icon}</span>
      ) : null}
      {label}
    </span>
  )
}

function RankRow({ rank, team, solved, planted, repaired, points, status, statusTone, isCurrentTeam }: {
  rank: number; team: string; solved: number; planted: number; repaired: number; integrity: string; points: number; status: string; statusTone: "primary" | "secondary" | "surface" | "container"; isCurrentTeam?: boolean
}) {
  const statusBadge = (
    <span className={`inline-block px-2 py-0.5 ${STATUS_TONE_BG[statusTone]} border-[1.5px] border-black font-label-sm text-label-sm uppercase font-bold ${STATUS_TONE_TEXT[statusTone]}`}>
      {status}
    </span>
  )
  return (
    <tr className={`hover:bg-secondary-container/20 transition-colors ${isCurrentTeam ? "bg-secondary-container/30 border-l-[6px] border-l-primary hover:bg-secondary-container/40 transition-colors" : ""}`}>
      <td className="py-space-sm px-space-md border-r-[2px] border-black text-center">
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${STATUS_TONE_BG[statusTone]} border-[1.5px] border-black font-code text-code font-bold`}>
          {rank}
        </span>
      </td>
      <td className="py-space-sm px-space-md border-r-[2px] border-black font-headline-sm text-headline-sm uppercase">
        <div className="flex items-center gap-space-xs">
          <span>{team}</span>
          {isCurrentTeam && (
            <span className="px-1.5 py-0.2 bg-primary text-on-primary text-[10px] font-bold border border-black uppercase">
              YOU
            </span>
          )}
        </div>
      </td>
      <td className="py-space-sm px-space-md border-r-[2px] border-black font-code text-code text-center font-bold">
        {solved}
      </td>
      <td className="py-space-sm px-space-md border-r-[2px] border-black font-code text-code text-center">
        {planted}
      </td>
      <td className="py-space-sm px-space-md border-r-[2px] border-black font-code text-code text-center font-bold">
        {repaired}
      </td>
      <td className="py-space-sm px-space-md border-r-[2px] border-black font-headline-sm text-headline-sm text-right font-bold">
        {points}
      </td>
      <td className="py-space-sm px-space-md text-center">
        {statusBadge}
      </td>
    </tr>
  )
}

/* ------------------------------------------------------------ page */

export default function LeaderboardPage() {
  const [injected, setInjected] = useState(false)

  const {
    hero,
    round,
    podium,
    tableRows,
    bracketModal,
  } = leaderboard

  return (
    <div className="w-full">
      <div className="max-w-[1400px] mx-auto w-full px-gutter py-space-xl flex flex-col gap-space-xl">
        {/* ==================== 1. HERO / HEADER ==================== */}
        <section className="relative">

          {/* Hero Banner */}
          <div className="bg-surface-container-lowest border-[3.5px] border-black p-6 sm:p-10 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-fixed border-[2px] border-black font-label-sm text-label-sm text-on-secondary-fixed uppercase tracking-wider font-extrabold">
                  {hero.badge}
                </div>
                <h1 className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight">
                  {hero.title}
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant font-medium">
                  Tournament standings and bracket for the current round.
                </p>
              </div>

              {/* Stats / Status Bar */}
              <div className="flex flex-row sm:flex-col gap-3 min-w-[220px]">
                <div className="flex-1 bg-surface-container-low border-[2.5px] border-black p-3.5">
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                    {round.label}
                  </div>
                  <div className="font-headline-sm text-label-lg text-primary font-bold">
                    {round.clock}
                  </div>
                </div>
                <button
                  className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest text-on-surface border-[2.5px] border-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4.5px_4.5px_0_0_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all font-label-md text-label-md uppercase"
                  id="toggleSyncBtn">
                  <span className="material-symbols-outlined text-[18px]">sync</span>
                  Sync Scoreboard
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 2. PODIUM TRIO ==================== */}
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md items-end">
            {podium.map((rank) => (
              <div
                key={rank.rank}
                className={`flex flex-col justify-between h-full transition-transform hover:-translate-y-1 ${rank.rank === 1 ? "order-1 md:order-2 bg-secondary-container border-[3.5px] border-black p-space-md sm:p-space-lg relative overflow-hidden" : rank.rank === 2 ? "order-2 md:order-1 bg-primary-container border-[3px] border-black p-space-md flex flex-col justify-between h-full" : "order-3 md:order-3 bg-surface-container-low border-[3px] border-black p-space-md flex flex-col justify-between h-full"}`}
              >
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-10 h-10 rounded-full ${STATUS_TONE_BG[rank.statusTone]} border-[2.5px] border-black flex items-center justify-center font-headline-sm text-headline-sm text-on-surface font-bold`}
                    >
                      {`#${rank.rank}`}
                    </span>
                    {rank.rank === 3 && (
                      <span
                        className="px-space-sm py-1 bg-primary text-on-primary border-[2px] border-black font-label-sm text-label-sm uppercase font-bold tracking-wider animate-pulse"
                      >
                        ★ YOUR TEAM
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-headline-md text-headline-md uppercase text-on-surface leading-none">
                      {rank.team}
                    </div>
                  </div>
                </div>
                <div className="mt-space-md pt-space-sm border-t-[2px] border-black flex flex-col gap-space-xs">
                  <div className="flex items-baseline justify-between">
                    <span className="font-label-sm text-label-sm uppercase text-on-surface font-bold">PTS EARNED</span>
                    <span className="font-headline-md text-headline-md text-on-surface font-bold">
                      {rank.points}
                      <span className="font-code text-code text-on-surface"> PTS</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-space-xs text-center">
                    <div
                      className={`bg-surface-container-lowest border-[2px] border-black py-1 px-2`}
                    >
                      <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase">WIN STREAK</span>
                      <span className="font-code text-code text-on-surface font-bold">
                        {rank.solved > 30 ? "8 WINS ⚡" : rank.solved > 25 ? "5 WINS 🔥" : "3 WINS"}
                      </span>
                    </div>
                    <div
                      className={`bg-surface-container-lowest border-[2px] border-black py-1 px-2`}
                    >
                      <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase">SOLVED</span>
                      <span className="font-code text-code text-on-surface font-bold">
                        {rank.solved}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ==================== 3. TABLE ==================== */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-sm bg-surface-container-lowest border-[2.5px] border-black p-space-sm">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[20px] text-on-surface">tune</span>
              <span className="font-label-md text-label-md uppercase text-on-surface">ROSTER VIEW:</span>
              <div className="flex items-center gap-1">
                <button className="px-space-sm py-1 bg-secondary-container border-[1.5px] border-black font-label-sm text-label-sm uppercase text-on-surface cursor-pointer">
                  CHAMPIONSHIP (TOP 8)
                </button>
                <button className="px-space-sm py-1 bg-surface-container border-[1.5px] border-black hover:bg-surface-container-high transition-colors font-label-sm text-label-sm uppercase text-on-surface cursor-pointer">
                  ALL 32
                </button>
              </div>
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="font-code text-code text-on-surface-variant uppercase">QUICK SEARCH:</span>
              <div className="relative flex-1 sm:w-44">
                <input
                  className="w-full bg-surface border-[2px] border-black px-2 py-0.5 font-code text-code text-on-surface uppercase focus:outline-none focus:bg-surface-container-lowest"
                  id="syndicateSearchInput"
                  placeholder="FILTER TEAM..."
                  type="text"
                />
              </div>
            </div>
          </div>

          <div
            className="w-full overflow-x-auto bg-surface-container-lowest border-[3px] border-black"
          >
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-secondary-container border-b-[3px] border-black text-on-surface">
                  <th className="py-space-sm px-space-md font-label-md text-label-md uppercase border-r-[2px] border-black text-center w-16">
                    RANK
                  </th>
                  <th className="py-space-sm px-space-md font-label-md text-label-md uppercase border-r-[2px] border-black">
                    TEAM NAME
                  </th>
                  <th className="py-space-sm px-space-sm font-label-md text-label-md uppercase border-r-[2px] border-black text-center">
                    SOLVED
                  </th>
                  <th className="py-space-sm px-space-sm font-label-md text-label-md uppercase border-r-[2px] border-black text-center">
                    PLANTED
                  </th>
                  <th className="py-space-sm px-space-sm font-label-md text-label-md uppercase border-r-[2px] border-black text-center">
                    REPAIRED
                  </th>
                  {/* <th className="py-space-sm px-space-sm font-label-md text-label-md uppercase border-r-[2px] border-black text-center">
                    INTEGRITY
                  </th> */}
                  <th className="py-space-sm px-space-md font-label-md text-label-md uppercase border-r-[2px] border-black text-right">
                    POINTS
                  </th>
                  <th className="py-space-sm px-space-md font-label-md text-label-md uppercase text-center">
                    LIVE STATUS
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface divide-y-[2px] divide-black" id="leaderboardTableBody">
                {tableRows.map((row) => (
                  <RankRow
                    key={row.rank}
                    rank={row.rank}
                    team={row.team}
                    solved={row.solved}
                    planted={row.planted}
                    repaired={row.repaired}
                    integrity={row.integrity}
                    points={row.points}
                    status={row.status}
                    statusTone={row.statusTone}
                    isCurrentTeam={row.isCurrentTeam}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination Metadata */}
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-space-xs px-space-xs font-body-sm text-body-sm text-on-surface-variant"
          >
            <div>
              Showing <span className="font-bold text-on-surface">1 - 8</span> of <span className="font-bold text-on-surface">32</span> registered syndicates. Auto-refreshing every 10 seconds.
            </div>
            <div className="flex items-center gap-space-xs">
              <button
                className="px-space-sm py-1 bg-surface-container border-[2px] border-black font-label-sm text-label-sm uppercase hover:bg-surface-container-high transition-all cursor-pointer"
              >
                PREV
              </button>
              <span className="font-code text-code text-on-surface px-1">PAGE 01 / 04</span>
              <button
                className="px-space-sm py-1 bg-surface-container border-[2px] border-black font-label-sm text-label-sm uppercase hover:bg-surface-container-high transition-all cursor-pointer"
              >
                NEXT
              </button>
            </div>
          </div>
        </section>

        {/* ==================== 4. BRACKET MODAL ==================== */}
        <section>
          <div
            className="hidden fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-space-md backdrop-blur-sm"
            id="bracketMatrixModal"
          >
            <div
              className="bg-surface-container-lowest border-[4px] border-black max-w-4xl w-full p-space-lg flex flex-col gap-space-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b-[3px] border-black pb-space-sm">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[28px]">hub</span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface uppercase m-0">
                    {bracketModal.label}
                  </h2>
                </div>
                <button
                  type="button"
                  className="p-2.5 bg-surface-container-low hover:bg-surface-container border-[2px] border-black transition-all"
                >
                  &times;
                </button>
              </div>

              <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-primary text-on-primary font-bold font-bold">1</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    NullPointer Guild (1st)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold font-bold">2</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    ByteBandits (2nd)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed font-bold font-bold">3</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    Sher Syndicate (3rd) — YOUR TEAM
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Bracket continues through 32 teams · Auto-refresh every 10 seconds
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInjected(!injected)}
                className="px-3.5 py-1.5 bg-primary-container hover:bg-primary-container/90 border-[2px] border-black font-label-sm text-label-sm uppercase animate-pulse flex items-center gap-1 font-bold"
              >
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                {injected ? "Reset Clean Code" : "Inject 2-Token Flaw"}
              </button>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
                {bracketModal.hint}
              </p>
              <pre className="whitespace-pre">
                <code>
                  {bracketModal.cleanCode.map((line) => (
                    <div>
                      {line}
                    </div>
                  ))}
                </code>
              </pre>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
                Compiler: {bracketModal.compiler}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}