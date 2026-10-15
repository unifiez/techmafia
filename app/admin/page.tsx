"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/client/api";
import { Alert, Btn, Card, Input, Label, Select, Spinner } from "../components/ui";

/* ── types ───────────────────────────────────────────────── */

type MemberRow = {
  name: string;
  roll: string;
  memberIndex: number;
  joined: boolean;
  userId: string | null;
  disqualified: boolean;
  online: boolean;
};

type TeamRow = {
  id: string;
  name: string;
  code: string;
  college: string;
  status: string;
  flagged: boolean;
  flagReason: string | null;
  joined: number;
  members: MemberRow[];
};

type MatchRow = {
  id: string;
  label: string;
  round: number;
  problemKey: string;
  phase: string;
  phaseEndsAt: string;
  coderTeam: string;
  detectiveTeam: string;
  coderTeamId: string | null;
  detectiveTeamId: string | null;
  tokens: { budget: number; spent: number };
  attacks: number;
  appliedAttacks: number;
  baselineClean: boolean;
  result: { winner?: string } | null;
  config: { difficulty: string };
};

type StandingRow = {
  teamId: string;
  name: string;
  matches: number;
  wins: number;
  coderPoints: number;
  detectivePoints: number;
  totalPoints: number;
  status: string;
};

type StateResponse = {
  teams: TeamRow[];
  matches: MatchRow[];
  problems: { key: string; number: number; title: string; difficulty: string; publicTests: number; hiddenTests: number }[];
  violations: { id: string; type: string; detail: string; disqualified: boolean; at: string; user: string; team: string }[];
  presets: Record<string, unknown>;
  counts: { teams: number; ready: number; matches: number; problems: number };
  standings: StandingRow[];
};

type JudgeResult = {
  accepted: boolean;
  status: string;
  statusId: number;
  engine: string;
  latencyMs: number;
  stdout: string;
  stderr: string;
  compileOutput: string;
  time: string | null;
  memory: number | null;
  config: {
    mode: string;
    url: string;
    fallbackEnabled: boolean;
    concurrencyMax: number;
  };
};

const PHASES = ["lobby", "briefing", "coding", "attack", "repair", "testing", "complete"];

/* ── page ────────────────────────────────────────────────── */

