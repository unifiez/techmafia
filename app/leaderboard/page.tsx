"use client";

import { useEffect, useMemo, useState } from "react";
import { leaderboard, type LeaderboardRank } from "./leaderboard-data";
import { apiGet } from "@/lib/client/api";

type Standing = {
  teamId: string;
  name: string;
  code: string | null;
  college: string;
  membersJoined: number;
  membersTotal: number;
  matches: number;
  wins: number;
  coderPoints: number;
  detectivePoints: number;
  totalPoints: number;
  flagged: boolean;
  status: "flagged" | "in_match" | "active" | "ready" | "forming";
};

type BoardMeta = {
  generatedAt: string;
  dbAvailable: boolean;
  registered: { teams: number; members: number };
  matches: { total: number; live: number; finalized: number; scheduled: number };
  tokensPlanted: number;
  round: {
    label: string;
    round: number;
    phase: string;
    endsAt: string | null;
    secondsLeft: number;
  } | null;
};

/* ------------------------------------------------------ theme helpers */

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

const STATUS_LABEL: Record<Standing["status"], string> = {
  flagged: "FLAGGED",
  in_match: "IN MATCH",
  active: "ACTIVE",
  ready: "READY",
  forming: "FORMING",
}

const STATUS_TONE: Record<Standing["status"], keyof typeof STATUS_TONE_BG> = {
  flagged: "container",
  in_match: "primary",
  active: "secondary",
  ready: "surface",
  forming: "surface",
}

