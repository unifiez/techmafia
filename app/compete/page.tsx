"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { competition, type OutputTone } from "./competition-data";

const TONE_CLASS: Record<OutputTone, string> = {
  muted: "text-[#8c706f]",
  ok: "text-[#4ade80]",
  default: "text-[#f4eeda]",
  error: "text-[#ff6b6b] font-bold",
  warn: "text-[#ffdad8]",
  info: "text-[#67e8f9]",
  pulse: "text-secondary-fixed animate-pulse",
};

function formatTime(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/** Placeholder code write pad — to be swapped for a real editor later. */
function CodePad({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const gutterRef = useRef<HTMLDivElement>(null);
  const padRef = useRef<HTMLTextAreaElement>(null);

  const lineCount = useMemo(() => value.split("\n").length, [value]);

  return (
    <div className="bg-[#1e1c10] text-[#f4eeda] font-code text-code flex h-[480px]">
      <div
        ref={gutterRef}
        className="flex flex-col select-none text-right pr-space-sm pl-space-md py-space-md text-[#8c706f] border-r border-[#8c706f]/40 overflow-hidden"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <span key={i}>{String(i + 1).padStart(2, "0")}</span>
        ))}
      </div>
      <textarea
        ref={padRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={() => {
          if (gutterRef.current && padRef.current) {
            gutterRef.current.scrollTop = padRef.current.scrollTop;
          }
        }}
        spellCheck={false}
        aria-label="Code write pad"
        className="flex-1 bg-transparent font-code text-code p-space-md outline-none resize-none whitespace-pre overflow-auto"
      />
    </div>
  );
}

