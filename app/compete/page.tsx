"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/client/api";
import {
  joinSource,
  setModuleBody,
  splitSource,
  type Segment,
} from "@/lib/client/code";
import { useFairPlay } from "../components/anti-cheat";
import { Alert, Btn, Card, Spinner } from "../components/ui";

/* ── types mirroring the sanitized server view ───────────── */

type ProblemView = {
  key: string;
  number: number;
  title: string;
  description: string;
  difficulty: string;
  weight: number;
  concepts: string[];
  modules: { key: string; description: string; role: string }[];
};

type ModuleView = {
  key: string;
  title: string;
  authorName: string | null;
  isMine: boolean;
  repairOwnerName: string | null;
};

type AttackView = {
  type: string;
  label: string;
  cost: number;
  moduleKey?: string;
  applied: boolean;
  detail: string;
  at: string;
};

type CatalogueEntry = {
  label: string;
  cost: number;
  icon: string;
  description: string;
  tier: number;
};

type MatchView = {
  id: string;
  label: string;
  round: number;
  phase: string;
  phaseStartedAt: string;
  phaseEndsAt: string;
  remainingSeconds: number;
  role: "coder" | "detective" | null;
  teamId: string;
  baselineClean: boolean;
  config: {
    difficulty: string;
    tokenBudget: number;
    attackCooldownSeconds: number;
    rotateRepairs: boolean;
  };
  code: string;
  modules: ModuleView[];
  moduleProgress: { key: string; title: string; filled: boolean }[];
  tokens: { budget: number; spent: number; remaining: number };
  cooldownRemaining: number;
  attacks?: AttackView[];
  catalogue?: Record<string, CatalogueEntry>;
  lastRun: { passed: number; total: number; at: string } | null;
  finalSubmission: {
    passed: number;
    total: number;
    status: string;
    message: string;
    at: string;
  } | null;
  result?: {
    coderScore: number;
    detectiveScore: number;
    coderBreakdown: { label: string; awarded: number; max: number }[];
    detectiveBreakdown: { label: string; awarded: number; max: number }[];
    winner: string;
  } | null;
};

type CurrentResponse = {
  authenticated: boolean;
  hasTeam?: boolean;
  hasMatch: boolean;
  disqualified?: boolean;
  disqualification?: { reason?: string } | null;
  serverNow?: string;
  problem?: ProblemView | null;
  match?: MatchView;
};

const PHASES = ["lobby", "briefing", "coding", "attack", "repair", "testing", "complete"];
const PHASE_LABEL: Record<string, string> = {
  lobby: "Lobby",
  briefing: "Briefing",
  coding: "Coding",
  attack: "Infiltration",
  repair: "Repair",
  testing: "Test & Submit",
  complete: "Complete",
};