function fmtClock(total: number) {
  const s = Math.max(0, Math.floor(total))
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

/* ---------------------------------------------------------- components */

function RankRow({ rank, team, solved, planted, repaired, points, status, statusTone, isCurrentTeam, college }: {
  rank: number; team: string; solved: number; planted: number; repaired: number; integrity: string; points: number; status: string; statusTone: "primary" | "secondary" | "surface" | "container"; isCurrentTeam?: boolean; college?: string
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
        {college ? (
          <div className="font-body-sm text-body-sm text-on-surface-variant normal-case font-normal truncate max-w-[340px]">
            {college}
          </div>
        ) : null}
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
  const [standings, setStandings] = useState<Standing[] | null>(null)
  const [meta, setMeta] = useState<BoardMeta | null>(null)
  const [myTeamId, setMyTeamId] = useState<string | null>(null)
  const [view, setView] = useState<"top" | "all">("all")
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [now, setNow] = useState(0)

  useEffect(() => {
    let stop = false
    const load = async () => {
      const [board, me] = await Promise.all([
        apiGet<{ standings: Standing[]; meta: BoardMeta }>("/api/leaderboard"),
        apiGet<{ team?: { id: string } | null }>("/api/auth/me"),
      ])
      if (stop) return
      if (board.ok) {
        setStandings(board.data.standings)
        setMeta(board.data.meta)
      }
      setMyTeamId(me.ok && me.data.team ? me.data.team.id : null)
    }
    void load()
    const id = setInterval(() => void load(), 10000)
    return () => {
      stop = true
      clearInterval(id)
    }
  }, [refreshKey])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const { hero, bracketModal } = leaderboard

  const liveRows = useMemo<LeaderboardRank[] | null>(() => {
    if (!standings) return null
    return standings.map((s, i) => ({
      rank: i + 1,
      team: s.name,
      solved: s.wins,
      planted: s.detectivePoints,
      repaired: s.coderPoints,
      integrity: `${s.membersJoined}/${s.membersTotal}`,
      points: s.totalPoints,
      status: s.flagged ? "FLAGGED" : STATUS_LABEL[s.status],
      statusIcon: s.flagged ? "gavel" : undefined,
      statusTone: STATUS_TONE[s.status],
      isCurrentTeam: Boolean(myTeamId && s.teamId === myTeamId),
      matches: s.matches,
      college: s.college,
    }))
  }, [standings, myTeamId])

  const top8 = view === "top"
  const filteredRows = useMemo(() => {
    const all = liveRows ?? []
    const base = top8 ? all.slice(0, 8) : all
    const q = query.trim().toLowerCase()
    return q ? base.filter((r) => r.team.toLowerCase().includes(q)) : base
  }, [liveRows, top8, query])

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const podium = (liveRows ?? []).slice(0, 3)
  const loaded = liveRows !== null
  const live = Boolean(liveRows && liveRows.length > 0)
  const dbOffline = Boolean(meta && !meta.dbAvailable)

  const roundLabel = meta?.round
    ? `ROUND ${String(meta.round.round).padStart(2, "0")} // ${meta.round.phase.toUpperCase()}`
    : "AWAITING ROUND"
  const roundClock = useMemo(() => {
    const r = meta?.round
    if (!r) return "--:--"
    if (!r.endsAt) return fmtClock(r.secondsLeft)
    const secs = now ? Math.max(0, Math.round((Date.parse(r.endsAt) - now) / 1000)) : r.secondsLeft
    return fmtClock(secs)
  }, [meta, now])

  const totalTeams = meta?.registered.teams ?? filteredRows.length

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
                  {" "}
                  {meta
                    ? `${meta.registered.teams} ${meta.registered.teams === 1 ? "team" : "teams"} registered · ${meta.matches.finalized} ${meta.matches.finalized === 1 ? "match" : "matches"} finalized.`
                    : "Loading live standings…"}
                </p>
              </div>

              {/* Stats / Status Bar */}
              <div className="flex flex-row sm:flex-col gap-3 min-w-[220px]">
                <div className="flex-1 bg-surface-container-low border-[2.5px] border-black p-3.5">
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                    {roundLabel}
                  </div>
                  <div className="font-headline-sm text-label-lg text-primary font-bold">
                    {roundClock}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRefreshKey((k) => k + 1)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-container-lowest text-on-surface border-[2.5px] border-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4.5px_4.5px_0_0_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all font-label-md text-label-md uppercase"
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
                    {rank.isCurrentTeam && (
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
                    {rank.college ? (
                      <div className="font-body-sm text-body-sm text-on-surface-variant mt-1 truncate">
                        {rank.college}
                      </div>
                    ) : null}
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
                      <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase">MATCHES</span>
                      <span className="font-code text-code text-on-surface font-bold">
                        {rank.matches ?? 0}
                      </span>
                    </div>
                    <div
                      className={`bg-surface-container-lowest border-[2px] border-black py-1 px-2`}
                    >
                      <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase">WINS</span>
                      <span className="font-code text-code text-on-surface font-bold">
                        {rank.solved}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {podium.length === 0 && (
              <div className="md:col-span-3 bg-surface-container-lowest border-[3px] border-black p-space-md text-center font-body-md text-body-md text-on-surface-variant">
                {loaded ? "No results yet — the podium fills in as matches are finalized." : "Loading standings…"}
              </div>
            )}
          </div>
        </section>

        {/* ==================== 3. TABLE ==================== */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-sm bg-surface-container-lowest border-[2.5px] border-black p-space-sm">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[20px] text-on-surface">tune</span>
              <span className="font-label-md text-label-md uppercase text-on-surface">ROSTER VIEW:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => { setView("top"); setPage(1) }}
                  className={`px-space-sm py-1 border-[1.5px] border-black font-label-sm text-label-sm uppercase text-on-surface cursor-pointer ${top8 ? "bg-secondary-container" : "bg-surface-container hover:bg-surface-container-high transition-colors"}`}
                >
                  CHAMPIONSHIP (TOP 8)
                </button>
                <button
                  type="button"
                  onClick={() => { setView("all"); setPage(1) }}
                  className={`px-space-sm py-1 border-[1.5px] border-black font-label-sm text-label-sm uppercase text-on-surface cursor-pointer ${!top8 ? "bg-secondary-container" : "bg-surface-container hover:bg-surface-container-high transition-colors"}`}
                >
                  ALL {totalTeams}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="font-code text-code text-on-surface-variant uppercase">QUICK SEARCH:</span>
              <div className="relative flex-1 sm:w-44">
                <input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1) }}
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
                    WINS
                  </th>
                  <th className="py-space-sm px-space-sm font-label-md text-label-md uppercase border-r-[2px] border-black text-center">
                    ATTACK
                  </th>
                  <th className="py-space-sm px-space-sm font-label-md text-label-md uppercase border-r-[2px] border-black text-center">
                    REPAIR
                  </th>
                  <th className="py-space-sm px-space-md font-label-md text-label-md uppercase border-r-[2px] border-black text-right">
                    POINTS
                  </th>
                  <th className="py-space-sm px-space-md font-label-md text-label-md uppercase text-center">
                    LIVE STATUS
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface divide-y-[2px] divide-black" id="leaderboardTableBody">
                {pageRows.map((row) => (
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
                    college={row.college}
                  />
                ))}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-space-lg px-space-md text-center font-body-md text-body-md text-on-surface-variant">
                      {loaded ? "No teams match your search." : "Loading live standings…"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination Metadata */}
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-space-xs px-space-xs font-body-sm text-body-sm text-on-surface-variant"
          >
            <div>
              Showing <span className="font-bold text-on-surface">
                {filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredRows.length)}
              </span> of <span className="font-bold text-on-surface">{filteredRows.length}</span> teams.
              {" "}
              {dbOffline
                ? "Live database not connected — no teams are registered yet."
                : live
                  ? "Live standings."
                  : "Awaiting first results."}
            </div>
            <div className="flex items-center gap-space-xs">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, Math.min(p, totalPages) - 1))}
                disabled={currentPage <= 1}
                className="px-space-sm py-1 bg-surface-container border-[2px] border-black font-label-sm text-label-sm uppercase hover:bg-surface-container-high transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                PREV
              </button>
              <span className="font-code text-code text-on-surface px-1">PAGE {String(currentPage).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, Math.min(p, totalPages) + 1))}
                disabled={currentPage >= totalPages}
                className="px-space-sm py-1 bg-surface-container border-[2px] border-black font-label-sm text-label-sm uppercase hover:bg-surface-container-high transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
                {podium.map((rank) => (
                  <div key={rank.rank} className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center">{rank.rank}</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      {rank.team} ({rank.rank === 1 ? "1st" : rank.rank === 2 ? "2nd" : "3rd"})
                    </span>
                  </div>
                ))}
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Bracket continues through {totalTeams} teams · Auto-refresh every 10 seconds
                </p>
              </div>
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