export default function AdminPage() {
  const [organizer, setOrganizer] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");
  const [state, setState] = useState<StateResponse | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [tab, setTab] = useState<"overview" | "teams" | "matches" | "fairplay" | "judge">("overview");

  const refresh = useCallback(async () => {
    const res = await apiGet<StateResponse>("/api/admin/state");
    if (res.ok) setState(res.data);
  }, []);

  useEffect(() => {
    void (async () => {
      const res = await apiGet<{ organizer: boolean }>("/api/admin/session");
      setOrganizer(res.ok ? res.data.organizer : false);
    })();
  }, []);

  useEffect(() => {
    if (!organizer) return;
    const id = setInterval(() => void refresh(), 4000);
    const t = setTimeout(() => void refresh(), 0);
    return () => {
      clearInterval(id);
      clearTimeout(t);
    };
  }, [organizer, refresh]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setBusy("login");
    const res = await apiPost("/api/admin/login", { passcode });
    setBusy("");
    if (!res.ok) {
      setAuthError(res.error);
      return;
    }
    setOrganizer(true);
  }

  async function act(label: string, url: string, body: unknown) {
    setBusy(label);
    setNotice("");
    const res = await apiPost<Record<string, unknown>>(url, body);
    setBusy("");
    if (!res.ok) {
      setNotice(`✗ ${res.error}`);
      return;
    }
    const msg = typeof res.data?.message === "string" ? res.data.message : `${label} done.`;
    setNotice(`✓ ${msg}`);
    void refresh();
  }

  if (organizer === null) {
    return (
      <div className="flex-1 flex items-center justify-center px-gutter py-space-xl">
        <Spinner />
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="flex-1 flex items-center justify-center px-gutter py-space-xl">
        <Card className="w-full max-w-[460px] p-space-xl flex flex-col gap-space-md">
          <div className="flex flex-col items-center gap-space-sm text-center">
            <div className="w-14 h-14 bg-inverse-surface text-[#f4eeda] border-[2.5px] border-black flex items-center justify-center -rotate-3">
              <span className="material-symbols-outlined text-[28px]">admin_panel_settings</span>
            </div>
            <h1 className="font-headline-md text-headline-md uppercase">
              Organizer console
            </h1>
          </div>
          {authError ? <Alert tone="error">{authError}</Alert> : null}
          <form onSubmit={login} className="flex flex-col gap-space-sm">
            <Label>Passcode</Label>
            <Input
              type="password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="••••••••"
            />
            <Btn type="submit" disabled={busy === "login"} className="py-space-md">
              {busy === "login" ? <Spinner /> : null} Unlock
            </Btn>
          </form>
        </Card>
      </div>
    );
  }

  const s = state;

  return (
    <div className="max-w-[1400px] mx-auto w-full px-gutter py-space-md flex flex-col gap-space-md">
      <div className="flex flex-wrap items-center justify-between gap-space-md">
        <h1 className="font-headline-lg text-headline-lg uppercase tracking-tight">
          Organizer console
        </h1>
        <div className="flex items-center gap-space-sm">
          <Btn variant="ghost" onClick={() => void refresh()}>
            Refresh
          </Btn>
          <Btn
            variant="dark"
            onClick={() => void act("Seed data", "/api/admin/seed", { problems: true })}
            disabled={busy === "Seed data"}
          >
            {busy === "Seed data" ? <Spinner /> : null} Seed data
          </Btn>
          <Btn
            variant="danger"
            onClick={async () => {
              await apiPost("/api/admin/session", {});
              setOrganizer(false);
            }}
          >
            Lock
          </Btn>
        </div>
      </div>

      {notice ? (
        <Alert tone={notice.startsWith("✗") ? "error" : "ok"}>{notice}</Alert>
      ) : null}

      {s ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm">
            {[
              { label: "Teams", value: s.counts.teams },
              { label: "Ready+", value: s.counts.ready },
              { label: "Matches", value: s.counts.matches },
              { label: "Problems", value: s.counts.problems },
            ].map((c) => (
              <Card key={c.label} className="p-space-md flex flex-col">
                <span className="font-code text-body-sm uppercase text-on-surface-variant">
                  {c.label}
                </span>
                <span className="font-headline-md text-headline-md font-bold">
                  {c.value}
                </span>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap gap-space-xs">
            {(["overview", "teams", "matches", "fairplay", "judge"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-space-md py-space-xs border-[2.5px] border-black font-label-md uppercase ${
                  tab === t
                    ? "bg-primary-container text-on-primary-container"
                    : "bg-surface-container-lowest"
                }`}
              >
                {t === "fairplay" ? "Fair play" : t === "judge" ? "Judge test" : t}
              </button>
            ))}
          </div>

          {tab === "overview" ? <Overview s={s} /> : null}
          {tab === "matches" ? (
            <Matches s={s} busy={busy} act={act} />
          ) : null}
          {tab === "teams" ? <Teams s={s} act={act} busy={busy} /> : null}
          {tab === "fairplay" ? <FairPlay s={s} /> : null}
          {tab === "judge" ? <JudgeTest /> : null}
        </>
      ) : (
        <Spinner />
      )}
    </div>
  );
}

/* ── tabs ────────────────────────────────────────────────── */

function Overview({ s }: { s: StateResponse }) {
  return (
    <div className="flex flex-col gap-space-md">
      <Standings s={s} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
        <Card className="p-space-md flex flex-col gap-space-sm">
          <h2 className="font-headline-sm uppercase">Problems</h2>
          {s.problems.length === 0 ? (
            <Alert tone="info">
              No problems seeded yet. Click “Seed data”.
            </Alert>
          ) : (
            s.problems.map((p) => (
              <div
                key={p.key}
                className="flex items-center justify-between font-code text-body-sm border-b border-black/10 py-1"
              >
                <span>
                  #{p.number} {p.title}
                </span>
                <span className="text-on-surface-variant">
                  {p.difficulty} · {p.publicTests} pub / {p.hiddenTests} hid
                </span>
              </div>
            ))
          )}
        </Card>

        <Card className="p-space-md flex flex-col gap-space-sm">
          <h2 className="font-headline-sm uppercase">Recent violations</h2>
          {s.violations.length === 0 ? (
            <span className="font-code text-body-sm text-on-surface-variant">
              None recorded. Clean arena.
            </span>
          ) : (
            s.violations.slice(0, 10).map((v) => (
              <div key={v.id} className="font-code text-body-sm border-b border-black/10 py-1">
                <span className={v.disqualified ? "text-error font-bold" : ""}>
                  {v.type}
                </span>{" "}
                · {v.user} ({v.team})
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

/** Aggregated wins + points across finalized matches — the running winner table. */
function Standings({ s }: { s: StateResponse }) {
  const rows = s.standings ?? [];
  const decided = rows.some((r) => r.matches > 0);
  return (
    <Card className="p-space-md flex flex-col gap-space-sm">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <h2 className="font-headline-sm uppercase">Standings</h2>
        <span className="font-code text-body-sm text-on-surface-variant">
          {decided ? "Ranked by total points" : "No finalized matches yet"}
        </span>
      </div>
      {rows.length === 0 ? (
        <span className="font-code text-body-sm text-on-surface-variant">No teams yet.</span>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full font-code text-body-sm">
            <thead>
              <tr className="text-left text-on-surface-variant uppercase">
                <th className="py-1 pr-space-sm">#</th>
                <th className="py-1 pr-space-sm">Team</th>
                <th className="py-1 pr-space-sm">Played</th>
                <th className="py-1 pr-space-sm">Wins</th>
                <th className="py-1 pr-space-sm">Coder</th>
                <th className="py-1 pr-space-sm">Detective</th>
                <th className="py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.teamId} className="border-t border-black/10">
                  <td className="py-1 pr-space-sm">{i + 1}</td>
                  <td className="py-1 pr-space-sm">
                    {r.name}
                    {r.status === "flagged" ? (
                      <span className="text-error font-bold"> ⚑</span>
                    ) : null}
                  </td>
                  <td className="py-1 pr-space-sm">{r.matches}</td>
                  <td className="py-1 pr-space-sm">{r.wins}</td>
                  <td className="py-1 pr-space-sm">{r.coderPoints}</td>
                  <td className="py-1 pr-space-sm">{r.detectivePoints}</td>
                  <td className="py-1 font-bold">{r.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

type Act = (label: string, url: string, body: unknown) => Promise<void>;

function Matches({ s, busy, act }: { s: StateResponse; busy: string; act: Act }) {
  const [problemKey, setProblemKey] = useState(s.problems[0]?.key ?? "");
  const [coderId, setCoderId] = useState("");
  const [detectiveId, setDetectiveId] = useState("");
  const [preset, setPreset] = useState("rulebook20");
  const [label, setLabel] = useState("");
  const [autoPreset, setAutoPreset] = useState("rulebook20");
  const [autoProblem, setAutoProblem] = useState("");

  return (
    <div className="flex flex-col gap-space-md">
      <Card className="p-space-md flex flex-col gap-space-sm border-[3px] border-black">
        <h2 className="font-headline-sm uppercase">⚡ Start a round — all teams</h2>
        <p className="font-code text-body-sm text-on-surface-variant">
          Pairs every team that has a joined member at random (each team plays at most once),
          assigns the same problem to every match, and creates them in the lobby. Teams already
          in a match are skipped; an odd team out gets a bye.
        </p>
        {s.problems.length === 0 ? (
          <Alert tone="error">Seed problems first.</Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm items-end">
            <div className="flex flex-col gap-space-xs">
              <Label>Problem (same for all)</Label>
              <Select value={autoProblem} onChange={(e) => setAutoProblem(e.target.value)}>
                <option value="">Auto — random problem</option>
                {s.problems.map((p) => (
                  <option key={p.key} value={p.key}>
                    #{p.number} {p.title}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-space-xs">
              <Label>Preset</Label>
              <Select value={autoPreset} onChange={(e) => setAutoPreset(e.target.value)}>
                {Object.keys(s.presets).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </Select>
            </div>
            <Btn
              variant="secondary"
              onClick={() =>
                void act("Start round", "/api/admin/match/auto", {
                  presetKey: autoPreset,
                  problemKey: autoProblem || undefined,
                })
              }
              disabled={busy === "Start round"}
            >
              {busy === "Start round" ? <Spinner /> : null} Start round for all teams
            </Btn>
          </div>
        )}
        <div className="flex flex-wrap gap-space-xs">
          <Btn
            variant="dark"
            onClick={() =>
              void act("Advance all", "/api/admin/match/phase", { all: true, action: "advance" })
            }
            disabled={busy === "Advance all"}
          >
            {busy === "Advance all" ? <Spinner /> : null} Advance all matches →
          </Btn>
        </div>
      </Card>

      <Card className="p-space-md flex flex-col gap-space-sm">
        <h2 className="font-headline-sm uppercase">Create match</h2>
        {s.problems.length === 0 ? (
          <Alert tone="error">Seed problems first.</Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-space-sm items-end">
            <div className="flex flex-col gap-space-xs">
              <Label>Problem</Label>
              <Select value={problemKey} onChange={(e) => setProblemKey(e.target.value)}>
                {s.problems.map((p) => (
                  <option key={p.key} value={p.key}>
                    #{p.number} {p.title}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-space-xs">
              <Label>Coder team</Label>
              <Select value={coderId} onChange={(e) => setCoderId(e.target.value)}>
                <option value="">—</option>
                {s.teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.joined}/4)
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-space-xs">
              <Label>Detective team</Label>
              <Select value={detectiveId} onChange={(e) => setDetectiveId(e.target.value)}>
                <option value="">—</option>
                {s.teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.joined}/4)
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-space-xs">
              <Label>Preset</Label>
              <Select value={preset} onChange={(e) => setPreset(e.target.value)}>
                {Object.keys(s.presets).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-space-xs">
              <Label>Label</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Round 1" />
            </div>
            <div className="md:col-span-2 xl:col-span-5">
              <Btn
                onClick={() =>
                  void act("Create match", "/api/admin/match", {
                    problemKey,
                    coderTeamId: coderId,
                    detectiveTeamId: detectiveId,
                    presetKey: preset,
                    label,
                  })
                }
                disabled={busy === "Create match" || !coderId || !detectiveId}
              >
                {busy === "Create match" ? <Spinner /> : null} Create match
              </Btn>
            </div>
          </div>
        )}
      </Card>

      {s.matches.map((m) => (
        <Card key={m.id} className="p-space-md flex flex-col gap-space-sm">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex flex-col">
              <span className="font-headline-sm uppercase">
                {m.label} · {m.problemKey}
              </span>
              <span className="font-code text-body-sm text-on-surface-variant">
                {m.coderTeam} (coders) vs {m.detectiveTeam} (detectives) · {m.config.difficulty}
              </span>
            </div>
            <span className="px-space-sm py-space-xs bg-secondary-container border-[2.5px] border-black font-code text-label-md uppercase">
              {m.phase}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm font-code text-body-sm text-on-surface-variant">
            <span>tokens {m.tokens.spent}/{m.tokens.budget}</span>
            <span>attacks {m.appliedAttacks}/{m.attacks}</span>
            <span>baseline {m.baselineClean ? "clean" : "not clean"}</span>
            {m.result ? <span className="text-primary">winner: {m.result.winner}</span> : null}
          </div>
          <div className="flex flex-wrap gap-space-xs">
            <Btn
              variant="secondary"
              onClick={() => void act("Advance phase", "/api/admin/match/phase", { matchId: m.id, action: "advance" })}
              disabled={busy === "Advance phase"}
            >
              Advance →
            </Btn>
            {PHASES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() =>
                  void act("Set phase", "/api/admin/match/phase", { matchId: m.id, action: "set", phase: p })
                }
                className="px-space-sm py-0.5 bg-surface-container-low border-[2px] border-black font-code text-label-sm hover:bg-primary-container"
              >
                {p}
              </button>
            ))}
            <Btn
              variant="dark"
              onClick={() =>
                void act("Finalize", "/api/admin/match/finalize", { matchId: m.id, runHidden: true })
              }
              disabled={busy === "Finalize"}
            >
              {busy === "Finalize" ? <Spinner /> : null} Finalize (run hidden)
            </Btn>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Teams({ s, act, busy }: { s: StateResponse; act: Act; busy: string }) {
  return (
    <div className="flex flex-col gap-space-sm">
      {s.teams.map((t) => (
        <Card key={t.id} className="p-space-md flex flex-col gap-space-sm">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <span className="font-headline-sm uppercase">{t.name}</span>
              <span className="font-code text-body-sm text-on-surface-variant">
                code {t.code} · {t.joined}/4
              </span>
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="px-space-sm py-0.5 bg-surface-container-high border-[2px] border-black font-code text-label-sm uppercase">
                {t.status}
              </span>
              <Btn
                variant={t.flagged ? "ghost" : "danger"}
                onClick={() =>
                  void act(t.flagged ? "Unflag team" : "Flag team", "/api/admin/team/flag", {
                    teamId: t.id,
                    flagged: !t.flagged,
                    reason: "Flagged by organizer",
                  })
                }
                disabled={busy === "Flag team" || busy === "Unflag team"}
              >
                {t.flagged ? "Unflag" : "Flag"}
              </Btn>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-xs">
            {t.members.map((m) => (
              <div
                key={m.memberIndex}
                className="flex items-center justify-between gap-space-sm px-space-sm py-space-xs bg-surface-container-low border-[2px] border-black font-code text-body-sm"
              >
                <div className="flex items-center gap-space-xs">
                  <span
                    className={`w-2.5 h-2.5 rounded-full border border-black ${
                      m.online ? "bg-[#4ade80]" : "bg-surface-dim"
                    }`}
                  />
                  <span>{m.name}</span>
                  <span className="text-on-surface-variant">{m.roll}</span>
                  {m.disqualified ? (
                    <span className="text-error font-bold">DQ</span>
                  ) : null}
                </div>
                {m.userId ? (
                  <Btn
                    variant={m.disqualified ? "ghost" : "danger"}
                    onClick={() =>
                      void act(m.disqualified ? "Reinstate" : "Disqualify", "/api/admin/user/disqualify", {
                        userId: m.userId,
                        disqualified: !m.disqualified,
                        reason: "Organizer action",
                      })
                    }
                    disabled={busy === "Disqualify" || busy === "Reinstate"}
                  >
                    {m.disqualified ? "Reinstate" : "DQ"}
                  </Btn>
                ) : (
                  <span className="text-on-surface-variant">not joined</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function FairPlay({ s }: { s: StateResponse }) {
  return (
    <Card className="p-space-md flex flex-col gap-space-xs">
      <h2 className="font-headline-sm uppercase">Violation log</h2>
      {s.violations.length === 0 ? (
        <span className="font-code text-body-sm text-on-surface-variant">
          No violations recorded.
        </span>
      ) : (
        s.violations.map((v) => (
          <div
            key={v.id}
            className="flex flex-wrap items-center justify-between gap-space-sm border-b border-black/10 py-space-xs font-code text-body-sm"
          >
            <span>
              <span className={v.disqualified ? "text-error font-bold" : "font-bold"}>
                {v.type}
              </span>{" "}
              · {v.user} · {v.team}
            </span>
            <span className="text-on-surface-variant">
              {new Date(v.at).toLocaleString()}
            </span>
          </div>
        ))
      )}
      <span className="text-on-surface-variant font-code text-body-sm mt-space-sm">
        Use the Teams tab to flag a team or disqualify a participant.
      </span>
    </Card>
  );
}

/* ── judge self-test ─────────────────────────────────────── */

const SAMPLE_SUM = `#include <stdio.h>
int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d", a + b);
    return 0;
}
`;

const SAMPLE_BROKEN = `#include <stdio.h>
int main() {
    printf("hi"  // missing );
    return 0;
}
`;

function JudgeTest() {
  const [source, setSource] = useState(SAMPLE_SUM);
  const [stdin, setStdin] = useState("2 3");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    setResult(null);
    const res = await apiPost<JudgeResult>("/api/admin/judge-test", { source, stdin });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResult(res.data);
  }

  const tone = result
    ? result.accepted
      ? "bg-secondary-container"
      : result.status === "internal_error"
        ? "bg-tertiary-fixed"
        : "bg-error-container"
    : "";

  return (
    <div className="flex flex-col gap-space-md">
      <Card className="p-space-md flex flex-col gap-space-sm">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <h2 className="font-headline-sm uppercase">Judge test</h2>
          <span className="font-code text-body-sm text-on-surface-variant">
            Write C, run it on the same checker participants use.
          </span>
        </div>
        <p className="font-code text-body-sm text-on-surface-variant">
          This shows RAW compiler output and which engine answered — players never see this.
          Press “Run test”: if you get a result below, the checker is working.
        </p>

        <div className="flex flex-wrap items-end gap-space-sm">
          <div className="flex flex-col gap-space-xs min-w-[220px]">
            <Label hint="Optional program input">stdin</Label>
            <Input value={stdin} onChange={(e) => setStdin(e.target.value)} placeholder="e.g. 2 3" />
          </div>
          <div className="flex flex-wrap gap-space-xs">
            <Btn variant="ghost" onClick={() => setSource(SAMPLE_SUM)} type="button">
              Sample: sum
            </Btn>
            <Btn variant="ghost" onClick={() => setSource(SAMPLE_BROKEN)} type="button">
              Sample: broken
            </Btn>
          </div>
        </div>

        <Label>C source</Label>
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          spellCheck={false}
          rows={12}
          className="w-full px-space-md py-space-sm bg-surface-container-lowest text-on-surface font-code text-code border-[2.5px] border-black focus:outline-none focus:shadow-[4px_4px_0px_#000] focus:-translate-x-[1px] focus:-translate-y-[1px] transition-all resize-y"
        />

        <div className="flex flex-wrap items-center gap-space-sm">
          <Btn variant="dark" onClick={() => void run()} disabled={busy} type="button">
            {busy ? <Spinner /> : null} Run test
          </Btn>
          {result ? (
            <span className="font-code text-body-sm text-on-surface-variant">
              judged in {result.latencyMs} ms
            </span>
          ) : null}
        </div>
      </Card>

      {error ? <Alert tone="error">{error}</Alert> : null}

      {result ? (
        <Card className={`p-space-md flex flex-col gap-space-sm ${tone}`}>
          <div className="flex flex-wrap items-center gap-space-sm">
            <span className="px-space-sm py-space-xs border-[2.5px] border-black font-code text-label-md uppercase">
              {result.accepted ? "✓ accepted" : `✗ ${result.status}`}
            </span>
            <span className="font-code text-body-sm">
              engine: <b>{result.engine}</b>
            </span>
            <span className="font-code text-body-sm">{result.latencyMs} ms</span>
            {result.time ? <span className="font-code text-body-sm">cpu {result.time}s</span> : null}
            {result.memory ? <span className="font-code text-body-sm">{result.memory} KB</span> : null}
          </div>

          {result.stdout ? (
            <div className="flex flex-col gap-space-xs">
              <Label>stdout</Label>
              <pre className="p-space-sm bg-inverse-surface text-[#f4eeda] font-code text-code border-[2.5px] border-black overflow-x-auto whitespace-pre-wrap">
                {result.stdout}
              </pre>
            </div>
          ) : null}

          {result.compileOutput ? (
            <div className="flex flex-col gap-space-xs">
              <Label hint="raw — players never see this">compiler output</Label>
              <pre className="p-space-sm bg-inverse-surface text-[#f4eeda] font-code text-code border-[2.5px] border-black overflow-x-auto whitespace-pre-wrap">
                {result.compileOutput}
              </pre>
            </div>
          ) : null}

          {result.stderr ? (
            <div className="flex flex-col gap-space-xs">
              <Label>stderr</Label>
              <pre className="p-space-sm bg-inverse-surface text-[#f4eeda] font-code text-code border-[2.5px] border-black overflow-x-auto whitespace-pre-wrap">
                {result.stderr}
              </pre>
            </div>
          ) : null}

          {!result.stdout && !result.compileOutput && !result.stderr ? (
            <span className="font-code text-body-sm">
              {result.accepted ? "Ran successfully (no output)." : "No output produced."}
            </span>
          ) : null}

          <span className="font-code text-body-sm text-on-surface-variant">
            judge: {result.config.mode} · {result.config.url} · concurrency {result.config.concurrencyMax}
            {result.config.fallbackEnabled ? " · auto-failover on" : " · failover off"}
          </span>
        </Card>
      ) : null}
    </div>
  );
}