function fmt(total: number) {
  const s = Math.max(0, Math.floor(total));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/* ── code editor (fenced segments) ───────────────────────── */

function CodeEditor({
  segments,
  editable,
  onEdit,
}: {
  segments: Segment[];
  editable: (key: string) => boolean;
  onEdit: (key: string, body: string) => void;
}) {
  return (
    <div className="bg-[#1e1c10] text-[#f4eeda] font-code text-code overflow-auto max-h-[600px]">
      {segments.map((seg, i) =>
        seg.kind === "text" ? (
          <pre
            key={i}
            className="px-space-md whitespace-pre-wrap break-words text-[#a99a86] leading-6"
          >
            {seg.text}
          </pre>
        ) : (
          <div
            key={i}
            className={`border-l-[3px] ${
              editable(seg.key) ? "border-secondary-container" : "border-[#584140]"
            }`}
          >
            <div className="flex items-center justify-between px-space-sm py-0.5 bg-[#333023]">
              <span className="text-[11px] uppercase tracking-widest text-secondary-container">
                ▸ module {seg.key}
              </span>
              <span
                className={`text-[11px] uppercase ${
                  editable(seg.key) ? "text-[#4ade80]" : "text-[#8c706f]"
                }`}
              >
                {editable(seg.key) ? "editable" : "locked"}
              </span>
            </div>
            <textarea
              value={seg.body}
              readOnly={!editable(seg.key)}
              spellCheck={false}
              onChange={(e) => onEdit(seg.key, e.target.value)}
              rows={Math.min(24, Math.max(3, seg.body.split("\n").length + 1))}
              className={`w-full bg-transparent px-space-md py-space-sm outline-none resize-y whitespace-pre leading-6 ${
                editable(seg.key) ? "text-[#f4eeda]" : "text-[#a99a86] opacity-80"
              }`}
            />
          </div>
        ),
      )}
    </div>
  );
}

/* ── page ────────────────────────────────────────────────── */

export default function CompetePage() {
  const router = useRouter();
  const [view, setView] = useState<CurrentResponse | null>(null);
  const [error, setError] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [dirty, setDirty] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [busy, setBusy] = useState<string>("");
  const [clockOffset, setClockOffset] = useState(0);
  const [now, setNow] = useState(0);
  const [attackType, setAttackType] = useState<string>("");
  const [attackModule, setAttackModule] = useState<string>("");
  const [externalChange, setExternalChange] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dirtyRef = useRef(false);
  const serverCodeRef = useRef("");

  const match = view?.match ?? null;
  const phase = match?.phase ?? "";

  const pushOutput = useCallback((line: string) => {
    setOutput((prev) => [...prev.slice(-24), line]);
  }, []);

  const applyView = useCallback((data: CurrentResponse) => {
    setView(data);
    if (data.serverNow) {
      setClockOffset(Date.parse(data.serverNow) - Date.now());
    }
    const code = data.match?.code ?? "";
    if (code !== serverCodeRef.current) {
      if (!dirtyRef.current) {
        setSegments(splitSource(code));
        serverCodeRef.current = code;
        setExternalChange(false);
      } else {
        // The file changed on the server (e.g. an attack landed) while the
        // local editor has unsaved edits — warn instead of clobbering them.
        setExternalChange(true);
      }
    }
  }, []);

  const load = useCallback(async () => {
    const res = await apiGet<CurrentResponse>("/api/match/current");
    if (!res.ok) {
      if (res.status === 401) router.push("/login");
      else setError(res.error);
      return;
    }
    applyView(res.data);
  }, [router, applyView]);

  useEffect(() => {
    const id = setInterval(() => void load(), 3000);
    const t = setTimeout(() => void load(), 0);
    return () => {
      clearInterval(id);
      clearTimeout(t);
    };
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const h = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  function enterFocus() {
    void document.documentElement.requestFullscreen?.().catch(() => {});
  }

  const live = phase === "coding" || phase === "attack" || phase === "repair" || phase === "testing";

  useFairPlay({
    active: Boolean(view?.authenticated && view?.hasMatch && live && match?.role),
    matchId: match?.id,
    onDisqualified: (reason) => {
      setError(reason);
      void load();
    },
  });

  const remaining = useMemo(() => {
    if (!match) return 0;
    // Until the first client tick lands, trust the server-computed value.
    if (!now) return Math.max(0, match.remainingSeconds);
    const endsAt = Date.parse(match.phaseEndsAt);
    return Math.max(0, Math.round((endsAt - (now + clockOffset)) / 1000));
  }, [match, now, clockOffset]);

  const modulesByKey = useMemo(() => {
    const map: Record<string, ModuleView> = {};
    for (const m of match?.modules ?? []) map[m.key] = m;
    return map;
  }, [match]);

  const descByKey = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of view?.problem?.modules ?? []) map[m.key] = m.description;
    return map;
  }, [view]);

  const editable = useCallback(
    (key: string) =>
      match?.role === "coder" &&
      (phase === "coding" || phase === "repair") &&
      Boolean(modulesByKey[key]?.isMine),
    [match, phase, modulesByKey],
  );

  const fullCode = useCallback(() => joinSource(segments), [segments]);

  const onEdit = useCallback((key: string, body: string) => {
    setSegments((prev) => setModuleBody(prev, key, body));
    dirtyRef.current = true;
    setDirty(true);
  }, []);

  async function save(withCode: boolean, url: string, label: string) {
    setBusy(label);
    const sent = withCode ? fullCode() : "";
    const res = await apiPost<Record<string, unknown>>(url, withCode ? { code: sent } : {});
    setBusy("");
    if (!res.ok) {
      pushOutput(`✗ ${res.error}`);
      return;
    }
    const data = res.data as {
      message?: string;
      passed?: number;
      total?: number;
      accepted?: boolean;
      applied?: boolean;
      detail?: string;
    };
    if (withCode) {
      dirtyRef.current = false;
      serverCodeRef.current = sent;
      setDirty(false);
      setExternalChange(false);
    }
    if (label === "save") {
      pushOutput("✓ Changes saved.");
    } else if (typeof data.message === "string") {
      pushOutput(`${data.accepted ? "✓" : "•"} ${data.message}`);
    }
    void load();
  }

  function reloadFromServer() {
    dirtyRef.current = false;
    setDirty(false);
    setExternalChange(false);
    setSegments(splitSource(serverCodeRef.current));
  }

  async function attack() {
    if (!attackType || !attackModule) {
      pushOutput("• Choose an attack and a target module first.");
      return;
    }
    setBusy("attack");
    const res = await apiPost<{ message?: string }>("/api/match/attack", {
      type: attackType,
      moduleKey: attackModule,
    });
    setBusy("");
    if (!res.ok) {
      pushOutput(`✗ ${res.error}`);
      return;
    }
    pushOutput(`• ${res.data.message ?? "Attack resolved."}`);
    void load();
  }

  /* ── render guards ─────────────────────────────────────── */

  if (error && !view) {
    return (
      <div className="flex-1 flex items-center justify-center px-gutter py-space-xl">
        <Alert tone="error">{error}</Alert>
      </div>
    );
  }

  if (!view) {
    return (
      <div className="flex-1 flex items-center justify-center px-gutter py-space-xl">
        <Spinner />
      </div>
    );
  }

  if (view.disqualified) {
    return (
      <div className="flex-1 flex items-center justify-center px-gutter py-space-xl">
        <Card className="max-w-[560px] p-space-xl flex flex-col gap-space-md text-center border-error">
          <span className="material-symbols-outlined text-error text-[48px] self-center">
            gavel
          </span>
          <h1 className="font-headline-md text-headline-md uppercase text-error">
            Disqualified
          </h1>
          <p className="font-body-md text-on-surface-variant">
            {view.disqualification?.reason ??
              "A fair-play violation was detected. Your session is locked."}
          </p>
          <p className="font-body-sm text-on-surface-variant">
            Speak to the organizers if you believe this is a mistake.
          </p>
        </Card>
      </div>
    );
  }

  if (!view.authenticated) {
    return (
      <div className="flex-1 flex items-center justify-center px-gutter py-space-xl">
        <Card className="max-w-[480px] p-space-xl flex flex-col gap-space-md text-center">
          <h1 className="font-headline-md text-headline-md uppercase">Sign in required</h1>
          <p className="font-body-md text-on-surface-variant">
            Log in to enter the arena.
          </p>
          <Btn onClick={() => router.push("/login")}>Sign in</Btn>
        </Card>
      </div>
    );
  }

  if (!view.hasTeam) {
    return (
      <div className="flex-1 flex items-center justify-center px-gutter py-space-xl">
        <Card className="max-w-[480px] p-space-xl flex flex-col gap-space-md text-center">
          <h1 className="font-headline-md text-headline-md uppercase">Join a team first</h1>
          <p className="font-body-md text-on-surface-variant">
            Register or join your team before entering the arena.
          </p>
          <div className="flex gap-space-sm justify-center">
            <Btn onClick={() => router.push("/register")}>Register</Btn>
            <Btn variant="ghost" onClick={() => router.push("/team")}>
              My team
            </Btn>
          </div>
        </Card>
      </div>
    );
  }

  if (!view.hasMatch || !match) {
    return (
      <div className="flex-1 flex items-center justify-center px-gutter py-space-xl">
        <Card className="max-w-[560px] p-space-xl flex flex-col gap-space-md text-center">
          <div className="self-center w-14 h-14 bg-surface-container-high border-[2.5px] border-black flex items-center justify-center">
            <span className="material-symbols-outlined animate-spin">hourglass_top</span>
          </div>
          <h1 className="font-headline-md text-headline-md uppercase">
            Waiting for a match
          </h1>
          <p className="font-body-md text-on-surface-variant">
            Your team is not in a live match yet. The organizer will pair you
            against another team. This page refreshes automatically.
          </p>
          <Btn variant="ghost" onClick={() => void load()}>
            Refresh
          </Btn>
        </Card>
      </div>
    );
  }

  const isCoder = match.role === "coder";
  const isDetective = match.role === "detective";
  const catalogue = match.catalogue ?? {};
  const attackKeys = Object.keys(catalogue);
  const canEdit = isCoder && (phase === "coding" || phase === "repair");

  return (
    <div className="max-w-[1400px] mx-auto w-full px-gutter py-space-md flex flex-col gap-space-md">
      {/* HUD */}
      <section className="bg-surface-container-lowest border-[3px] border-black p-space-md flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-sm">
            <span className="inline-block w-3 h-3 bg-primary rounded-full animate-ping border border-black" />
            <span className="font-code text-code text-primary uppercase font-bold tracking-wider">
              {live ? "LIVE ARENA" : "ARENA"}
            </span>
          </div>
          <h1 className="font-headline-md text-headline-md uppercase tracking-tight">
            {match.label}
          </h1>
          <div className="flex flex-wrap items-center gap-space-xs font-code text-body-sm">
            <span className="bg-secondary-container px-space-xs py-0.5 border-[2px] border-black font-bold uppercase">
              You: {match.role ?? "spectator"}
            </span>
            <span className="text-on-surface-variant">
              {view.problem ? `Problem #${view.problem.number} · ${view.problem.title}` : match.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-md">
          <div className="bg-secondary-container px-space-lg py-space-xs border-[3px] border-black flex flex-col items-center min-w-[140px]">
            <span className="font-label-sm text-label-sm uppercase tracking-widest">
              {PHASE_LABEL[phase] ?? phase}
            </span>
            <span className="font-headline-xl text-headline-xl font-bold tracking-tighter">
              {fmt(remaining)}
            </span>
          </div>
          <div className="flex flex-col gap-space-xs font-code text-body-sm">
            <span className="px-space-sm py-0.5 bg-surface-container-high border-[2px] border-black uppercase">
              {match.config.difficulty}
            </span>
            <span className="px-space-sm py-0.5 bg-surface-container-high border-[2px] border-black">
              tokens {match.tokens.remaining}/{match.tokens.budget}
            </span>
          </div>
          {!isFullscreen && live ? (
            <Btn variant="dark" onClick={enterFocus} className="self-center">
              <span className="material-symbols-outlined text-[16px]">fullscreen</span>
              Focus mode
            </Btn>
          ) : null}
        </div>
      </section>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {externalChange && canEdit ? (
        <Alert tone="info">
          The file changed on the server (a bug may have been planted) while you
          have unsaved edits.{" "}
          <button
            type="button"
            onClick={reloadFromServer}
            className="underline underline-offset-2 font-bold"
          >
            Reload from server (discards local edits)
          </button>
        </Alert>
      ) : null}

      {/* phase timeline */}
      <div className="flex flex-wrap items-center gap-1">
        {PHASES.map((p) => {
          const idx = PHASES.indexOf(p);
          const cur = PHASES.indexOf(phase);
          const state = idx < cur ? "done" : idx === cur ? "current" : "todo";
          return (
            <span
              key={p}
              className={`px-space-sm py-0.5 border-[2px] border-black font-code text-label-sm uppercase ${
                state === "current"
                  ? "bg-primary-container text-on-primary-container"
                  : state === "done"
                    ? "bg-secondary-container text-on-secondary-container"
                    : "bg-surface-container-low text-on-surface-variant"
              }`}
            >
              {PHASE_LABEL[p]}
            </span>
          );
        })}
      </div>

      {/* problem + side panel */}
      <section className="flex flex-col lg:flex-row gap-space-md">
        <Card className="flex-1 p-space-md flex flex-col gap-space-sm">
          <div className="flex items-center justify-between flex-wrap gap-space-xs">
            <span className="font-headline-sm text-headline-sm uppercase">
              {view.problem
                ? `Problem #${view.problem.number}: ${view.problem.title}`
                : "Problem"}
            </span>
            {view.problem ? (
              <span className="font-code text-body-sm text-on-surface-variant">
                WEIGHT {view.problem.weight} · {view.problem.difficulty}
              </span>
            ) : null}
          </div>
          <p className="font-body-md text-body-md whitespace-pre-wrap">
            {view.problem?.description ?? "—"}
          </p>
          {view.problem?.concepts?.length ? (
            <div className="flex flex-wrap gap-space-xs pt-space-xs">
              {view.problem.concepts.map((c) => (
                <span
                  key={c}
                  className="px-space-xs py-0.5 bg-tertiary-fixed border-[2px] border-black font-code text-label-sm"
                >
                  {c}
                </span>
              ))}
            </div>
          ) : null}
        </Card>

        <Card className="lg:w-[360px] p-space-md flex flex-col gap-space-sm">
          <span className="font-headline-sm text-headline-sm uppercase">
            Modules
          </span>
          <div className="flex flex-col gap-space-xs">
            {match.moduleProgress.map((mp) => {
              const mod = modulesByKey[mp.key];
              const owner = phase === "repair" ? mod?.repairOwnerName : mod?.authorName;
              return (
                <div
                  key={mp.key}
                  className={`px-space-sm py-space-xs border-[2px] border-black font-code text-body-sm ${
                    mod?.isMine && canEdit ? "bg-secondary-container" : "bg-surface-container-low"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase">
                      {mp.key} · {mp.title}
                    </span>
                    <span>{mp.filled ? "✓" : "…"}</span>
                  </div>
                  <div className="text-on-surface-variant truncate">
                    {phase === "repair" ? "repair: " : "author: "}
                    {owner ?? "—"}
                    {mod?.isMine && canEdit ? " ← you" : ""}
                  </div>
                  {descByKey[mp.key] ? (
                    <div className="text-on-surface-variant/80 text-[12px] leading-tight mt-0.5">
                      {descByKey[mp.key]}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* detective attack panel */}
      {isDetective && phase === "attack" ? (
        <Card className="p-space-md flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <span className="font-headline-sm text-headline-sm uppercase">
              Inject bugs
            </span>
            <span className="font-code text-body-sm">
              {match.tokens.remaining} / {match.tokens.budget} tokens
              {match.cooldownRemaining > 0
                ? ` · cooldown ${match.cooldownRemaining}s`
                : ""}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
            {attackKeys.map((key) => {
              const a = catalogue[key];
              const affordable = a.cost <= match.tokens.remaining;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!affordable}
                  onClick={() => setAttackType(key)}
                  className={`text-left p-space-sm border-[2.5px] border-black transition-all disabled:opacity-40 ${
                    attackType === key
                      ? "bg-primary-container text-on-primary-container"
                      : "bg-surface-container-low hover:bg-surface-container-high"
                  }`}
                >
                  <div className="flex items-center gap-space-xs font-label-md uppercase">
                    <span className="material-symbols-outlined text-[18px]">
                      {a.icon}
                    </span>
                    {a.label}
                    <span className="ml-auto font-code text-label-sm">
                      {a.cost}◆
                    </span>
                  </div>
                  <div className="font-body-sm text-on-surface-variant mt-1">
                    {a.description}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-end gap-space-sm">
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-md text-label-md uppercase">
                Target module
              </span>
              <div className="flex flex-wrap gap-space-xs">
                {match.modules.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setAttackModule(m.key)}
                    className={`px-space-sm py-space-xs border-[2px] border-black font-code text-body-sm ${
                      attackModule === m.key
                        ? "bg-tertiary-container text-on-tertiary-container"
                        : "bg-surface-container-low"
                    }`}
                  >
                    {m.key} · {m.title}
                  </button>
                ))}
              </div>
            </div>
            <Btn
              variant="danger"
              onClick={() => void attack()}
              disabled={busy === "attack"}
              className="ml-auto"
            >
              {busy === "attack" ? <Spinner /> : null} Inject
            </Btn>
          </div>
          {match.attacks?.length ? (
            <div className="flex flex-col gap-1 max-h-[180px] overflow-auto border-t-[2px] border-black/20 pt-space-sm">
              {match.attacks
                .slice()
                .reverse()
                .map((a, i) => (
                  <div key={i} className="font-code text-body-sm">
                    <span className={a.applied ? "text-primary" : "text-on-surface-variant"}>
                      {a.applied ? "●" : "○"} {a.label} → {a.moduleKey} · {a.detail}
                    </span>
                  </div>
                ))}
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* editor + output */}
      <section className="flex flex-col lg:flex-row gap-space-md">
        <div className="bg-inverse-surface border-[3px] border-black flex flex-1 flex-col min-w-0">
          <div className="bg-surface-container border-b-[2.5px] border-black flex items-center justify-between px-space-sm py-space-xs gap-space-sm">
            <span className="font-label-md text-label-md uppercase flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary">
                code
              </span>
              solution.c
            </span>
            <div className="flex items-center gap-space-xs">
              {dirty ? (
                <span className="bg-secondary-container px-space-xs py-0.5 border-[2px] border-black font-code text-label-sm">
                  UNSAVED
                </span>
              ) : null}
              <span className="bg-surface-container-lowest px-space-xs py-0.5 border-[2px] border-black font-code text-label-sm">
                {PHASE_LABEL[phase]}
              </span>
            </div>
          </div>

          <CodeEditor segments={segments} editable={editable} onEdit={onEdit} />

          <div className="bg-surface-container-high border-t-[2px] border-black px-space-md py-space-xs flex flex-wrap items-center gap-space-sm">
            {canEdit ? (
              <Btn
                variant="secondary"
                onClick={() => void save(true, "/api/match/code", "save")}
                disabled={busy === "save" || !dirty}
              >
                {busy === "save" ? <Spinner /> : null} Save
              </Btn>
            ) : null}
            {(phase === "coding" || phase === "attack" || phase === "repair" || phase === "testing") &&
            isCoder ? (
              <Btn
                variant="dark"
                onClick={() => void save(true, "/api/match/run", "run")}
                disabled={busy === "run"}
              >
                {busy === "run" ? <Spinner /> : null} Test &amp; Run
              </Btn>
            ) : null}
            {(phase === "repair" || phase === "testing") && isCoder ? (
              <Btn
                variant="primary"
                onClick={() => void save(true, "/api/match/submit", "submit")}
                disabled={busy === "submit"}
              >
                {busy === "submit" ? <Spinner /> : null} Submit final
              </Btn>
            ) : null}
            {isDetective ? (
              <span className="font-code text-body-sm text-on-surface-variant">
                You cannot edit the code — inject bugs above.
              </span>
            ) : null}
            {!canEdit && isCoder && phase === "attack" ? (
              <span className="font-code text-body-sm text-on-surface-variant">
                Editor locked during infiltration.
              </span>
            ) : null}
          </div>
        </div>

        <div className="bg-inverse-surface border-[2.5px] border-black flex flex-col lg:w-[420px] lg:max-w-[420px]">
          <div className="bg-surface-container border-b-[2px] border-black px-space-sm py-1 flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase">Output</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-primary border border-black" />
              <span className="w-2.5 h-2.5 rounded-full bg-secondary-container border border-black" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80] border border-black" />
            </div>
          </div>
          <div className="p-space-sm text-[#f4eeda] font-code text-body-sm space-y-1 overflow-auto max-h-[520px] min-h-[220px]">
            <div className="text-[#a99a86]">
              {isCoder
                ? "> Solve your assigned modules. Only public tests are visible."
                : "> Coordinate with your team and plant bugs during the attack window."}
            </div>
            {output.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
            <div className="text-[#a99a86] animate-pulse">_</div>
          </div>
        </div>
      </section>

      {/* result */}
      {match.result ? (
        <Card className="p-space-lg flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md uppercase">
              Final result
            </h2>
            <span className="px-space-md py-space-xs bg-secondary-container border-[3px] border-black font-label-lg uppercase">
              {match.result.winner}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
            {[
              { title: "Coders", score: match.result.coderScore, rows: match.result.coderBreakdown },
              { title: "Detectives", score: match.result.detectiveScore, rows: match.result.detectiveBreakdown },
            ].map((card) => (
              <div key={card.title} className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between font-headline-sm uppercase">
                  <span>{card.title}</span>
                  <span>{card.score} / 100</span>
                </div>
                {card.rows.map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center justify-between font-code text-body-sm border-b border-black/10 py-0.5"
                  >
                    <span className="truncate">{r.label}</span>
                    <span>
                      {r.awarded}/{r.max}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