export default function CompetePage() {
  const { liveLabel, round, teams, timer, problem, detectiveToken, codeFile, output, footer } =
    competition;

  const [secondsLeft, setSecondsLeft] = useState(timer.initialSeconds);
  const [code, setCode] = useState(codeFile.source);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const time = formatTime(secondsLeft);
  const tabTime = time.replace(":", " : ");

  return (
    <div className="flex flex-col w-full">
      <div className="max-w-[1400px] mx-auto w-full px-gutter py-space-md flex flex-col gap-space-lg">
        {/* Top Match HUD Bar */}
        <section className="w-full bg-surface-container-lowest p-space-md border-[3px] border-black flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-space-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-md">
                <span className="inline-block w-3 h-3 bg-primary rounded-full animate-ping border border-black" />
                <span className="font-code text-code text-primary uppercase font-bold tracking-wider">
                  {liveLabel}
                </span>
              </div>
              <h1 className="font-headline-md text-headline-md uppercase tracking-tight text-on-surface">
                {round.label} {round.number}
              </h1>
              <div className="flex flex-wrap items-center gap-space-xs text-on-surface-variant font-code text-body-sm">
                <span className="bg-secondary-container text-on-surface px-space-xs py-0.5 border-[2px] border-black font-bold">
                  {teams.alpha.label}: {teams.alpha.name} [{teams.alpha.role}]
                </span>
                <span className="font-bold">VS</span>
                <span className="bg-primary-container text-on-surface px-space-xs py-0.5 border-[2px] border-black font-bold">
                  {teams.target.label}: {teams.target.name} [{teams.target.role}]
                </span>
              </div>
            </div>
          </div>

          {/* Center Countdown Timer */}
          <div className="flex items-center justify-center">
            <div className="bg-secondary-container px-space-lg py-space-xs border-[3px] border-black flex flex-col items-center">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface">
                {timer.label}
              </span>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tighter">
                  {time}
                </span>
                {timer.recording ? (
                  <span className="font-code text-code text-primary animate-pulse font-bold">
                    REC
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* Main Live Workspace */}
        <div className="flex flex-col gap-4">
          {/* Row 1: Problem spec + detective token vault */}
          <section className="flex flex-row gap-space-md">
            {/* Spec Header Card */}
            <div className="bg-surface-container-lowest p-space-md border-[2.5px] border-black flex flex-col gap-space-xs flex-1">
              <div className="flex items-center justify-between flex-wrap gap-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span className="bg-tertiary-container text-on-surface px-space-xs py-0.5 border-[2px] border-black font-code text-label-sm font-bold">
                    {problem.cve}
                  </span>
                  <span className="font-headline-sm text-headline-sm uppercase text-on-surface">
                    Problem #{problem.number}: {problem.title}
                  </span>
                </div>
                <div className="flex items-center gap-space-xs font-code text-body-sm text-on-surface-variant">
                  <span>WEIGHT: {problem.weight.toLocaleString()} PTS</span>
                  <span>&bull;</span>
                  <span className="text-primary font-bold">
                    DIFFICULTY: {problem.difficulty}
                  </span>
                </div>
              </div>
              <p className="font-body-md text-body-md text-on-surface">
                {problem.description}
              </p>
            </div>

            {/* Detective Token Vault */}
            <div className="bg-surface-container-lowest p-space-md border-[2.5px] border-black flex flex-col gap-space-sm shrink-0">
              <div className="flex items-center justify-between gap-space-md">
                <span className="font-headline-sm text-headline-sm uppercase text-on-surface">
                  DETECTIVE TOKEN
                </span>
                <span className="bg-secondary px-space-xs py-0.5 border-[2px] border-black text-on-secondary font-code text-label-sm font-bold">
                  REMAINING: {detectiveToken.remaining}/{detectiveToken.total}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {detectiveToken.description}
              </p>
              <div className="grid grid-cols-6 gap-space-xs py-space-xs">
                {Array.from({ length: detectiveToken.total }, (_, i) => {
                  const active = i < detectiveToken.remaining;
                  return (
                    <div
                      key={i}
                      className={
                        active
                          ? "h-10 bg-secondary-container border-[2px] border-black flex items-center justify-center font-code font-bold text-on-surface"
                          : "h-10 bg-surface-container-high border-[2px] border-black opacity-50 flex items-center justify-center font-code text-on-surface-variant line-through"
                      }
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {active ? "token" : "lock"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Row 2: Code editor + output console */}
          <section className="flex flex-row gap-space-md">
            {/* Code Editor Chassis */}
            <div className="bg-inverse-surface border-[3px] border-black flex flex-1 flex-col">
              {/* File Tab Strip */}
              <div className="bg-surface-container border-b-[2.5px] border-black flex items-center justify-between px-space-sm pt-space-xs pb-space-xs gap-space-sm overflow-x-auto">
                <div className="flex items-end gap-space-xs font-code">
                  <button
                    type="button"
                    className="bg-surface-container-lowest border-[2px] border-black px-space-md py-space-xs font-label-md text-label-md text-on-surface flex items-center gap-space-xs -mb-[2px] z-10"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      code
                    </span>
                    {codeFile.name}
                    <span className="bg-primary-container text-on-surface text-[10px] px-1 py-0.2 border border-black font-bold">
                      {codeFile.status}
                    </span>
                  </button>
                </div>
                <div className="flex items-center gap-space-xs shrink-0">
                  <span className="bg-secondary-container px-space-xs py-0.5 border-[2px] border-black font-code text-label-sm text-on-surface">
                    Submit
                  </span>
                  <span className="bg-secondary-container px-space-xs py-0.5 border-[2px] border-black font-code text-label-sm text-on-surface">
                    Test &amp; Run
                  </span>
                  <span className="bg-primary-container px-space-xs py-0.5 border-[2px] border-black font-code text-label-sm text-on-surface">
                    {tabTime}
                  </span>
                </div>
              </div>

              {/* Placeholder write pad */}
              <CodePad value={code} onChange={setCode} />

              {/* Editor Footer Bar */}
              <div className="bg-surface-container-high border-t-[2px] border-black px-space-md py-space-xs flex items-center justify-between text-on-surface font-code text-body-sm">
                <div className="flex items-center gap-space-md">
                  <span className="flex items-center gap-1 font-bold">
                    <span className="w-2 h-2 rounded-full bg-primary" /> Line{" "}
                    {codeFile.cursor.line}, Col {codeFile.cursor.col}
                  </span>
                  <span className="hidden sm:inline">UTF-8</span>
                  <span className="hidden sm:inline">LF</span>
                </div>
              </div>
            </div>

            {/* Terminal Diagnostic Console */}
            <div className="bg-inverse-surface border-[2.5px] border-black flex flex-col font-code max-w-[420px]">
              <div className="bg-surface-container border-b-[2px] border-black px-space-sm py-1 flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase text-on-surface">
                  Output
                </span>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary border border-black" />
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary-container border border-black" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80] border border-black" />
                </div>
              </div>
              <div className="p-space-sm text-[#f4eeda] text-body-sm space-y-1 overflow-y-auto font-code">
                {output.map((line, i) => (
                  <div key={i} className={TONE_CLASS[line.tone]}>
                    {line.text}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
